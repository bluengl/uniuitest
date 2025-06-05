// import request from '@/utils/request.js'

// // 在项目初始化时设置
// request.setConfig({
//     baseUrl: 'https://api.example.com',
//     timeout: 15000,
//     header: {
//       'content-type': 'application/json',
//       'X-Custom-Header': '自定义头部'
//     }
//   })


//   // 获取用户列表
// request.get('/users', { page: 1, limit: 10 })
// .then(res => {
//   // 处理响应数据
//   console.log('用户列表', res)
// })
// .catch(err => {
//   // 处理错误
//   console.error('获取用户列表失败', err)
// })

// // 创建新用户
// request.post('/users', {
//     name: '张三',
//     age: 18,
//     gender: '男'
//   }).then(res => {
//     console.log('创建成功', res)
//   }).catch(err => {
//     console.error('创建失败', err)
//   })

//   // 上传头像
// request.uploadFile(
//     '/upload/avatar',
//     tempFilePath,
//     'avatar',
//     { userId: '123' },
//     {
//       getTask: (task) => {
//         // 监听上传进度
//         task.onProgressUpdate((res) => {
//           console.log('上传进度', res.progress)
//         })
//       }
//     }
//   ).then(res => {
//     console.log('上传成功', res)
//   }).catch(err => {
//     console.error('上传失败', err)
//   })

//   // 下载文件
// request.downloadFile(
//     'https://example.com/files/document.pdf',
//     {
//       getTask: (task) => {
//         // 监听下载进度
//         task.onProgressUpdate((res) => {
//           console.log('下载进度', res.progress)
//         })
//       }
//     }
//   ).then(tempFilePath => {
//     console.log('下载成功，临时文件路径:', tempFilePath)
//     // 可以使用uni.saveFile保存文件到本地
//   }).catch(err => {
//     console.error('下载失败', err)
//   })

//   import { RSA } from '@/utils/index.js'

// // 生成密钥对
// const keyPair = RSA.generateKeyPair(2048) // 生成2048位密钥对
// console.log('公钥:', keyPair.publicKey)
// console.log('私钥:', keyPair.privateKey)

// // 设置已有的密钥
// RSA.setKey({
//   publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBg...', // RSA公钥
//   privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBAD...' // RSA私钥
// })

// // 加密
// const ciphertext = RSA.encrypt('需要加密的数据')

// // 解密
// const plaintext = RSA.decrypt(ciphertext)

// // 签名
// const signature = RSA.sign('需要签名的数据')

// // 验签
// const verifyResult = RSA.verify('原始数据', signature)
// console.log('验签结果:', verifyResult) // true表示验签成功

// // 加密大文本
// const longText = '这是一段很长的文本...'
// const encryptedLongText = RSA.encryptLongText(longText)

// // 解密大文本
// const decryptedLongText = RSA.decryptLongText(encryptedLongText)

//   import crypto from '@/utils/encrypt/crypto.js'

// // 生成随机字符串
// const randomStr = crypto.randomString(32) // 生成32位随机字符串

// // Base64编码
// const encoded = crypto.base64Encode('Hello World')

// // Base64解码
// const decoded = crypto.base64Decode(encoded)

// // 简单对称加密
// const key = '密钥123'
// const encrypted = crypto.simpleEncrypt('需要加密的数据', key)

// // 简单对称解密
// const decrypted = crypto.simpleDecrypt(encrypted, key)