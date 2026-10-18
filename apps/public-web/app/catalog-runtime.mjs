/** @template {{ templateId: string }} T @param {T[]} entries @returns {T[]} */
export function excludeDuplicateTemplateIds(entries) {
  const counts = new Map();
  for (const entry of entries) counts.set(entry.templateId, (counts.get(entry.templateId) ?? 0) + 1);
  return entries.filter((entry) => counts.get(entry.templateId) === 1);
}
