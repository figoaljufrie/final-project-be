import { $Enums } from "../../../generated/prisma";

// Step 1: Registration (email only)
export interface RegisterDTO {
  email: string;
  role?: $Enums.UserRole; // Optional, default = "user"
}

// Step 3: Set password after email verification
export interface SetPasswordDTO {
  password: string;
}

// Step 4: Login
export interface LoginDTO {
  email: string;
  password: string;
}

// Token handling (internal)
export interface TokenDTO {
  userId: number;
  token: string;
  type: $Enums.VerificationTokenType;
  expiresAt: Date;
  used?: boolean;
}