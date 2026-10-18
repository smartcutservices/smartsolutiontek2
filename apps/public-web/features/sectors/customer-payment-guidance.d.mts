import type { Sector } from "./registry";
export function customerPaymentGuidanceFor(sector: Pick<Sector, "id" | "flow">): string;
