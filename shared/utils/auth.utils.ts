import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

export function generateHash(string: string): Promise<string> {
  return bcrypt.hash(string, 10);
}

export function generateVerificationCode(): string {
  const number = crypto.randomInt(1000000);
  return number.toString().padStart(6, '0');
}

export function compareHash(string: string, hash: string): Promise<boolean> {
  return bcrypt.compare(string, hash);
}
