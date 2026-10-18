import { createHash } from "node:crypto";
import path from "node:path";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_PIXELS = 40_000_000;
const MAX_DIMENSION = 12_000;
const MAX_VARIANT_WIDTH = 1920;
const INPUT_FORMATS = new Map([
  ["image/jpeg", new Set(["jpeg"])],
  ["image/png", new Set(["png"])],
  ["image/webp", new Set(["webp"])],
  ["image/avif", new Set(["heif:av1"])],
]);

export function parseDraftImagePath(objectName) {
  const match = /^sstTenants\/([^/]+)\/projects\/([^/]+)\/drafts\/quarantine\/([^/]+)$/.exec(objectName || "");
  if (!match) return null;
  const upload = /^(.+)\.([0-9a-f-]{36})\.(png|jpe?g|webp|avif)$/i.exec(match[3]);
  if (!upload) return null;
  let key;
  try { key = decodeURIComponent(upload[1]); } catch { return null; }
  if (!key || key.length > 180 || key.includes("/") || key.includes("\\") || key === "." || key === "..") return null;
  return { tenantId: match[1], projectId: match[2], key, uploadId: upload[2], extension: upload[3].toLowerCase() };
}

export function responsiveImageWidths(width) {
  if (!Number.isInteger(width) || width < 1) return [];
  const ceiling = Math.min(width, MAX_VARIANT_WIDTH);
  return [...new Set([320, 640, 960, 1280, 1920].filter((candidate) => candidate < ceiling).concat(ceiling))].sort((a, b) => a - b);
}

function formatIsValid(metadata, contentType, extension) {
  const expectedFormats = INPUT_FORMATS.get(contentType);
  if (!expectedFormats) return false;
  const actualFormat = metadata.format === "heif" && metadata.compression === "av1"
    ? "heif:av1"
    : metadata.format;
  if (!expectedFormats.has(actualFormat)) return false;
  return contentType === "image/jpeg"
    ? extension === "jpg" || extension === "jpeg"
    : extension === contentType.slice("image/".length);
}

async function removeRejectedUpload({ draftRef, sourceFile, key, sourcePath, fieldValue, reason }) {
  await draftRef.firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(draftRef);
    if (!snapshot.exists) return;
    const data = snapshot.data();
    const configuration = data.configuration;
    if (!configuration || configuration.images?.[key] !== sourcePath) return;
    const images = { ...configuration.images };
    delete images[key];
    transaction.update(draftRef, {
      configuration: { ...configuration, images },
      revision: Number(data.revision) + 1,
      updatedAt: fieldValue.serverTimestamp(),
    });
  });
  await sourceFile.delete({ ignoreNotFound: true });
  console.warn("Rejected an invalid draft image upload", { sourcePath, reason });
}

async function deletePrefix(bucket, prefix) {
  const [files] = await bucket.getFiles({ prefix });
  await Promise.all(files.map((file) => file.delete({ ignoreNotFound: true })));
}

/**
 * Validates and normalizes a private draft upload, then points the owner draft
 * at immutable, metadata-stripped WebP variants. Clients are injected to keep
 * this handler testable against Firebase Emulator.
 */
