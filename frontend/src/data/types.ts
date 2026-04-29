export type SessionState = {
  authenticated: boolean;
  email?: string;
  role?: string;
  full_name?: string;
  verified?: boolean;
};

export type LocalizedText = {
  en: string;
  zh: string;
};

export type ContentBlock = {
  id: number;
  section_id: number;
  title: LocalizedText;
  kind: "text" | "image";
  content: LocalizedText;
  image_url: string;
  position: number;
};

export type NovelSection = {
  id: number;
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  position: number;
  blocks: ContentBlock[];
};

export type ChangeLogItem = {
  id: number;
  actor: string;
  action: string;
  section_title: LocalizedText;
  content_title: LocalizedText;
  summary: LocalizedText;
  changed_at: string;
};

export type SiteResponse = {
  site_title: LocalizedText;
  tagline: LocalizedText;
  intro: LocalizedText;
  sections: NovelSection[];
  change_logs: ChangeLogItem[];
};

export type SiteProfilePayload = {
  site_title: LocalizedText;
  tagline: LocalizedText;
  intro: LocalizedText;
};

export type SectionPayload = {
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  position?: number;
};

export type BlockPayload = {
  title: LocalizedText;
  kind: "text" | "image";
  content: LocalizedText;
  image_url: string;
  position?: number;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  full_name: string;
  email: string;
  password: string;
};

export type RegistrationResponse = {
  email: string;
  verification_required: boolean;
  message: string;
};

export type MessageResponse = {
  success: boolean;
  message: string;
};

export type ImageUploadResponse = {
  url: string;
  filename: string;
};
