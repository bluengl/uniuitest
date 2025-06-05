/**
 * 网络请求工具类
 * 封装uni-app提供的网络请求API，实现请求拦截、响应拦截、错误处理等功能
 */

// 导入加密工具
import crypto from './encrypt/crypto.js'
import { isEmpty } from './tools.js'
import { BASE_API_PATH } from '@/config'

// 定义常量
const TOKEN_EXPIRED_CODE = 403; // token过期的状态码
const NO_LOGIN_CODE = 401; // 未登录的状态码
const REFRESH_TOKEN_URL = `${BASE_API_PATH}/refreshToken`; // 刷新token的接口地址，根据实际情况修改
const LOGIN_PAGE = '/pages/index/index?openDrawer=true'; //登录页面

// 基础配置
const config = {
  // API基础URL，根据实际情况修改
  baseUrl: '',
  // 请求超时时间(ms)
  timeout: 30000,
  // 请求头 - 修改默认content-type为form表单格式
  header: {
    'content-type': 'application/x-www-form-urlencoded'
  },
  // 是否显示加载提示
  showLoading: false,
  // 加载提示文本
  loadingText: '加载中...',
  // 是否开启加密传输
  enableEncrypt: false,
  // 加密方式: 'RSA' | 'SM2' | 'simple'
  encryptType: 'simple',
  // 用于加密数据的公钥
  encryptPublicKey: '',
  // 简单加密的密钥（如果使用简单加密方式）
  encryptKey: '',
  // 是否自动刷新token
  autoRefreshToken: true
}

// 正在刷新token的标记，防止多个请求同时刷新token
let isRefreshing = false;
// 等待token刷新的请求队列
let refreshSubscribers = [];

/**
 * 将请求添加到等待队列
 * @param {Function} callback - 请求完成后的回调
 */
function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

/**
 * 执行等待队列中的请求
 * @param {string} token - 新的token
 */
function onTokenRefreshed(token) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

/**
 * 获取系统配置
 * @returns {Object} 系统配置
 */
const getSystemConfig = () => {
  try {
    return uni.getStorageSync('systemConfig') || {}
  } catch (e) {
    console.error('获取系统配置失败:', e)
    return {}
  }
}

/**
 * 获取token信息
 * @returns {Object} token信息
 */
const getTokenInfo = () => {
  try {
    return {
      accessToken: uni.getStorageSync('accessToken'),
      refreshToken: uni.getStorageSync('refreshToken')
    }
  } catch (e) {
    return {}
  }
}

const goToLogin = () => {
  // 清除所有缓存
  uni.clearStorageSync()
  // 使用模态框提示用户，自带蒙层
  const timer = setTimeout(() => {
    // 用户点击确认后才跳转到登录页
    uni.navigateTo({
      url: LOGIN_PAGE
    });
  }, 5000)

  uni.showModal({
    title: '登录已失效',
    content: '您的登录信息已过期，请重新登录',
    showCancel: false,
    success: () => {
      clearTimeout(timer);
      // 用户点击确认后才跳转到登录页
      uni.navigateTo({
        url: LOGIN_PAGE
      });
    }
  });   
}

/**
 * 刷新token
 * @returns {Promise} 返回Promise对象
 */
const refreshToken = () => {
  const tokenInfo = getTokenInfo();
  if (!tokenInfo.refreshToken) {
    return Promise.reject(new Error('刷新令牌不存在'));
  }
  
  return new Promise((resolve, reject) => {
    const systemConfig = getSystemConfig();
    const jwtPrefix = systemConfig.jwtInfo?.prefix || 'Bearer';
    
    // 添加请求标记，避免刷新token请求也被拦截为需要刷新
    const options = {
      url: `${REFRESH_TOKEN_URL}`,
      method: 'POST',
      header: {
        'content-type': 'application/json',
        [systemConfig.jwtInfo?.header || 'Authorization']: `${jwtPrefix} ${tokenInfo.refreshToken}`
      },
      data: {},
      // 标记这是刷新token请求，避免进入循环
      isRefreshTokenRequest: true
    };
    
    uni.request({
      ...options,
      success: (res) => {
        if (res.data && res.data.data && res.data.status === 200) {
          // 更新本地存储的token信息
          uni.setStorageSync('accessToken', res.data.data.accessToken);
          uni.setStorageSync('userInfo', res.data.data.user);
          
          // 确保新token已完全保存到存储中
          setTimeout(() => {
            // 刷新token成功
            resolve(res.data.data.accessToken);
          }, 100);
        } else {
          // 刷新token失败
          goToLogin();
          reject(new Error('刷新令牌失败'));
        }
      },
      fail: (err) => {
        // 刷新token失败
        goToLogin();
        reject(new Error('刷新令牌请求失败'));
      }
    });
  });
};

