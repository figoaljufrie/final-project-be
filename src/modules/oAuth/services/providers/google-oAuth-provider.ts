import { OAuth2Client } from "google-auth-library";
import { OAuthProfileDTO } from "../../dto/oAuth-profile-dto";
import { OAuthTokenDTO } from "../../dto/oAuth-token-dto";
import { ApiError } from "../../../../shared/utils/api-error";

export class GoogleAuthService {
  private client: OAuth2Client;

  constructor() {
    this.client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  public async getTokens(code: string): Promise<OAuthTokenDTO> {
    const { tokens } = await this.client.getToken(code);
    return {
      accessToken: tokens.access_token ?? undefined,
      refreshToken: tokens.refresh_token ?? undefined,
    };
  }

  public async getUserProfile(accessToken: string): Promise<OAuthProfileDTO> {
    this.client.setCredentials({ access_token: accessToken });

    const url = "https://www.googleapis.com/oauth2/v2/userinfo";

    const res = await this.client.request<{
      id: string;
      email: string;
      name?: string;
      picture?: string;
    }>({
      url,
    });

    const data = res.data;

    return {
      id: data.id,
      email: data.email,
      name: data.name ?? null,
      avatarUrl: data.picture ?? null,
      provider: "google",
    };
  }

  public async loginWithCode(code: string) {
    const tokens = await this.getTokens(code);
    if (!tokens.accessToken)
      throw new ApiError("No access Token received from google", 403);

    const profile = await this.getUserProfile(tokens.accessToken);

    return { profile, tokens };
  }
}
