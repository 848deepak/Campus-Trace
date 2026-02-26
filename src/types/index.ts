export type ItemKind = "LOST" | "FOUND";

export type ItemCategory =
  | "Phone"
  | "Wallet"
  | "ID Card"
  | "Keys"
  | "Laptop"
  | "Other";

export type ContactPreference = "chat" | "phone" | "email";

export interface JwtUser {
  id: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  name: string;
}

export interface ItemPayload {
  type: ItemKind;
  title: string;
  description: string;
  category: ItemCategory;
  imageUrl: string;
  dateOccurred: string;
  latitude: number;
  longitude: number;
  reward?: number;
  contactPreference?: ContactPreference;
  safeWithMe?: boolean;
  anonymous?: boolean;
  qrToken?: string;
}
