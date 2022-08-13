import crypto from 'crypto'

export const generateHashedPassword = (salt, password) => crypto.createHmac('sha256', salt).update(password).digest('hex')
export const generateSalt = () => crypto.randomBytes(128).toString('base64')
