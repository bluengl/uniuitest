/**
 * 加密工具集合
 * 整合RSA、SM2和AES加密工具，方便统一导入使用
 * 小程序环境下的简化版本，建议复杂加密在服务端实现
 */

import RSA from './rsa.js'
import SM2 from './sm2.js'
import AES from './aes.js'

/**
 * 生成随机字符串
 * @param {Number} length - 随机字符串长度
 * @returns {String} 随机字符串
 */
const randomString = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const charsLength = chars.length
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * charsLength))
  }
  
  return result
}

/**
 * Base64编码
 * @param {String} str - 待编码的字符串
 * @returns {String} Base64编码后的字符串
 */
const base64Encode = (str) => {
  try {
    // 尝试使用uni-app API
    return uni.arrayBufferToBase64(new Uint8Array([...str].map(c => c.charCodeAt(0))).buffer)
  } catch (e) {
    // 降级处理
    try {
      return btoa(encodeURIComponent(str))
    } catch (err) {
      console.error('Base64编码失败，环境可能不支持', err)
      return str
    }
  }
}

/**
 * Base64解码
 * @param {String} str - 待解码的Base64字符串
 * @returns {String} 解码后的字符串
 */
const base64Decode = (str) => {
  try {
    // 尝试使用uni-app API
    const buffer = uni.base64ToArrayBuffer(str)
    return String.fromCharCode.apply(null, new Uint8Array(buffer))
  } catch (e) {
    // 降级处理
    try {
      return decodeURIComponent(atob(str))
    } catch (err) {
      console.error('Base64解码失败，环境可能不支持', err)
      return str
    }
  }
}

/**
 * 简单对称加密 - 异或加密
 * @param {String} text - 待加密文本
 * @param {String} key - 密钥
 * @returns {String} 加密后的文本
 */
const simpleEncrypt = (text, key) => {
  if (!text || !key) return text
  
  let result = ''
  const keyLen = key.length
  
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % keyLen)
    result += String.fromCharCode(charCode)
  }
  
  return base64Encode(result)
}

/**
 * 简单对称解密 - 异或解密
 * @param {String} encrypted - 加密后的文本
 * @param {String} key - 密钥
 * @returns {String} 解密后的文本
 */
const simpleDecrypt = (encrypted, key) => {
  if (!encrypted || !key) return encrypted
  
  try {
    const text = base64Decode(encrypted)
    let result = ''
    const keyLen = key.length
    
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % keyLen)
      result += String.fromCharCode(charCode)
    }
    
    return result
  } catch (e) {
    console.error('解密失败', e)
    return encrypted
  }
}

/**
 * MD5哈希算法
 * 简易实现，实际项目建议使用专业库或服务端
 * @param {String} s - 待哈希的字符串
 * @returns {String} MD5哈希值
 */
const md5 = (s) => {
  console.warn('警告：此MD5实现仅供参考，正式环境请使用更完善的实现')
  
  // 简易MD5实现
  function safeAdd(x, y) {
    const lsw = (x & 0xFFFF) + (y & 0xFFFF)
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16)
    return (msw << 16) | (lsw & 0xFFFF)
  }
  
  function bitRotateLeft(num, cnt) {
    return (num << cnt) | (num >>> (32 - cnt))
  }
  
  function cmn(q, a, b, x, s, t) {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b)
  }
  
  function md5cmn(a, b, c, d, x, s, t) {
    return cmn((b & c) | ((~b) & d), a, b, x, s, t)
  }
  
  function md5ff(a, b, c, d, x, s, t) {
    return cmn((b & c) | ((~b) & d), a, b, x, s, t)
  }
  
  function str2binl(str) {
    const bin = []
    for (let i = 0; i < str.length * 8; i += 8) {
      bin[i >> 5] |= (str.charCodeAt(i / 8) & 0xFF) << (i % 32)
    }
    return bin
  }
  
  function binl2hex(binarray) {
    const hex_chr = '0123456789abcdef'
    let str = ''
    for (let i = 0; i < binarray.length * 4; i++) {
      str += hex_chr.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xF) +
            hex_chr.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 0xF)
    }
    return str
  }
  
  // 简易版，非完整实现
  const x = str2binl(s)
  let a = 1732584193
  let b = -271733879
  let c = -1732584194
  let d = 271733878
  
  for(let i = 0; i < x.length; i += 16) {
    const olda = a
    const oldb = b
    const oldc = c
    const oldd = d
    
    a = md5ff(a, b, c, d, x[i], 7, -680876936)
    d = md5ff(d, a, b, c, x[i + 1], 12, -389564586)
    c = md5ff(c, d, a, b, x[i + 2], 17, 606105819)
    b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330)
    
    a = safeAdd(a, olda)
    b = safeAdd(b, oldb)
    c = safeAdd(c, oldc)
    d = safeAdd(d, oldd)
  }
  
  return binl2hex([a, b, c, d])
}

/**
 * 安全密码传输加密
 * 使用AES加密密码等敏感数据
 * @param {String} password - 需要安全传输的密码/敏感数据
 * @param {String} secretKey - 加密密钥，默认使用随机生成的密钥
 * @returns {String} 加密后的密文
 */
const encryptPassword = (password, secretKey) => {
  // 如果没有提供密钥，使用随机密钥
  const key = secretKey || AES.generateRandomPassword(16);
  
  // 使用AES加密密码
  return AES.encrypt(password, key);
}

/**
 * 安全密码传输解密
 * 解密通过encryptPassword加密的数据
 * @param {String} encrypted - 加密后的密文
 * @param {String} secretKey - 解密密钥，必须与加密时使用的相同
 * @returns {String} 解密后的明文
 */
const decryptPassword = (encrypted, secretKey) => {
  if (!secretKey) {
    throw new Error('解密密码需要提供密钥');
  }
  
  return AES.decrypt(encrypted, secretKey);
}

export default {
  RSA,
  SM2,
  AES,
  randomString,
  base64Encode,
  base64Decode,
  simpleEncrypt,
  simpleDecrypt,
  md5,
  encryptPassword,
  decryptPassword
} 