import { prisma } from "../../../shared/utils/prisma";
import { OAuthAccount } from "../../../generated/prisma";
import { OAuthProfileDTO } from "../dto/oAuth-profile-dto";

export class OAuthRepository {
  async createOAuthAccount(
    userId: number,
    profile: OAuthProfileDTO,
    tokens?: { accessToken?: string; refreshToken?: string }
  ): Promise<OAuthAccount> {
    const data = {
      userId,
      provider: profile.provider,
      providerId: profile.id,
      ...(tokens ?? {}),
    };

    return prisma.oAuthAccount.create({ data });
  }

  async findByProviderAccount(provider: string, providerId: string) {
    return prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: { provider, providerId },
      },
      include: { user: true },
    });
  }

  async findByUserId(userId: number) {
    return prisma.oAuthAccount.findMany({ where: { userId } });
  }

  async updateTokens(
    id: number,
    tokens: { accessToken?: string; refreshToken?: string }
  ) {
    return prisma.oAuthAccount.update({
      where: { id },
      data: tokens,
    });
  }
}