export async function processUploadedDraftImage({ eventData, bucket, firestore, sharp, fieldValue, clock = Date.now }) {
  const parsed = parseDraftImagePath(eventData?.name);
  const sourcePath = eventData?.name;
  if (!eventData?.bucket || eventData.bucket !== bucket.name) {
    return { status: "ignored" };
  }
  if (!parsed) {
    const malformedQuarantineUpload = typeof sourcePath === "string"
      && /^sstTenants\/[^/]+\/projects\/[^/]+\/drafts\/quarantine\//.test(sourcePath);
    if (malformedQuarantineUpload) await bucket.file(sourcePath).delete({ ignoreNotFound: true });
    return { status: "ignored" };
  }

  const sourceFile = bucket.file(sourcePath);
  const projectRef = firestore.doc(`sstTenants/${parsed.tenantId}/projects/${parsed.projectId}`);
  const projectSnapshot = await projectRef.get();
  if (!projectSnapshot.exists) throw new Error("Draft image project is not ready yet; retry after the save batch.");
  const project = projectSnapshot.data();
  if (project.ownerUid !== parsed.tenantId || project.tenantId !== parsed.tenantId || project.projectId !== parsed.projectId || project.status !== "draft") {
    await sourceFile.delete({ ignoreNotFound: true });
    return { status: "rejected", reason: "project-owner" };
  }

  const draftRef = projectRef.collection("drafts").doc(parsed.projectId);
  const draftSnapshot = await draftRef.get();
  if (!draftSnapshot.exists) throw new Error("Draft image configuration is not ready yet; retry after the save batch.");
  const configuredPath = draftSnapshot.data().configuration?.images?.[parsed.key];
  const createdAt = Date.parse(eventData.timeCreated || "");
  if (configuredPath !== sourcePath) {
    if (configuredPath === undefined && Number.isFinite(createdAt) && clock() - createdAt < 60_000) {
      throw new Error("Draft image reference is not committed yet; retry shortly.");
    }
    await sourceFile.delete({ ignoreNotFound: true });
    return { status: "stale" };
  }

  const [objectMetadata] = await sourceFile.getMetadata();
  const size = Number(objectMetadata.size);
  if (!Number.isFinite(size) || size < 1 || size > MAX_BYTES) {
    await removeRejectedUpload({ draftRef, sourceFile, key: parsed.key, sourcePath, fieldValue, reason: "size-limit" });
    return { status: "rejected", reason: "size-limit" };
  }

  const [inputBytes] = await sourceFile.download();
  let imageMetadata;
  try {
    imageMetadata = await sharp(inputBytes, { limitInputPixels: MAX_PIXELS, failOn: "error" }).metadata();
  } catch {
    await removeRejectedUpload({ draftRef, sourceFile, key: parsed.key, sourcePath, fieldValue, reason: "decode-failed" });
    return { status: "rejected", reason: "decode-failed" };
  }
  const declaredType = objectMetadata.contentType || eventData.contentType;
  const isAnimated = (imageMetadata.pages || 1) > 1;
  const orientedWidth = imageMetadata.orientation >= 5 && imageMetadata.orientation <= 8 ? imageMetadata.height : imageMetadata.width;
  const orientedHeight = imageMetadata.orientation >= 5 && imageMetadata.orientation <= 8 ? imageMetadata.width : imageMetadata.height;
  if (!formatIsValid(imageMetadata, declaredType, parsed.extension)
    || isAnimated
    || !orientedWidth || !orientedHeight
    || orientedWidth > MAX_DIMENSION || orientedHeight > MAX_DIMENSION
    || orientedWidth * orientedHeight > MAX_PIXELS) {
    await removeRejectedUpload({ draftRef, sourceFile, key: parsed.key, sourcePath, fieldValue, reason: "format-or-dimensions" });
    return { status: "rejected", reason: "format-or-dimensions" };
  }

  const digest = createHash("sha256").update(inputBytes).digest("hex");
  const imageDirectory = `sstTenants/${parsed.tenantId}/projects/${parsed.projectId}/drafts/images/${encodeURIComponent(parsed.key)}/${digest}`;
  const widths = responsiveImageWidths(orientedWidth);
  const primaryWidth = widths.find((candidate) => candidate >= Math.min(orientedWidth, 1280)) || widths.at(-1);
  if (!primaryWidth) throw new Error("No responsive width was generated for a valid image.");
  const outputs = [];
  try {
    for (const width of widths) {
      const outputPath = `${imageDirectory}/w${width}.webp`;
      const webpBytes = await sharp(inputBytes, { limitInputPixels: MAX_PIXELS, failOn: "error" })
        .rotate()
        .resize({ width, withoutEnlargement: true, fit: "inside" })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();
      await bucket.file(outputPath).save(webpBytes, {
        resumable: false,
        metadata: {
          contentType: "image/webp",
          cacheControl: "private, max-age=31536000, immutable",
          metadata: { sstImagePipeline: "v1", sourceSha256: digest },
        },
      });
      outputs.push(outputPath);
    }
  } catch (error) {
    await Promise.all(outputs.map((outputPath) => bucket.file(outputPath).delete({ ignoreNotFound: true }).catch(() => undefined)));
    throw error;
  }

  const primaryPath = `${imageDirectory}/w${primaryWidth}.webp`;
  let previousPath = "";
  const updated = await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(draftRef);
    if (!snapshot.exists) throw new Error("Draft was removed while processing its image.");
    const data = snapshot.data();
    const configuration = data.configuration;
    const currentPath = configuration?.images?.[parsed.key];
    if (currentPath === primaryPath) return "already-processed";
    if (currentPath !== sourcePath) return "stale";
    previousPath = currentPath;
    transaction.update(draftRef, {
      configuration: { ...configuration, images: { ...configuration.images, [parsed.key]: primaryPath } },
      revision: Number(data.revision) + 1,
      updatedAt: fieldValue.serverTimestamp(),
    });
    return "updated";
  });

  if (updated === "stale") {
    await Promise.all(outputs.map((outputPath) => bucket.file(outputPath).delete({ ignoreNotFound: true })));
    await sourceFile.delete({ ignoreNotFound: true });
    return { status: "stale" };
  }
  if (updated === "updated" && previousPath.startsWith(`sstTenants/${parsed.tenantId}/projects/${parsed.projectId}/drafts/images/`)) {
    const previousDirectory = path.posix.dirname(previousPath);
    if (previousDirectory !== imageDirectory) {
      try { await deletePrefix(bucket, `${previousDirectory}/`); }
      catch (error) { console.warn("Could not remove superseded image variants", { previousDirectory, message: String(error) }); }
    }
  }
  await sourceFile.delete({ ignoreNotFound: true });
  return { status: updated, primaryPath, widths, digest };
}
