import http from './request'
import crypto from './encrypt/crypto.js'
import { API } from '@/config'

// 用户信息相关工具函数

export const login = (username, password) => {
  console.log('password', crypto.AES.encrypt(password, '12345678901234567890123456789012'))
  // return http.post(API.base.login, {
  //   username: username,
  //   password: crypto.AES.encrypt(password, '12345678901234567890123456789012')
  // }, {
  //   showLoading: true,
  //   loadingText: '登录中...'
  // }).then(res => {
  //   uni.setStorageSync('accessToken', res.accessToken)
  //   uni.setStorageSync('refreshToken', res.refreshToken)
  //   uni.setStorageSync('userInfo', res.user)
  // })
}

/**
 * 获取用户信息
 * @returns {Promise} 返回用户信息
 */
export const getUserProfile = () => {
  return new Promise((resolve, reject) => {
    uni.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        resolve(res.userInfo);
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};

/**
 * 获取登录凭证
 * @returns {Promise} 返回登录凭证
 */
export const getLoginCode = () => {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: (res) => {
        resolve(res.code);
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};

const url2Base64 = (url) => {
  return new Promise((resolve, reject) => {
    // 先下载图片到本地临时文件
    uni.downloadFile({
      url: url,
      success: (res) => {
        if (res.statusCode === 200) {
          // 读取临时文件并转为base64
          uni.getFileSystemManager().readFile({
            filePath: res.tempFilePath,
            encoding: 'base64',
            success: (res) => {
              resolve(res.data);
            },
            fail: (err) => {
              reject(err);
            }
          });
        } else {
          reject(new Error('下载头像失败'));
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};

/**
 * 使用凭据和微信用户信息登录接口实现正式登录
 * @param {string} code 登录凭证
 * @param {string} userInfo 用户信息
 * @returns {Promise} 返回登录结果
 */
export const loginWithCredential = (code, userInfo) => {
  return new Promise((resolve, reject) => {
    http.post(API.base.wxLogin, {
      code: code,
      userInfo: userInfo,
    }).then(res => {
      uni.setStorageSync('accessToken', res.accessToken)
      uni.setStorageSync('refreshToken', res.refreshToken)
      uni.setStorageSync('userInfo', res.user)
      // 查询当前头像
      http.post(API.user.getCurrentAvatar, {}, {
        showLoading: true,
        loadingText: '加载中...'
      }).then(res1 => {
        if(!res1.base64) {
          // 将avatarUrl转化为base64传输
          url2Base64(userInfo.avatarUrl).then(base64 => {
            http.post(API.user.uploadAvatar, {
              base64: base64,
            }).catch(err => {
              console.error('上传头像失败:', err)
            })
          }).finally(() => {
            resolve(res)
          })
        } else {
          resolve(res)
        }
      }).catch(err => {
        resolve(res)
      })
    }).catch(err => {
      reject(err)
    })
  });
};

/**
 * 检查登录状态
 * @returns {boolean} 是否已登录
 */
export const checkLoginStatus = () => {
  const token = uni.getStorageSync('accessToken');
  const userInfo = uni.getStorageSync('userInfo');
  return !!(token && userInfo);
};

/**
 * 保存用户信息到本地存储
 * @param {Object} userInfo 用户信息
 */
export const saveUserInfo = (userInfo) => {
  uni.setStorageSync('userInfo', userInfo);
};

/**
 * 保存登录凭证到本地存储
 * @param {string} token 登录凭证
 */
export const saveToken = (token) => {
  uni.setStorageSync('accessToken', token)
};

/**
 * 清除登录信息
 */
export const clearLoginInfo = () => {
  uni.removeStorageSync('accessToken');
  uni.removeStorageSync('refreshToken');
  uni.removeStorageSync('userInfo');
}; 