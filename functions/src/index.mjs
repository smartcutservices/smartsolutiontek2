import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";
import { onObjectFinalized } from "firebase-functions/v2/storage";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import sharp from "sharp";
import { deleteOwnedDraftProject, parseDraftProjectCleanupRequest } from "./draft-project-cleanup.mjs";
import { deleteOwnedDemoAccount, parseAccountDeletionRequest, DEMO_ACCOUNT_DELETION_PROJECT_ID } from "./account-cleanup.mjs";
import { resolveOwnedTenantExport, walkFirestoreDocument } from "./account-export.mjs";
import { processUploadedDraftImage } from "./media/process-draft-image.mjs";

const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_CONFIG && JSON.parse(process.env.FIREBASE_CONFIG).projectId;
if (!projectId) throw new Error("Firebase project ID is required for the image-processing function.");
const storageBucket = process.env.FUNCTION_STORAGE_BUCKET
  || `${projectId}${projectId.startsWith("demo-") ? ".appspot.com" : ".firebasestorage.app"}`;

const app = initializeApp({
  projectId,
  storageBucket,
});
const firestore = getFirestore(app);

export const processDraftImage = onObjectFinalized({
  bucket: storageBucket,
  retry: true,
  memory: "512MiB",
  timeoutSeconds: 120,
  maxInstances: 3,
}, async (event) => {
  const bucketName = event.data.bucket;
  const bucket = getStorage(app).bucket(bucketName);
  return processUploadedDraftImage({ eventData: event.data, bucket, firestore, sharp, fieldValue: FieldValue });
});

export const deleteDraftProject = onCall({ region: "us-central1", maxInstances: 2 }, async (request) => {
  const parsed = parseDraftProjectCleanupRequest(request);
  if (!parsed.ok) throw new HttpsError(parsed.code === "UNAUTHENTICATED" ? "unauthenticated" : "invalid-argument", parsed.code);
  if (projectId !== DEMO_ACCOUNT_DELETION_PROJECT_ID) {
    throw new HttpsError("failed-precondition", "Project deletion is restricted to the local demo environment.");
  }

  try {
    return await deleteOwnedDraftProject({
      uid: parsed.uid,
      projectId: parsed.projectId,
      firestore,
      bucket: getStorage(app).bucket(storageBucket),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PROJECT_OWNERSHIP_MISMATCH") {
      throw new HttpsError("permission-denied", "The authenticated user does not own this project.");
    }
    throw new HttpsError("internal", "Project cleanup failed. Completed steps can be retried safely.");
  }
});

export const deleteDemoAccount = onCall({ region: "us-central1", maxInstances: 1 }, async (request) => {
  const parsed = parseAccountDeletionRequest(request);
  if (!parsed.ok) throw new HttpsError(parsed.code === "UNAUTHENTICATED" ? "unauthenticated" : "invalid-argument", parsed.code);
  if (projectId !== DEMO_ACCOUNT_DELETION_PROJECT_ID) {
    throw new HttpsError("failed-precondition", "Account deletion is restricted to the local demo environment.");
  }

  try {
    return await deleteOwnedDemoAccount({
      uid: parsed.uid,
      firestore,
      bucket: getStorage(app).bucket(storageBucket),
      authAdmin: getAuth(app),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ACCOUNT_OWNERSHIP_MISMATCH") {
      throw new HttpsError("permission-denied", "Account data ownership could not be verified.");
    }
    throw new HttpsError("internal", "Account cleanup failed. Completed cleanup steps can be retried safely.");
  }
});



const accountExportOrigins = new Set([
  "http://localhost:3010",
  "http://127.0.0.1:3010",
  ...(process.env.SST_PUBLIC_ORIGIN ? [process.env.SST_PUBLIC_ORIGIN] : []),
]);

function writeExportLine(response, record) {
  const line = `${JSON.stringify(record)}\n`;
  if (response.write(line)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    response.once("drain", resolve);
    response.once("error", reject);
  });
}

export const exportDemoAccount = onRequest({ region: "us-central1", maxInstances: 2, timeoutSeconds: 300 }, async (request, response) => {
  const origin = request.get("origin");
  if (!origin || !accountExportOrigins.has(origin)) {
    response.status(403).json({ error: "origin-not-allowed" });
    return;
  }
  response.set("Access-Control-Allow-Origin", origin);
  response.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Authorization");
  response.set("Access-Control-Expose-Headers", "Content-Disposition");
  response.set("Vary", "Origin");
  response.set("Cache-Control", "no-store");
  response.set("X-Content-Type-Options", "nosniff");
  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }
  if (request.method !== "GET") {
    response.status(405).json({ error: "method-not-allowed" });
    return;
  }
  if (projectId !== DEMO_ACCOUNT_DELETION_PROJECT_ID) {
    response.status(412).json({ error: "demo-emulator-only" });
    return;
  }
  const authorization = request.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    response.status(401).json({ error: "authentication-required" });
    return;
  }

  let uid;
  let email = null;
  let displayName = null;
  try {
    const identity = await getAuth(app).verifyIdToken(match[1]);
    uid = identity.uid;
    email = identity.email || null;
    displayName = identity.name || null;
    const scope = await resolveOwnedTenantExport({ uid, firestore });
    const date = new Date().toISOString();
    const dateTag = date.slice(0, 10);
    response.set("Content-Type", "application/x-ndjson; charset=utf-8");
    response.set("Content-Disposition", `attachment; filename="smartsolutiontek-account-${dateTag}.jsonl"`);
    response.status(200);
    await writeExportLine(response, {
      recordType: "account-export",
      schemaVersion: 1,
      exportedAt: date,
      account: { uid, email, displayName },
      encoding: "UTF-8 JSON Lines; Storage object bytes are base64 in storage-object records.",
    });
    for await (const document of walkFirestoreDocument(scope.tenantRef)) {
      await writeExportLine(response, { recordType: "firestore-document", ...document });
    }
    const bucket = getStorage(app).bucket(storageBucket);
    const [files] = await bucket.getFiles({ prefix: `sstTenants/${uid}/` });
    for (const file of files) {
      const [contents] = await file.download();
      await writeExportLine(response, {
        recordType: "storage-object",
        path: file.name,
        contentType: file.metadata.contentType || "application/octet-stream",
        sizeBytes: contents.byteLength,
        dataBase64: contents.toString("base64"),
      });
    }
    response.end();
  } catch (error) {
    if (response.headersSent) {
      response.destroy(error instanceof Error ? error : undefined);
      return;
    }
    if (error instanceof Error && error.message === "ACCOUNT_OWNERSHIP_MISMATCH") {
      response.status(403).json({ error: "tenant-ownership-invalid" });
      return;
    }
    if (error && typeof error === "object" && "code" in error && error.code === "auth/argument-error") {
      response.status(401).json({ error: "invalid-auth-token" });
      return;
    }
    response.status(500).json({ error: "account-export-failed" });
  }
});