/**
 * 判断URL是否匹配通配符模式
 * @param {String} url - 请求URL
 * @param {String} pattern - 通配符模式
 * @returns {Boolean} 是否匹配
 */
const isUrlMatch = (url, pattern) => {
  // 将通配符转换为正则表达式
  const regexPattern = pattern
    .replace(/\*\*/g, '.*')  // ** 表示任意路径
    .replace(/\*/g, '[^/]*') // * 表示单层路径内的任意字符
    .replace(/\//g, '\\/');  // 转义 /
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(url);
}

/**
 * 判断URL是否在忽略列表中
 * @param {String} url - 请求URL
 * @param {Array} ignoreList - 忽略列表
 * @returns {Boolean} 是否在忽略列表中
 */
const isUrlInIgnoreList = (url, ignoreList = []) => {
  if (!ignoreList || !ignoreList.length) return false;
  
  // 去除baseUrl，只保留路径部分
  let path = url;
  if (config.baseUrl && url.startsWith(config.baseUrl)) {
    path = url.substring(config.baseUrl.length);
  }
  
  // 确保以/开头
  if (!path.startsWith('/') && !path.startsWith('http')) {
    path = '/' + path;
  }

  if (path.startsWith('http')) {
    // 去除ip和端口
    path = path.substring(path.indexOf('/', 8));
  }
  
  // 检查是否在忽略列表中
  return ignoreList.some(pattern => isUrlMatch(path, pattern));
}

/**
 * 将对象转换为FormData格式的字符串
 * @param {Object} data - 需要转换的对象
 * @returns {String} - 返回FormData格式字符串
 */
const objectToFormData = (data) => {
  if (!data || typeof data !== 'object') return '';
  
  // 递归处理嵌套对象
  const processValue = (key, value) => {
    if (value === null || value === undefined) return '';
    
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        // 处理数组
        return value.map(item => encodeURIComponent(item)).join(',');
      } else {
        // 处理对象，转为JSON字符串
        return encodeURIComponent(JSON.stringify(value));
      }
    }
    return encodeURIComponent(value);
  };
  
  return Object.keys(data)
    .filter(key => data[key] !== undefined && data[key] !== null)
    .map(key => `${encodeURIComponent(key)}=${processValue(key, data[key])}`)
    .join('&');
};

