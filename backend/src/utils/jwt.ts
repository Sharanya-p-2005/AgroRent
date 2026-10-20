import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'agrorent_secure_jwt_secret_dev_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface TokenPayload {
  id: string;
  role: string;
  email: string;
  name: string;
}

export function generateToken(payload: TokenPayload): string {
  // @ts-ignore - jsonwebtoken sign overload
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
