export interface OAuthProfileDTO {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  provider: "google" | "facebook" | "twitter";
}