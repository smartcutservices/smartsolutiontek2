import { handleQuestionnaireValidationRequest } from "../../../../features/questionnaire/server-validation.mjs";
import { questionnaireFor } from "../../../../features/sectors/questionnaire";
import { getSector } from "../../../../features/sectors/registry";

export const runtime = "nodejs";

/** Validate against the server-owned schema without persisting or logging answers. */
export async function POST(request: Request) {
  return handleQuestionnaireValidationRequest(request, (sectorId) => {
    const sector = getSector(sectorId);
    return sector ? questionnaireFor(sector) : undefined;
  });
}
