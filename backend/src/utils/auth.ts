import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const SALT_ROUNDS = 10
const JWT_SECRET = process.env.JWT_SECRET || 'secret'
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d'

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

export const generateToken = (
  userId: string,
  role: string
): string => {
  const payload = { userId, role }
  const options = { expiresIn: JWT_EXPIRE }
  return jwt.sign(payload, JWT_SECRET, options as any)
}

export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET)
}

export const generateRecoveryToken = (
  userId: string,
  expiresIn: string = '30m'
): string => {
  const payload = { userId, type: 'recovery' }
  const options = { expiresIn }
  return jwt.sign(payload, JWT_SECRET, options as any)
}

export const verifyRecoveryToken = (token: string): any => {
  const decoded = jwt.verify(token, JWT_SECRET) as any
  if (decoded.type !== 'recovery') {
    throw new Error('Token inválido')
  }
  return decoded
}
