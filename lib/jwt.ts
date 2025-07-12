import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('Please define the JWT_SECRET environment variable');
}

export interface JWTPayload {
  userId: string;
  phone: string;
  name: string;
  isAdmin: boolean;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}
