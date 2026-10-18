import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { excludeDuplicateTemplateIds } from "../app/catalog-runtime.mjs";
import { validateCatalog } from "../scripts/validate-catalog.mjs";

function setup() {
  const projectRoot = mkdtempSync(join(tmpdir(), "sst-catalog-"));
  const publicRoot = join(projectRoot, "public");
  const id = "school-registration";
  for (const path of [
    `media/template-videos/${id}`,
    `media/template-posters/${id}`,
  ]) mkdirSync(join(publicRoot, path), { recursive: true });
  mkdirSync(join(projectRoot, "docs/licenses"), { recursive: true });
  writeFileSync(join(publicRoot, `media/template-videos/${id}/intro.mp4`), "video");
  writeFileSync(join(publicRoot, `media/template-posters/${id}/intro.webp`), "poster");
  writeFileSync(join(projectRoot, `docs/licenses/${id}.md`), "Owner-created demo; audio contains no music.");
  const entry = {
    templateId: id,
    version: "1.0.0",
    family: "Inscription en ligne",
    sector: { id: "schools", label: "Écoles", approved: true },
    engines: ["forms", "registration"],
    title: "Inscription",
    description: "Démonstration locale réelle.",
    status: "published",
    publishedAt: "2026-10-11T00:00:00.000Z",
    technicalStatus: "deployed",
    demo: {
      videoSrc: `/media/template-videos/${id}/intro.mp4`,
      posterSrc: `/media/template-posters/${id}/intro.webp`,
      alt: "Aperçu vidéo du formulaire d’inscription.",
      rights: { owner: "Smart Solutions Tech", audio: "none", evidencePath: `docs/licenses/${id}.md` },
    },
    previewRoute: `/demo/${id}`,
  };
  return { projectRoot, publicRoot, entry, cleanup: () => rmSync(projectRoot, { recursive: true, force: true }) };
}

test("accepts a published template with local assets and documented rights", () => {
  const fixture = setup();
  try {
    assert.deepEqual(validateCatalog([fixture.entry], fixture), []);
  } finally {
    fixture.cleanup();
  }
});

test("allows an empty local catalog but rejects an empty production catalog", () => {
  const fixture = setup();
  try {
    assert.deepEqual(validateCatalog([], { ...fixture, environment: "development" }), []);
    assert.ok(validateCatalog([], { ...fixture, environment: "production" }).some((error) => error.includes("at least one published demo")));
  } finally {
    fixture.cleanup();
  }
});

test("accepts a caption file with a WebVTT header and timed cue", () => {
  const fixture = setup();
  try {
    const id = fixture.entry.templateId;
    const relativePath = `media/template-captions/${id}/captions.vtt`;
    mkdirSync(join(fixture.publicRoot, `media/template-captions/${id}`), { recursive: true });
    writeFileSync(join(fixture.publicRoot, relativePath), "\uFEFFWEBVTT local test\r\n\r\n00:01.000 --> 00:03.000\r\nPrésentation du formulaire.\r\n\r\n00:00:04.000 --> 00:00:06.000\r\nÉtape suivante.\r\n");
    const entry = { ...fixture.entry, demo: { ...fixture.entry.demo, captionsSrc: `/${relativePath}` } };
    assert.deepEqual(validateCatalog([entry], fixture), []);
  } finally {
    fixture.cleanup();
  }
});

test("rejects a non-WebVTT caption file or one without a timed text cue", () => {
  const fixture = setup();
  try {
    const id = fixture.entry.templateId;
    const relativePath = `media/template-captions/${id}/captions.vtt`;
    mkdirSync(join(fixture.publicRoot, `media/template-captions/${id}`), { recursive: true });
    const absolutePath = join(fixture.publicRoot, relativePath);
    const entry = { ...fixture.entry, demo: { ...fixture.entry.demo, captionsSrc: `/${relativePath}` } };
    for (const captions of [
      "Plain text without a WebVTT header.",
      "WEBVTT\n\nNo timed cue is present.",
      "WEBVTT\n00:00:01.000 --> 00:00:02.000\nCaption without required header separation.\n",
    ]) {
      writeFileSync(absolutePath, captions);
      assert.ok(validateCatalog([entry], fixture).some((error) => error.includes("captions must contain a WEBVTT header")));
    }
  } finally {
    fixture.cleanup();
  }
});

