import jwt, { Secret, JwtPayload } from 'jsonwebtoken';

export const generateTokens = (user: { id: string; email: string; role: string }) => {
  const accessPayload: JwtPayload = { userId: user.id, email: user.email, role: user.role } as any;
  const refreshPayload: JwtPayload = { userId: user.id } as any;

  const accessSecret: Secret = process.env.JWT_SECRET as Secret;
  const refreshSecret: Secret = process.env.JWT_REFRESH_SECRET as Secret;

  const accessToken = jwt.sign(accessPayload, accessSecret, {
    expiresIn: (process.env.JWT_EXPIRE ?? '15m') as any
  });
  const refreshToken = jwt.sign(refreshPayload, refreshSecret, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRE ?? '7d') as any
  });

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET as Secret);
};