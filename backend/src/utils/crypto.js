const crypto = require('crypto');

const ALGO = 'aes-256-cbc';

function getKey() {
  const key = process.env.CREDENTIALS_KEY || 'dev-only-key-change-me-32-chars!';
  // Ensure exactly 32 bytes regardless of what the user configured
  return crypto.createHash('sha256').update(key).digest();
}

function encrypt(text) {
  if (text === null || text === undefined || text === '') return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(payload) {
  if (!payload) return '';
  const [ivHex, dataHex] = payload.split(':');
  if (!ivHex || !dataHex) return '';
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
}

module.exports = { encrypt, decrypt };