// 请求拦截器
const requestInterceptor = (options) => {
  const systemConfig = getSystemConfig();
  if (isEmpty(systemConfig) && options.url.endsWith('getSystemConfig')) {
    return options
  }
  
  // JWT身份验证
  const tokenInfo = getTokenInfo();
  if (tokenInfo.accessToken) {
    // 检查URL是否在安全忽略列表中
    const isSecurityIgnored = isUrlInIgnoreList(options.url, systemConfig.securityIgnoreUrls);
    
    // 如果不在安全忽略列表中，添加Authorization头
    if (!isSecurityIgnored) {
      const jwtPrefix = systemConfig.jwtInfo.prefix || 'Bearer';
      options.header = {
        ...options.header,
        [systemConfig.jwtInfo.header || 'Authorization']: `${jwtPrefix} ${tokenInfo.accessToken}`
      };
    }
  }
  
  // 数据处理，转为form表单格式
  if (options.data && options.method !== 'GET') {
    // 判断是否需要表单提交
    const isFormData = options.header['content-type'].includes('application/x-www-form-urlencoded');
    
    // 判断是否需要加密
    const isEncryptionEnabled = systemConfig.enableEncryption !== undefined 
                              ? systemConfig.enableEncryption 
                              : !!systemConfig.encryptionType;
    
    const isEncryptionIgnored = isUrlInIgnoreList(options.url, systemConfig.encryptionIgnoreUrls);
    
    // 如果需要加密且不在加密忽略列表中
    if (isEncryptionEnabled && !isEncryptionIgnored && options.enableEncrypt !== false) {
      const encryptionType = systemConfig.encryptionType ? systemConfig.encryptionType.toLowerCase() : 'simple';
      let publicKey = '';
      
      // 先将数据转为JSON字符串
      const jsonStr = JSON.stringify(options.data);
      
      if (encryptionType === 'rsa' && systemConfig.rsaPublicKey) {
        publicKey = systemConfig.rsaPublicKey;
        options.data = {
          encrypted: crypto.RSA.encrypt(jsonStr, publicKey)
        };
      } else if (encryptionType === 'sm2' && systemConfig.sm2PublicKey) {
        publicKey = systemConfig.sm2PublicKey;
        options.data = {
          encrypted: crypto.SM2.encrypt(jsonStr, publicKey)
        };
      } else if (encryptionType === 'aes') {
        // 使用AES或简单加密
        const key = systemConfig.encryptKey || config.encryptKey || 'default_key';
        if (encryptionType === 'aes' && crypto.AES) {
          options.data = {
            encrypted: crypto.AES.encrypt(jsonStr, key)
          };
        } else {
          options.data = {
            encrypted: crypto.simpleEncrypt(jsonStr, key)
          };
        }
        publicKey = 'simple-encryption';
      } else {
        config.encryptType = 'simple';
        config.encryptKey = systemConfig.encryptKey || 'default_key';
      }
      
      if (publicKey) {
        // 添加加密标识头
        options.header['X-Encrypted'] = 'true';
        options.header['X-Encrypt-Type'] = encryptionType;
      }
    }
    
    // 如果是GET请求，参数会自动追加到URL
    // 如果是表单格式且不是文件上传，转换数据格式
    if (isFormData && !options.header['content-type'].includes('multipart/form-data')) {
      options.data = objectToFormData(options.data);
    }
  } else if (options.data && options.method === 'GET') {
    // GET请求参数处理（让uni.request自动处理）
    // 无需特殊处理，uni.request会自动将GET参数追加到URL
  }
  
  return options;
}

