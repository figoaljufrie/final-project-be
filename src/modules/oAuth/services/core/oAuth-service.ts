import { sign, SignOptions } from "jsonwebtoken";
import { UserRepository } from "../../../user/repository/user-repository";
import { OAuthRepository } from "../../repositories/oAuth-repository";
import { ApiError } from "../../../../shared/utils/api-error";
import { User } from "../../../../generated/prisma";
import { OAuthProfileDTO } from "../../dto/oAuth-profile-dto";
import { OAuthTokenDTO } from "../../dto/oAuth-token-dto";

export class OAuthService {
  private userRepository = new UserRepository();
  private oAuthRepository = new OAuthRepository();

  private generateSession(user: User) {
    const { password, ...safeUser } = user as any;
    const payload = { id: user.id, email: user.email, role: user.role };
    const token = sign(
      payload,
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? "2h" } as SignOptions
    );

    return { accessToken: token, user: safeUser };
  }

  public async oauthLogin(profile: OAuthProfileDTO, tokens?: OAuthTokenDTO) {
    // 1) Check if OAuth account exists
    const existingOAuth = await this.oAuthRepository.findByProviderAccount(
      profile.provider,
      profile.id
    );
    if (existingOAuth) return this.generateSession(existingOAuth.user);

    // 2) Prevent duplicate email registration
    const existingUser = await this.userRepository.findByEmail(profile.email);
    if (existingUser)
      throw new ApiError(
        "Email already registered. Please log in using your existing account.",
        400
      );

    // 3) Create new user
    const newUser = await this.userRepository.create({
      name: profile.name ?? null,
      email: profile.email,
      password: null,
      role: "user",
      avatarUrl: profile.avatarUrl ?? null,
      isEmailVerified: true,
    });

    // 4) Create OAuth account record
    const cleanedTokens: { accessToken?: string; refreshToken?: string } = {};

    if (tokens?.accessToken) cleanedTokens.accessToken = tokens.accessToken;
    if (tokens?.refreshToken) cleanedTokens.refreshToken = tokens.refreshToken;

    await this.oAuthRepository.createOAuthAccount(
      newUser.id,
      profile,
      cleanedTokens
    );

    // 5) Return JWT session
    return this.generateSession(newUser);
  }
}
