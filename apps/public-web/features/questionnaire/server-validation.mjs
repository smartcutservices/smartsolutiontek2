import { validateQuestionnaireAnswers } from "./engine.mjs";
import { validateQuestionnaireSchema } from "./schema.mjs";

export const MAX_QUESTIONNAIRE_REQUEST_BYTES = 64 * 1024;

function failure(status, code, details = {}) {
  return { status, body: { ok: false, code, ...details } };
}

/** Read bounded JSON without buffering an unbounded request body. */
export async function readBoundedJsonBody(request, maxBytes = MAX_QUESTIONNAIRE_REQUEST_BYTES) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > maxBytes) {
    return { ok: false, status: 413, code: "body-too-large" };
  }
  if (!request.body) return { ok: false, status: 400, code: "invalid-json" };

  const reader = request.body.getReader();
  const chunks = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > maxBytes) {
        await reader.cancel();
        return { ok: false, status: 413, code: "body-too-large" };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(byteLength);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return { ok: false, status: 400, code: "invalid-json" };
  } finally {
    reader.releaseLock();
  }
}

/** Validate IDs, version and answers against a schema resolved by trusted server code. */
export function validateQuestionnaireRequest(body, resolveSchema) {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return failure(400, "invalid-request");
  const keys = Object.keys(body);
  if (keys.some((key) => !["sectorId", "schemaId", "schemaVersion", "answers"].includes(key))) return failure(400, "unsupported-request-field");

  const input = body;
  if (typeof input.sectorId !== "string" || typeof input.schemaId !== "string" || typeof input.schemaVersion !== "string" || typeof input.answers !== "object" || input.answers === null || Array.isArray(input.answers)) {
    return failure(400, "invalid-request");
  }

  const schema = resolveSchema(input.sectorId);
  if (!schema) return failure(404, "unknown-sector");
  if (input.schemaId !== schema.schemaId) return failure(400, "schema-sector-mismatch");
  if (input.schemaVersion !== schema.schemaVersion) return failure(409, "schema-version-mismatch", { currentSchemaVersion: schema.schemaVersion });
  if (validateQuestionnaireSchema(schema).length > 0) return failure(500, "server-schema-invalid");

  const errors = validateQuestionnaireAnswers(schema, input.answers);
  if (errors.length > 0) return failure(422, "answers-invalid", { errors });
  return { status: 200, body: { ok: true, schemaId: schema.schemaId, schemaVersion: schema.schemaVersion, errors: [] } };
}

/** HTTP contract used by the Next route and exercised with standard Request/Response objects. */
export async function handleQuestionnaireValidationRequest(request, resolveSchema) {
  const contentType = (request.headers.get("content-type") ?? "").split(";", 1)[0].trim().toLowerCase();
  const respond = (body, status) => Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff" },
  });
  if (contentType !== "application/json") return respond({ ok: false, code: "content-type-required" }, 415);

  const parsed = await readBoundedJsonBody(request);
  if (!parsed.ok) return respond({ ok: false, code: parsed.code }, parsed.status);
  try {
    const result = validateQuestionnaireRequest(parsed.value, resolveSchema);
    return respond(result.body, result.status);
  } catch {
    return respond({ ok: false, code: "server-validation-unavailable" }, 500);
  }
}
