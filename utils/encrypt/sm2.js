/**
 * SM2加解密工具类
 * SM2是国家商用密码算法，基于椭圆曲线密码(ECC)
 * 提供简化版实现，小程序环境建议在服务端处理实际加解密
 */

/**
 * SM2加密工具类
 */
class SM2Crypto {
  constructor() {
    // 默认公钥和私钥为空，需要通过setKey方法设置
    this.publicKey = ''
    this.privateKey = ''
  }
  
  /**
   * 设置密钥对
   * @param {Object} options - 配置对象
   * @param {String} options.publicKey - 公钥
   * @param {String} options.privateKey - 私钥
   */
  setKey({ publicKey, privateKey }) {
    if (publicKey) this.publicKey = publicKey
    if (privateKey) this.privateKey = privateKey
  }
  
  /**
   * SM2加密
   * 小程序环境下建议在服务端实现实际的SM2加密
   * @param {String} msg - 待加密的明文
   * @param {String} publicKey - 公钥，如不传则使用默认公钥
   * @returns {String} 加密后的密文
   */
  encrypt(msg, publicKey = this.publicKey) {
    if (!publicKey) {
      throw new Error('SM2加密失败：未设置公钥')
    }
    
    console.warn('警告：小程序环境下SM2加密建议在服务端实现')
    
    try {
      // 这里提供一个简单的模拟加密实现
      // 在实际项目中，建议将数据发送到服务端进行SM2加密
      const mockEncrypt = (text, key) => {
        // 使用Base64编码模拟加密过程
        try {
          return uni.arrayBufferToBase64(new Uint8Array([...text].map(c => c.charCodeAt(0))).buffer)
        } catch (e) {
          // 如果环境不支持，使用简单替代
          const _btoa = typeof btoa === 'function' ? btoa : 
            function(str) {
              return Buffer.from(str).toString('base64')
            }
          return _btoa('SM2:' + encodeURIComponent(text))
        }
      }
      
      return mockEncrypt(msg, publicKey)
    } catch (error) {
      console.error('SM2加密错误:', error)
      throw new Error('SM2加密失败: ' + error.message)
    }
  }
  
  /**
   * SM2解密
   * 小程序环境下建议在服务端实现实际的SM2解密
   * @param {String} ciphertext - 密文
   * @param {String} privateKey - 私钥，如不传则使用默认私钥
   * @returns {String} 解密后的明文
   */
  decrypt(ciphertext, privateKey = this.privateKey) {
    if (!privateKey) {
      throw new Error('SM2解密失败：未设置私钥')
    }
    
    console.warn('警告：小程序环境下SM2解密建议在服务端实现')
    
    try {
      // 这里提供一个简单的模拟解密实现
      // 在实际项目中，建议将数据发送到服务端进行SM2解密
      const mockDecrypt = (text, key) => {
        // 使用Base64解码模拟解密过程
        try {
          const buffer = uni.base64ToArrayBuffer(text)
          return String.fromCharCode.apply(null, new Uint8Array(buffer))
        } catch (e) {
          // 如果环境不支持，使用简单替代
          const _atob = typeof atob === 'function' ? atob : 
            function(str) {
              return Buffer.from(str, 'base64').toString()
            }
          const decoded = _atob(text)
          return decoded.startsWith('SM2:') ? 
            decodeURIComponent(decoded.substring(4)) : 
            decoded
        }
      }
      
      return mockDecrypt(ciphertext, privateKey)
    } catch (error) {
      console.error('SM2解密错误:', error)
      throw new Error('SM2解密失败: ' + error.message)
    }
  }
  
  /**
   * SM2签名
   * 小程序环境下建议在服务端实现实际的SM2签名
   * @param {String} msg - 待签名消息
   * @param {String} privateKey - 私钥，如不传则使用默认私钥
   * @returns {String} 签名结果
   */
  sign(msg, privateKey = this.privateKey) {
    if (!privateKey) {
      throw new Error('SM2签名失败：未设置私钥')
    }
    
    console.warn('警告：小程序环境下SM2签名建议在服务端实现')
    
    // 模拟签名，实际项目中请使用服务端签名
    return this.encrypt(msg + '_sm2_signed', privateKey)
  }
  
  /**
   * SM2验签
   * 小程序环境下建议在服务端实现实际的SM2验签
   * @param {String} msg - 原始消息
   * @param {String} signature - 签名
   * @param {String} publicKey - 公钥，如不传则使用默认公钥
   * @returns {Boolean} 验签结果，true为验签成功
   */
  verify(msg, signature, publicKey = this.publicKey) {
    if (!publicKey) {
      throw new Error('SM2验签失败：未设置公钥')
    }
    
    console.warn('警告：小程序环境下SM2验签建议在服务端实现')
    
    // 模拟验签过程，实际项目中请使用服务端验签
    try {
      const decrypted = this.decrypt(signature, this.privateKey)
      return decrypted === msg + '_sm2_signed'
    } catch (e) {
      return false
    }
  }
}

export default new SM2Crypto() 