// 响应拦截器
const responseInterceptor = (response, originalOptions) => {
  // 处理HTTP状态码
  if (response.data.status === TOKEN_EXPIRED_CODE && config.autoRefreshToken) {
    // Token过期，尝试刷新
    if (!isRefreshing) {
      isRefreshing = true;
      
      return refreshToken()
        .then(newToken => {
          isRefreshing = false;
          // 通知所有等待的请求
          onTokenRefreshed(newToken);
          
          // 修改：确保重试请求使用新token
          // 克隆原始请求选项
          const newOptions = {...originalOptions};
          // 移除已有的Authorization头，让请求拦截器添加新的
          if (newOptions.header && newOptions.header.Authorization) {
            delete newOptions.header.Authorization;
          }
          
          // 重试当前请求，传递新选项
          return request(newOptions);
        })
        .catch(error => {
          isRefreshing = false;
          throw error;
        });
    } else {
      // 返回Promise，等待token刷新完成后重试
      return new Promise((resolve) => {
        subscribeTokenRefresh(token => {
          // 修改：重新创建请求，确保使用新token
          const newOptions = {...originalOptions};
          if (newOptions.header && newOptions.header.Authorization) {
            delete newOptions.header.Authorization;
          }
          resolve(request(newOptions));
        });
      });
    }
  } else if (response.data.status === NO_LOGIN_CODE) {
    // 清除所有缓存
    uni.clearStorageSync()
    // 使用模态框提示用户，自带蒙层
    const timer = setTimeout(() => {
      // 未登录，跳转登录页
      uni.navigateTo({
        url: LOGIN_PAGE
      });
    }, 5000); // 延迟2秒，与toast显示时间一致
    uni.showModal({
      title: '登录已失效',
      content: '您的登录信息已过期，请重新登录',
      showCancel: false,
      success: () => {
        clearTimeout(timer);
        uni.navigateTo({
          url: LOGIN_PAGE
        });
      }
    });
  
  } else if (response.statusCode !== 200) {
    // 其他HTTP错误
    const error = new Error(`请求失败，HTTP状态码: ${response.statusCode}，信息: ${response.data.error}`);
    error.response = response;
    // 使用uniui的提示组件
    response.data.error && uni.showToast({
      title: response.data.error,
      icon: 'error',
      duration: 3000
    });
    throw error;
  }
  
  // 解析响应数据
  const responseData = response.data;
  
  // 检查是否加密数据需要解密
  if (response.header && response.header['X-Encrypted'] === 'true') {
    try {
      const systemConfig = getSystemConfig();
      const encryptType = response.header['X-Encrypt-Type'] || systemConfig.encryptionType || 'simple';
      let decryptedData;
      
      if (encryptType.toLowerCase() === 'rsa') {
        // RSA解密需要私钥，通常在客户端没有私钥，这里仅作示意
        console.warn('RSA解密需要私钥，通常在服务端进行');
        decryptedData = responseData;
      } else if (encryptType.toLowerCase() === 'sm2') {
        // SM2解密需要私钥，通常在客户端没有私钥，这里仅作示意
        console.warn('SM2解密需要私钥，通常在服务端进行');
        decryptedData = responseData;
      } else if (encryptType.toLowerCase() === 'aes' && crypto.AES && responseData.encrypted) {
        // AES解密
        const key = systemConfig.encryptKey || config.encryptKey || 'default_key';
        decryptedData = JSON.parse(crypto.AES.decrypt(responseData.encrypted, key));
      } else {
        // 简单解密
        const key = systemConfig.encryptKey || config.encryptKey || 'default_key';
        if (responseData.encrypted) {
          decryptedData = JSON.parse(crypto.simpleDecrypt(responseData.encrypted, key));
        } else {
          decryptedData = responseData;
        }
      }
      
      // 替换为解密后的数据
      response.data = decryptedData;
    } catch (error) {
      console.error('解密响应数据失败:', error);
      // 继续处理原始数据
    }
  }
  
  // 判断业务状态码
  if (responseData.status === 200) {
    // 业务成功，返回data字段
    return responseData.data;
  } else {
    // 业务失败，抛出业务错误
    const error = new Error(responseData.error || '未知业务错误');
    error.code = responseData.status;
    error.data = responseData;
    error.timestamp = responseData.timestamp;
    error.path = responseData.path;
    // 使用uniui的提示组件
    responseData.error && uni.showToast({
      title: responseData.error,
      icon: 'error',
      duration: 3000
    });
    throw error;
  }
}

/**
 * 发起GET请求
 * @param {String} url - 请求地址
 * @param {Object} params - 请求参数
 * @param {Object} options - 请求配置，可覆盖默认配置
 * @returns {Promise} - 返回Promise对象
 */
const get = (url, params = {}, options = {}) => {
  return request({
    url,
    method: 'GET',
    data: params,
    ...options
  });
}

/**
 * 发起POST请求
 * @param {String} url - 请求地址
 * @param {Object} data - 请求数据
 * @param {Object} options - 请求配置，可覆盖默认配置
 * @returns {Promise} - 返回Promise对象
 */
const post = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'POST',
    data,
    ...options
  });
}

/**
 * 发起PUT请求
 * @param {String} url - 请求地址
 * @param {Object} data - 请求数据
 * @param {Object} options - 请求配置，可覆盖默认配置
 * @returns {Promise} - 返回Promise对象
 */
const put = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'PUT',
    data,
    ...options
  });
}

/**
 * 发起DELETE请求
 * @param {String} url - 请求地址
 * @param {Object} params - 请求参数
 * @param {Object} options - 请求配置，可覆盖默认配置
 * @returns {Promise} - 返回Promise对象
 */
const del = (url, params = {}, options = {}) => {
  // 安全删除检查
  // 提示用户是否删除
  return new Promise((resolve, reject) => {
    uni.showModal({
      title: '提示',
      content: '是否删除',
      success: (res) => {
        if (res.confirm) {
          request({
            url,
            method: 'DELETE',
            data: params,
            ...options
          }).then(resolve).catch(reject)
        }
      }
    })
  })
}

/**
 * 通用请求方法
 * @param {Object} options - 请求配置
 * @returns {Promise} - 返回Promise对象
 */
