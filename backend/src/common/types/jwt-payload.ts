export type JwtPayloadUser = {
  userId: string;
  email: string;
  role: string;
  providerId?: string | null;
};
