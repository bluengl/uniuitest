/**
 * utils工具集合索引文件
 * 统一导出所有工具，方便使用
 */

// 导入各个工具模块
import request from './request.js'
import * as path from './path.js'
import sound from './sound.js'
import gameConfig from './gameConfig.js'
import test from './test.js'
import crypto from './encrypt/crypto.js'

// 导出加密相关工具
export const RSA = crypto.RSA
export const SM2 = crypto.SM2
export const AES = crypto.AES
export const encrypt = {
  RSA: crypto.RSA,
  SM2: crypto.SM2,
  AES: crypto.AES,
  randomString: crypto.randomString,
  base64Encode: crypto.base64Encode,
  base64Decode: crypto.base64Decode,
  simpleEncrypt: crypto.simpleEncrypt,
  simpleDecrypt: crypto.simpleDecrypt,
  md5: crypto.md5,
  // 安全密码传输
  encryptPassword: crypto.encryptPassword,
  decryptPassword: crypto.decryptPassword
}

// 导出网络请求工具
export const http = request

// 导出路径相关工具
export const getStaticPath = path.getStaticPath
export const getImagePath = path.getImagePath
export const getSoundPath = path.getSoundPath
export const getDataPath = path.getDataPath

// 导出声音相关工具
export const soundUtils = sound

// 导出游戏配置
export const config = gameConfig

// 导出测试工具
export const testUtils = test

// 生成随机字符串
const randomStr = crypto.randomString(32) // 生成32位随机字符串

// Base64编码
const encoded = crypto.base64Encode('Hello World')

// Base64解码
const decoded = crypto.base64Decode(encoded)

// 简单对称加密
const key = '密钥123'
const encrypted = crypto.simpleEncrypt('需要加密的数据', key)

// 简单对称解密
const decrypted = crypto.simpleDecrypt(encrypted, key)

// 默认导出所有工具
export default {
  http: request,
  path,
  sound,
  crypto,
  gameConfig,
  test,
  // 快捷方式
  RSA: crypto.RSA,
  SM2: crypto.SM2,
  AES: crypto.AES,
  // 添加加密工具集
  encrypt
} 