test("rejects WebVTT cues whose start times are out of order", () => {
  const fixture = setup();
  try {
    const id = fixture.entry.templateId;
    const relativePath = `media/template-captions/${id}/captions.vtt`;
    mkdirSync(join(fixture.publicRoot, `media/template-captions/${id}`), { recursive: true });
    writeFileSync(join(fixture.publicRoot, relativePath), "WEBVTT\n\n00:00:04.000 --> 00:00:05.000\nSecond cue first.\n\n00:00:02.000 --> 00:00:03.000\nFirst cue last.\n");
    const entry = { ...fixture.entry, demo: { ...fixture.entry.demo, captionsSrc: `/${relativePath}` } };
    assert.ok(validateCatalog([entry], fixture).some((error) => error.includes("captions must contain a WEBVTT header")));
  } finally {
    fixture.cleanup();
  }
});

test("rejects WebVTT cues with out-of-range or reversed timestamps", () => {
  const fixture = setup();
  try {
    const id = fixture.entry.templateId;
    const relativePath = `media/template-captions/${id}/captions.vtt`;
    mkdirSync(join(fixture.publicRoot, `media/template-captions/${id}`), { recursive: true });
    const absolutePath = join(fixture.publicRoot, relativePath);
    const entry = { ...fixture.entry, demo: { ...fixture.entry.demo, captionsSrc: `/${relativePath}` } };
    for (const timing of [
      "00:99:03.000 --> 00:99:04.000",
      "00:00:04.000 --> 00:00:03.000",
      "00:00:03.000 --> 00:00:03.000",
    ]) {
      writeFileSync(absolutePath, `WEBVTT\n\n${timing}\nTexte visible.\n`);
      assert.ok(validateCatalog([entry], fixture).some((error) => error.includes("captions must contain a WEBVTT header")));
    }
  } finally {
    fixture.cleanup();
  }
});

test("rejects invalid UTF-8 bytes in a WebVTT caption file", () => {
  const fixture = setup();
  try {
    const id = fixture.entry.templateId;
    const relativePath = `media/template-captions/${id}/captions.vtt`;
    mkdirSync(join(fixture.publicRoot, `media/template-captions/${id}`), { recursive: true });
    writeFileSync(join(fixture.publicRoot, relativePath), Buffer.concat([
      Buffer.from("WEBVTT\n\n00:00:01.000 --> 00:00:03.000\n"),
      Buffer.from([0xff]),
      Buffer.from("\n"),
    ]));
    const entry = { ...fixture.entry, demo: { ...fixture.entry.demo, captionsSrc: `/${relativePath}` } };
    assert.ok(validateCatalog([entry], fixture).some((error) => error.includes("captions must contain a WEBVTT header")));
  } finally {
    fixture.cleanup();
  }
});

test("rejects unknown properties in the manifest and nested metadata", () => {
  const fixture = setup();
  try {
    const entry = {
      ...fixture.entry,
      unexpected: true,
      sector: { ...fixture.entry.sector, regionCode: "XX" },
      demo: { ...fixture.entry.demo, unusedDemoProperty: true, rights: { ...fixture.entry.demo.rights, licenseText: "unreviewed" } },
    };
    const errors = validateCatalog([entry], fixture);
    assert.ok(errors.some((error) => error.includes("unsupported property unexpected")));
    assert.ok(errors.some((error) => error.includes("unsupported property regionCode")));
    assert.ok(errors.some((error) => error.includes("unsupported property unusedDemoProperty")));
    assert.ok(errors.some((error) => error.includes("unsupported property licenseText")));
  } finally {
    fixture.cleanup();
  }
});

test("rejects present caption paths that are empty or null", () => {
  const fixture = setup();
  try {
    for (const captionsSrc of ["", null]) {
      const entry = { ...fixture.entry, demo: { ...fixture.entry.demo, captionsSrc } };
      assert.ok(validateCatalog([entry], fixture).some((error) => error.includes("captions must be a safe local public path")));
    }
  } finally {
    fixture.cleanup();
  }
});

test("rejects duplicate template IDs", () => {
  const fixture = setup();
  try {
    const errors = validateCatalog([fixture.entry, fixture.entry], fixture);
    assert.ok(errors.some((error) => error.includes("duplicate templateId")));
  } finally {
    fixture.cleanup();
  }
});