const request = (options) => {
  
  // 合并配置
  const mergedOptions = {
    ...config,
    ...options,
    header: {
      ...config.header,
      ...(options.header || {})
    }
  };

  // 处理URL
  if (!mergedOptions.url.startsWith('http')) {
    mergedOptions.url = `${config.baseUrl}${mergedOptions.url}`;
  }

  // 请求拦截
  const interceptedOptions = requestInterceptor(mergedOptions);

  // 显示加载提示
  if (interceptedOptions.showLoading) {
    uni.showLoading({
      title: interceptedOptions.loadingText || '加载中...',
      mask: true
    });
  }

  // 创建重试请求函数
  const executeRequest = (retry = false) => {
    return new Promise((resolve, reject) => {
      uni.request({
        ...interceptedOptions,
        success: (res) => {
          try {
            // 调用响应拦截器，传入重试函数和原始请求选项
            const data = responseInterceptor(res, interceptedOptions);
            resolve(data);
          } catch (error) {
            // 如果是token过期错误且已经自动处理，不需要再次reject
            if (error.isTokenHandled) return;
            reject(error);
          }
        },
        fail: (err) => {
          uni.showToast({
            title: '网络请求失败',
            icon: 'error',
            duration: 3000
          });
          reject(new Error('网络请求失败：' + JSON.stringify(err)));
        },
        complete: () => {
          // 只有在非重试情况下才隐藏loading
          if (!retry && interceptedOptions.showLoading) {
            uni.hideLoading();
          }
        }
      });
    });
  };

  return executeRequest();
}

/**
 * 上传文件
 * @param {String} url - 上传地址
 * @param {String} filePath - 要上传的文件路径
 * @param {String} name - 文件对应的key
 * @param {Object} formData - 附加的表单数据
 * @param {Object} options - 上传配置
 * @returns {Promise} - 返回Promise对象
 */
const uploadFile = (url, filePath, name = 'file', formData = {}, options = {}) => {
  // 合并配置
  const mergedOptions = {
    ...config,
    ...options,
    header: {
      ...config.header,
      'content-type': 'multipart/form-data',
      ...(options.header || {})
    }
  };

  // 处理URL
  if (!url.startsWith('http')) {
    url = `${config.baseUrl}${url}`;
  }

  // 应用请求拦截器
  const interceptedOptions = requestInterceptor(mergedOptions);

  // 显示加载提示
  if (interceptedOptions.showLoading) {
    uni.showLoading({
      title: '上传中...',
      mask: true
    });
  }

  return new Promise((resolve, reject) => {
    const uploadTask = uni.uploadFile({
      url,
      filePath,
      name,
      formData,
      header: interceptedOptions.header,
      success: (res) => {
        try {
          // 尝试解析返回的JSON
          let responseData = res.data;
          if (typeof responseData === 'string') {
            try {
              responseData = JSON.parse(responseData);
            } catch (e) {
              // 解析失败，保持原样
            }
          }
          
          // 判断业务状态码
          if (responseData.status === 200) {
            resolve(responseData.data);
          } else {
            const error = new Error(responseData.error || '未知业务错误');
            error.code = responseData.status;
            error.data = responseData;
            reject(error);
          }
        } catch (error) {
          reject(error);
        }
      },
      fail: (err) => {
        reject(new Error('文件上传失败：' + JSON.stringify(err)));
      },
      complete: () => {
        if (interceptedOptions.showLoading) {
          uni.hideLoading();
        }
      }
    });

    // 返回上传任务对象，方便调用者控制上传过程
    options.getTask && options.getTask(uploadTask);
  });
}

/**
 * 下载文件
 * @param {String} url - 下载地址
 * @param {Object} options - 下载配置
 * @returns {Promise} - 返回Promise对象，包含临时文件路径
 */
