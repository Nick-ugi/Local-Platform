import type { Category, FacilitySubtype, NoticeType, Status } from "@queenstown/shared";

// The names the web app shows for each code (web/messages/en.json), so the admin and the visitors
// see the same words.

export const CATEGORY_LABELS: Record<Category, string> = {
  food: "Food",
  cafe: "Cafes",
  bar: "Bars",
  activity: "Activities",
  shopping: "Shopping",
  facility: "Facilities",
};

export const SUBTYPE_LABELS: Record<FacilitySubtype, string> = {
  toilet: "Public toilet",
  parking: "Parking",
  information: "Information centre",
  library: "Library",
  medical: "Medical",
  other: "Other",
};

export const NOTICE_TYPE_LABELS: Record<NoticeType, string> = {
  "road-work": "Road Work",
  "road-closure": "Road Closure",
  "public-notice": "Public Notice",
  emergency: "Emergency",
};

export const STATUS_LABELS: Record<Status, string> = { public: "Public", private: "Private" };