test("runtime excludes all duplicate IDs and preserves unique entries", () => {
  const firstDuplicate = { templateId: "duplicate", version: "1.0.0" };
  const secondDuplicate = { templateId: "duplicate", version: "2.0.0" };
  const unique = { templateId: "unique", version: "1.0.0" };
  assert.deepEqual(excludeDuplicateTemplateIds([firstDuplicate, unique, secondDuplicate]), [unique]);
});

test("rejects publishing a sector that is not approved", () => {
  const fixture = setup();
  try {
    const entry = { ...fixture.entry, sector: { ...fixture.entry.sector, approved: false } };
    assert.ok(validateCatalog([entry], fixture).some((error) => error.includes("unapproved sector")));
  } finally {
    fixture.cleanup();
  }
});

test("rejects media paths that point outside the template media directory", () => {
  const fixture = setup();
  try {
    const entry = { ...fixture.entry, demo: { ...fixture.entry.demo, videoSrc: "/media/shared/intro.mp4" } };
    assert.ok(validateCatalog([entry], fixture).some((error) => error.includes("outside its template media directory")));
  } finally {
    fixture.cleanup();
  }
});

test("rejects published entries with missing rights evidence", () => {
  const fixture = setup();
  try {
    const entry = { ...fixture.entry, demo: { ...fixture.entry.demo, rights: { ...fixture.entry.demo.rights, evidencePath: "docs/licenses/missing.md" } } };
    assert.ok(validateCatalog([entry], fixture).some((error) => error.includes("evidence file is missing")));
  } finally {
    fixture.cleanup();
  }
});

test("rejects empty published media files", () => {
  const fixture = setup();
  try {
    writeFileSync(join(fixture.publicRoot, `media/template-videos/${fixture.entry.templateId}/intro.mp4`), "");
    writeFileSync(join(fixture.publicRoot, `media/template-posters/${fixture.entry.templateId}/intro.webp`), "");
    const errors = validateCatalog([fixture.entry], fixture);
    assert.ok(errors.some((error) => error.includes("demo video must resolve to a non-empty file")));
    assert.ok(errors.some((error) => error.includes("demo poster must resolve to a non-empty file")));
  } finally {
    fixture.cleanup();
  }
});

test("rejects directories with a media file extension", () => {
  const fixture = setup();
  try {
    const fakeMediaPath = `media/template-videos/${fixture.entry.templateId}/directory.mp4`;
    mkdirSync(join(fixture.publicRoot, fakeMediaPath), { recursive: true });
    const entry = { ...fixture.entry, demo: { ...fixture.entry.demo, videoSrc: `/${fakeMediaPath}` } };
    assert.ok(validateCatalog([entry], fixture).some((error) => error.includes("demo video must resolve to a non-empty file")));
  } finally {
    fixture.cleanup();
  }
});

test("rejects an empty media rights evidence file", () => {
  const fixture = setup();
  try {
    writeFileSync(join(fixture.projectRoot, fixture.entry.demo.rights.evidencePath), "   ");
    assert.ok(validateCatalog([fixture.entry], fixture).some((error) => error.includes("media rights evidence must not be empty")));
  } finally {
    fixture.cleanup();
  }
});



test("rejects a published entry with an invalid publication timestamp", () => {
  const fixture = setup();
  try {
    const entry = { ...fixture.entry, publishedAt: "not-a-date" };
    assert.ok(validateCatalog([entry], fixture).some((error) => error.includes("publishedAt must be a valid ISO timestamp")));
  } finally {
    fixture.cleanup();
  }
});
test("rejects media paths with traversal segments, even if they resolve back under public", () => {
  const fixture = setup();
  try {
    const sibling = join(fixture.publicRoot, "media/template-videos/other-template");
    mkdirSync(sibling, { recursive: true });
    writeFileSync(join(sibling, "intro.mp4"), "video");
    const entry = {
      ...fixture.entry,
      demo: { ...fixture.entry.demo, videoSrc: "/media/template-videos/school-registration/../other-template/intro.mp4" },
    };
    assert.ok(validateCatalog([entry], fixture).some((error) => error.includes("safe local public path")));
  } finally {
    fixture.cleanup();
  }
});
test("rejects publishing a family that remains a recommendation", () => {
  const fixture = setup();
  try {
    const entry = { ...fixture.entry, family: "Réservation en ligne" };
    assert.ok(validateCatalog([entry], fixture).some((error) => error.includes("unapproved product family")));
  } finally {
    fixture.cleanup();
  }
});
