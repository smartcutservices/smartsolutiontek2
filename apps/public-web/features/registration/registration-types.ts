export type RegistrationFieldType = "text" | "email" | "tel" | "date" | "select" | "checkbox" | "file";
export type RegistrationSelectOption = { id: string; label: string };
type RegistrationFieldBase = {
  id: string;
  label: string;
  required: boolean;
  helpText?: string;
  showWhen?: { fieldId: string; optionId: string };
};
export type RegistrationField =
  | (RegistrationFieldBase & { type: "select"; options: RegistrationSelectOption[] })
  | (RegistrationFieldBase & { type: Exclude<RegistrationFieldType, "select">; options?: never });

type RegistrationProgramBase = {
  id: string;
  title: string;
  description: string;
  level?: string;
  eligibility?: string;
  capacity?: number | null;
  waitlistEnabled?: boolean;
};
export type RegistrationProgram = RegistrationProgramBase & (
  | { availability: "always"; opensAt?: null; closesAt?: null }
  | { availability: "scheduled"; opensAt: string; closesAt: string }
);

export type RegistrationConsent =
  | { id: string; kind: "privacy" | "terms"; label: string; required: true }
  | { id: string; kind: "marketing"; label: string; required: false };

export type RegistrationSiteConfigDraft = {
  configVersion: "1.0.0";
  status: "draft";
  institution: {
    name: string;
    description?: string;
    contactEmail?: string;
    contactPhone?: string;
    publicAddress?: string;
    logoAssetId?: string;
    socialLinks?: Array<{ platform: string; url: string }>;
  };
  programs: RegistrationProgram[];
  application: {
    mode: "single" | "multiple";
    duplicatePolicy: "allow" | "block" | "manual-review";
    fields: RegistrationField[];
  };
  consents: RegistrationConsent[];
  payment:
    | { mode: "free" }
    | { mode: "paid"; currency: string; feeDisclosure: string; priceByProgram: Record<string, string> };
  uploadPolicy?: { maxBytes: number; retentionDays: number; allowedMimeTypes: string[] };
  confirmation: { message: string; referencePrefix?: string };
};
