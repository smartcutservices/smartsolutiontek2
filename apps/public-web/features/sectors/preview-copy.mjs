function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/** Derive only public-facing preview copy from validated questionnaire answers. */
export function getSectorPreviewCopy({ configuration, sectorDetail }) {
  const goal = configuration["project-goal"];
  const campaignContext = cleanText(configuration["campaign-context"]);
  const redesignFocus = cleanText(configuration["redesign-focus"]);
  const configuredOffer = cleanText(configuration["hero-copy"]);
  const actionDetails = cleanText(configuration["action-details"]);

  const contextualCopy = goal === "campaign"
    ? campaignContext
    : goal === "redesign"
      ? redesignFocus
      : "";

  return {
    heroDescription: configuredOffer || contextualCopy || sectorDetail,
    actionDescription: actionDetails,
  };
}
