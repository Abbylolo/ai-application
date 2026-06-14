/**
 * AES-256-GCM 加密/解密工具
 *
 * 用于保护存储在数据库中的 LLM API Key。
 * 加密密钥来自环境变量 VITE_ENCRYPTION_KEY，编译时注入，不经过网络传输。
 *
 * 加密格式：base64(iv + ciphertext)
 *   - iv: 12 字节随机初始化向量
 *   - ciphertext: AES-256-GCM 加密后的密文（含 16 字节 auth tag）
 */

const KEY_HEX = import.meta.env.VITE_ENCRYPTION_KEY || ''

/**
 * 将 hex 字符串转为 CryptoKey（AES-256-GCM）
 */
async function importKey() {
  if (!KEY_HEX || KEY_HEX.length < 64) {
    throw new Error('缺少加密密钥 VITE_ENCRYPTION_KEY，请在环境变量中配置（64位hex字符串）')
  }
  const rawKey = hexToBytes(KEY_HEX.slice(0, 64))
  return crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * 加密明文，返回 base64 编码的密文
 */
export async function encrypt(plaintext) {
  if (!plaintext) return ''
  const key = await importKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  )
  // 拼接 iv + ciphertext，base64 编码
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.length)
  return bytesToBase64(combined)
}

/**
 * 解密 base64 编码的密文，返回明文
 */
export async function decrypt(cipherBase64) {
  if (!cipherBase64) return ''
  const key = await importKey()
  const combined = base64ToBytes(cipherBase64)
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )
  return new TextDecoder().decode(decrypted)
}

// ========== 编码工具 ==========

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

function bytesToBase64(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToBytes(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