const downloadFile = (url, options = {}) => {
  // 合并配置
  const mergedOptions = {
    ...config,
    ...options,
    header: {
      ...config.header,
      ...(options.header || {})
    }
  };

  // 处理URL
  if (!url.startsWith('http')) {
    url = `${config.baseUrl}${url}`;
  }

  // 应用请求拦截器
  const interceptedOptions = requestInterceptor(mergedOptions);

  // 显示加载提示
  if (interceptedOptions.showLoading) {
    uni.showLoading({
      title: '下载中...',
      mask: true
    });
  }

  return new Promise((resolve, reject) => {
    const downloadTask = uni.downloadFile({
      url,
      header: interceptedOptions.header,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.tempFilePath);
        } else {
          reject(new Error(`下载失败，状态码: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        reject(new Error('文件下载失败：' + JSON.stringify(err)));
      },
      complete: () => {
        if (interceptedOptions.showLoading) {
          uni.hideLoading();
        }
      }
    });

    // 返回下载任务对象，方便调用者控制下载过程
    options.getTask && options.getTask(downloadTask);
  });
}

/**
 * 从系统配置初始化请求配置
 */
const initFromSystemConfig = () => {
  const systemConfig = getSystemConfig();
  
  // 优先使用enableEncryption属性
  if (systemConfig.enableEncryption !== undefined) {
    config.enableEncrypt = systemConfig.enableEncryption;
  } else if (systemConfig.encryptionType) {
    // 如果未设置enableEncryption但设置了encryptionType，则启用加密
    config.enableEncrypt = true;
  }
  
  if (systemConfig.encryptionType) {
    const encryptionType = systemConfig.encryptionType.toLowerCase();
    
    if (encryptionType === 'rsa' && systemConfig.rsaPublicKey) {
      config.encryptType = 'RSA';
      config.encryptPublicKey = systemConfig.rsaPublicKey;
    } else if (encryptionType === 'sm2' && systemConfig.sm2PublicKey) {
      config.encryptType = 'SM2';
      config.encryptPublicKey = systemConfig.sm2PublicKey;
    } else if (encryptionType === 'aes') {
      config.encryptType = 'AES';
      config.encryptKey = systemConfig.encryptKey || 'default_key';
    } else {
      config.encryptType = 'simple';
      config.encryptKey = systemConfig.encryptKey || 'default_key';
    }
  }
  
  return systemConfig;
}

/**
 * 设置全局配置
 * @param {Object} customConfig - 自定义配置
 */
const setConfig = (customConfig) => {
  Object.assign(config, customConfig);
}

/**
 * 设置基础URL
 * @param {String} url - 基础URL
 */
const setBaseUrl = (url) => {
  config.baseUrl = url;
}

/**
 * 启用数据加密
 * @param {Object} options - 加密配置
 * @param {String} options.type - 加密类型: 'RSA' | 'SM2' | 'simple' | 'AES'
 * @param {String} options.publicKey - 公钥 (RSA/SM2)
 * @param {String} options.key - 密钥 (simple/AES)
 */
const enableEncryption = (options = {}) => {
  config.enableEncrypt = true;
  
  if (options.type) {
    config.encryptType = options.type;
  }
  
  if (options.publicKey) {
    config.encryptPublicKey = options.publicKey;
  }
  
  if (options.key) {
    config.encryptKey = options.key;
  }
}

/**
 * 禁用数据加密
 */
const disableEncryption = () => {
  config.enableEncrypt = false;
}

/**
 * 清除token
 */
const clearToken = () => {
  uni.removeStorageSync('accessToken');
  uni.removeStorageSync('refreshToken');
  uni.removeStorageSync('userInfo');
}

/**
 * 设置token
 * @param {Object} tokenData - token数据
 */
const setToken = (tokenData) => {
  if (tokenData.accessToken) uni.setStorageSync('accessToken', tokenData.accessToken);
  if (tokenData.refreshToken) uni.setStorageSync('refreshToken', tokenData.refreshToken);
  if (tokenData.user) uni.setStorageSync('userInfo', tokenData.user);
}

/**
 * 使用JSON格式发送请求
 * @returns {Object} - 返回当前request对象
 */
const useJSON = () => {
  config.header['content-type'] = 'application/json';
  return {
    get, post, put, delete: del, request, uploadFile, downloadFile
  };
}

/**
 * 使用表单格式发送请求
 * @returns {Object} - 返回当前request对象
 */
const useForm = () => {
  config.header['content-type'] = 'application/x-www-form-urlencoded';
  return {
    get, post, put, delete: del, request, uploadFile, downloadFile
  };
}

// 初始化
initFromSystemConfig();

export default {
  get,
  post,
  put,
  delete: del,
  request,
  uploadFile,
  downloadFile,
  setConfig,
  setBaseUrl,
  enableEncryption,
  disableEncryption,
  initFromSystemConfig,
  clearToken,
  setToken,
  getTokenInfo,
  useJSON,     // 新增：使用JSON格式
  useForm      // 新增：使用表单格式
} 