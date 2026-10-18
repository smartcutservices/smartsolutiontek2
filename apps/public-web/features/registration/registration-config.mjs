const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const fieldTypes = new Set(["text", "email", "tel", "date", "select", "checkbox", "file"]);
const allowedUploadMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const consentKinds = new Set(["privacy", "terms", "marketing"]);

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value, allowedKeys, label, errors) {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) errors.push(`${label}.${key} is not supported in configVersion 1.0.0.`);
  }
}

function isIsoTimestamp(value) {
  if (typeof value !== "string" || !isoTimestampPattern.test(value)) return false;
  const timestamp = Date.parse(value);
  return !Number.isNaN(timestamp) && new Date(timestamp).toISOString() === value;
}

function isConfiguredSafeMimeType(value) {
  return typeof value === "string" && allowedUploadMimeTypes.has(value);
}

function isHttpsUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

function addUniqueId(id, label, ids, errors) {
  if (typeof id !== "string" || !idPattern.test(id)) {
    errors.push(`${label} must use a stable lowercase ID.`);
    return false;
  }
  if (ids.has(id)) errors.push(`${label} is duplicated: ${id}.`);
  ids.add(id);
  return true;
}

/** Validates a draft registration-site configuration; it never accepts applicant submissions. */
export function validateRegistrationConfig(value) {
  const errors = [];
  if (!isRecord(value)) return ["Registration config must be an object."];
  hasOnlyKeys(value, ["configVersion", "status", "institution", "programs", "application", "consents", "payment", "uploadPolicy", "confirmation"], "config", errors);
  if (value.configVersion !== "1.0.0") errors.push("configVersion must be 1.0.0.");
  if (value.status !== "draft") errors.push("Only draft configurations are supported before publication gates exist.");

  const institution = value.institution;
  if (!isRecord(institution)) {
    errors.push("institution must be an object.");
  } else {
    hasOnlyKeys(institution, ["name", "description", "contactEmail", "contactPhone", "publicAddress", "logoAssetId", "socialLinks"], "institution", errors);
    if (typeof institution.name !== "string" || !institution.name.trim()) errors.push("institution.name is required.");
    for (const field of ["description", "contactPhone", "publicAddress"]) {
      if (institution[field] !== undefined && (typeof institution[field] !== "string" || !institution[field].trim())) errors.push(`institution.${field} must be a non-empty string when provided.`);
    }
    if (institution.contactEmail !== undefined && (typeof institution.contactEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(institution.contactEmail))) {
      errors.push("institution.contactEmail must be a valid email when provided.");
    }
    if (institution.logoAssetId !== undefined && (typeof institution.logoAssetId !== "string" || !idPattern.test(institution.logoAssetId))) {
      errors.push("institution.logoAssetId must be a stable asset ID when provided.");
    }
    if (institution.socialLinks !== undefined) {
      if (!Array.isArray(institution.socialLinks)) {
        errors.push("institution.socialLinks must be an array.");
      } else {
        const platforms = new Set();
        for (const [index, link] of institution.socialLinks.entries()) {
          const label = `institution.socialLinks[${index}]`;
          if (!isRecord(link)) {
            errors.push(`${label} must be an object.`);
            continue;
          }
          hasOnlyKeys(link, ["platform", "url"], label, errors);
          if (typeof link.platform !== "string" || !idPattern.test(link.platform)) errors.push(`${label}.platform must use a stable ID.`);
          else if (platforms.has(link.platform)) errors.push(`${label}.platform is duplicated.`);
          else platforms.add(link.platform);
          if (!isHttpsUrl(link.url)) errors.push(`${label}.url must be an HTTPS URL without credentials.`);
        }
      }
    }
  }

  const programs = Array.isArray(value.programs) ? value.programs : [];
  if (!Array.isArray(value.programs) || programs.length === 0) errors.push("At least one program is required.");
  const programIds = new Set();
  for (const [index, program] of programs.entries()) {
    const label = `program ${index + 1}`;
    if (!isRecord(program)) {
      errors.push(`${label} must be an object.`);
      continue;
    }
    hasOnlyKeys(program, ["id", "title", "description", "level", "eligibility", "availability", "opensAt", "closesAt", "capacity", "waitlistEnabled"], label, errors);
    addUniqueId(program.id, `${label}.id`, programIds, errors);
    for (const field of ["title", "description"]) {
      if (typeof program[field] !== "string" || !program[field].trim()) errors.push(`${label}.${field} is required.`);
    }
    for (const field of ["level", "eligibility"]) {
      if (program[field] !== undefined && (typeof program[field] !== "string" || !program[field].trim())) errors.push(`${label}.${field} must be a non-empty string when provided.`);
    }
    if (!["always", "scheduled"].includes(program.availability)) {
      errors.push(`${label}.availability must be always or scheduled.`);
    } else if (program.availability === "scheduled") {
      if (!isIsoTimestamp(program.opensAt) || !isIsoTimestamp(program.closesAt) || Date.parse(program.closesAt) <= Date.parse(program.opensAt)) {
        errors.push(`${label} must have valid opening and closing timestamps in order.`);
      }
    } else if (program.opensAt != null || program.closesAt != null) {
      errors.push(`${label} with always availability must not define scheduled timestamps.`);
    }
    if (program.capacity !== undefined && program.capacity !== null && (!Number.isSafeInteger(program.capacity) || program.capacity <= 0)) {
      errors.push(`${label}.capacity must be a positive integer or null.`);
    }
    if (program.waitlistEnabled !== undefined && typeof program.waitlistEnabled !== "boolean") errors.push(`${label}.waitlistEnabled must be boolean.`);
  }

  const application = value.application;
  if (!isRecord(application)) {
    errors.push("application must be an object.");
  } else {
    hasOnlyKeys(application, ["mode", "duplicatePolicy", "fields"], "application", errors);
    if (!["single", "multiple"].includes(application.mode)) errors.push("application.mode must be single or multiple.");
    if (!["allow", "block", "manual-review"].includes(application.duplicatePolicy)) errors.push("application.duplicatePolicy must be allow, block or manual-review.");
  }
  const fields = isRecord(application) && Array.isArray(application.fields) ? application.fields : [];
  if (!isRecord(application) || !Array.isArray(application.fields) || fields.length === 0) errors.push("application.fields must contain at least one field.");
  const fieldsById = new Map();
  const fieldIds = new Set();
  let needsUploadPolicy = false;
  for (const [index, field] of fields.entries()) {
    const label = `field ${index + 1}`;
    if (!isRecord(field)) {
      errors.push(`${label} must be an object.`);
      continue;
    }
    hasOnlyKeys(field, ["id", "type", "label", "required", "helpText", "options", "showWhen"], label, errors);
    const validId = addUniqueId(field.id, `${label}.id`, fieldIds, errors);
    if (validId) fieldsById.set(field.id, { ...field, index });
    if (!fieldTypes.has(field.type)) errors.push(`${label}.type is unsupported.`);
    if (typeof field.label !== "string" || !field.label.trim()) errors.push(`${label}.label is required.`);
    if (field.helpText !== undefined && (typeof field.helpText !== "string" || !field.helpText.trim())) errors.push(`${label}.helpText must be non-empty when provided.`);
    if (typeof field.required !== "boolean") errors.push(`${label}.required must be boolean.`);
    if (field.type === "select" && (!Array.isArray(field.options) || field.options.length === 0 || field.options.some((option) => !isRecord(option) || typeof option.id !== "string" || !idPattern.test(option.id) || typeof option.label !== "string" || !option.label.trim()) || new Set(field.options.map((option) => option?.id)).size !== field.options.length)) {
      errors.push(`${label} select fields need unique stable option IDs and labels.`);
    }
    if (field.type === "select" && Array.isArray(field.options)) {
      for (const [optionIndex, option] of field.options.entries()) {
        if (isRecord(option)) hasOnlyKeys(option, ["id", "label"], `${label}.options[${optionIndex}]`, errors);
      }
    }
    if (field.type !== "select" && field.options !== undefined) errors.push(`${label}.options is only valid for select fields.`);
    if (field.type === "file") needsUploadPolicy = true;
  }

  for (const [index, field] of fields.entries()) {
    if (!isRecord(field) || field.showWhen === undefined) continue;
    const label = `field ${index + 1}.showWhen`;
    if (!isRecord(field.showWhen) || typeof field.showWhen.fieldId !== "string" || typeof field.showWhen.optionId !== "string") {
      errors.push(`${label} must name a select field and option.`);
      continue;
    }
    hasOnlyKeys(field.showWhen, ["fieldId", "optionId"], label, errors);
    const parent = fieldsById.get(field.showWhen.fieldId);
    if (!parent || parent.index >= index || parent.type !== "select" || parent.showWhen !== undefined) {
      errors.push(`${label} must reference an earlier, unconditional select field.`);
      continue;
    }
    if (!Array.isArray(parent.options) || !parent.options.some((option) => isRecord(option) && option.id === field.showWhen.optionId)) {
      errors.push(`${label} references an unknown option.`);
    }
  }

  if (!Array.isArray(value.consents)) {
    errors.push("consents must be an array.");
  } else {
    const consentIds = new Set();
    const kinds = new Set();
    for (const [index, consent] of value.consents.entries()) {
      const label = `consent ${index + 1}`;
      if (!isRecord(consent)) {
        errors.push(`${label} must be an object.`);
        continue;
      }
      hasOnlyKeys(consent, ["id", "kind", "label", "required"], label, errors);
      addUniqueId(consent.id, `${label}.id`, consentIds, errors);
      if (!consentKinds.has(consent.kind)) errors.push(`${label}.kind is unsupported.`);
      else kinds.add(consent.kind);
      if (typeof consent.label !== "string" || !consent.label.trim()) errors.push(`${label}.label is required.`);
      if (typeof consent.required !== "boolean") errors.push(`${label}.required must be boolean.`);
      if (consent.kind === "marketing" && consent.required === true) errors.push(`${label} marketing consent cannot be mandatory.`);
    }
    if (!kinds.has("privacy") || !kinds.has("terms")) errors.push("privacy and terms consents must be configured separately.");
    for (const requiredKind of ["privacy", "terms"]) {
      if (!value.consents.some((consent) => isRecord(consent) && consent.kind === requiredKind && consent.required === true)) {
        errors.push(`${requiredKind} acknowledgment must be required before submission.`);
      }
    }
  }

  if (!isRecord(value.payment) || !["free", "paid"].includes(value.payment.mode)) {
    errors.push("payment.mode must be free or paid.");
  } else if (value.payment.mode === "free") {
    hasOnlyKeys(value.payment, ["mode"], "payment", errors);
    if (Object.keys(value.payment).some((key) => key !== "mode")) errors.push("Free registration must not ask for payment-provider or price details.");
  } else {
    hasOnlyKeys(value.payment, ["mode", "currency", "feeDisclosure", "priceByProgram"], "payment", errors);
    if (typeof value.payment.currency !== "string" || !/^[A-Z]{3}$/.test(value.payment.currency)) errors.push("Paid registration needs a three-letter uppercase currency code.");
    if (typeof value.payment.feeDisclosure !== "string" || !value.payment.feeDisclosure.trim()) errors.push("Paid registration must disclose fees before implementation.");
    if (!isRecord(value.payment.priceByProgram)) {
      errors.push("Paid registration needs a price for every program.");
    } else {
      for (const program of programs) {
        const amount = isRecord(program) ? value.payment.priceByProgram[program.id] : undefined;
        if (isRecord(program) && (typeof amount !== "string" || !/^\d+(?:\.\d+)?$/.test(amount) || !/[1-9]/.test(amount))) {
          errors.push(`Paid registration needs a positive decimal-string price for ${program.id}.`);
        }
      }
      for (const programId of Object.keys(value.payment.priceByProgram)) {
        if (!programIds.has(programId)) errors.push(`Price references unknown program ${programId}.`);
      }
    }
  }

  if (needsUploadPolicy) {
    const policy = value.uploadPolicy;
    if (!isRecord(policy)) {
      errors.push("File fields require an upload policy.");
    } else {
      hasOnlyKeys(policy, ["maxBytes", "retentionDays", "allowedMimeTypes"], "uploadPolicy", errors);
      if (!Number.isSafeInteger(policy.maxBytes) || policy.maxBytes <= 0 || !Number.isSafeInteger(policy.retentionDays) || policy.retentionDays <= 0 || !Array.isArray(policy.allowedMimeTypes) || policy.allowedMimeTypes.length === 0 || policy.allowedMimeTypes.some((mime) => !isConfiguredSafeMimeType(mime))) {
        errors.push("File fields require explicit positive size/retention limits and allowed MIME types.");
      }
      if (Array.isArray(policy.allowedMimeTypes) && new Set(policy.allowedMimeTypes).size !== policy.allowedMimeTypes.length) errors.push("uploadPolicy.allowedMimeTypes must not contain duplicates.");
    }
  } else if (value.uploadPolicy !== undefined) {
    errors.push("uploadPolicy is only valid when the form contains a file field.");
  }

  if (!isRecord(value.confirmation)) {
    errors.push("confirmation must be an object.");
  } else {
    hasOnlyKeys(value.confirmation, ["message", "referencePrefix"], "confirmation", errors);
    if (typeof value.confirmation.message !== "string" || !value.confirmation.message.trim()) errors.push("confirmation.message is required.");
    if (value.confirmation.referencePrefix !== undefined && (typeof value.confirmation.referencePrefix !== "string" || !/^[A-Z0-9-]{1,12}$/.test(value.confirmation.referencePrefix))) errors.push("confirmation.referencePrefix must contain 1-12 uppercase letters, digits or hyphens.");
  }

  return errors;
}
