<template>
  <view class="login-container">
    <view class="login-box" v-if="!isLoggedIn">
      <image class="avatar-default" :src="getImagePath('default-avatar.png')" mode="aspectFit"></image>
      <view class="login-tips">登录获取更多功能</view>
      <button class="login-btn" @click="handleLogin">
        <text class="btn-text">微信登录</text>
      </button>
    </view>
    
    <view class="user-info" v-else>
      <image class="avatar" v-if="userInfo.avatarBase64" :src="`data:image/png;base64,${userInfo.avatarBase64}`" mode="aspectFit"></image>
      <image class="avatar" v-else-if="userInfo.avatarUrl" :src="userInfo.avatarUrl" mode="aspectFit"></image>
      <image class="avatar" v-else :src="getImagePath('default-avatar.png')" mode="aspectFit"></image>
      <view class="info-box">
        <view class="user-meta">
          <text class="nickname">{{userInfo.username}}</text>
        </view>
        <button class="logout-btn" @click="handleLogout">
          <text class="btn-icon">🚪</text>
          <text class="btn-text">退出</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script>
import { getUserProfile, getLoginCode, saveUserInfo, saveToken, clearLoginInfo, checkLoginStatus, loginWithCredential } from '@/utils/user';
import { getImagePath } from '@/utils/path'
import { http } from '@/utils/index.js'
import { API } from '@/config/index.js'

export default {
  name: 'Login',
  data() {
    return {
      isLoggedIn: false,
      userInfo: null
    }
  },
  created() {
    this.checkLogin();
  },
  methods: {
    // getImagePath
    getImagePath: getImagePath,
    // 检查登录状态
    checkLogin(again = false) {
      this.$nextTick(() => {
        this.isLoggedIn = checkLoginStatus();
        if (this.isLoggedIn) {
          this.userInfo = uni.getStorageSync('userInfo');
          // 查询头像
          (again || !this.userInfo.avatarBase64) && http.post(API.user.getCurrentAvatar, {}, {
            showLoading: true,
            loadingText: '加载中...'
          }).then(res => {
            this.userInfo.avatarBase64 = res.base64;
            uni.setStorageSync('userInfo', this.userInfo);
          })
        }
      });
    },
    
    // 处理登录
    async handleLogin() {
      try {
        // 显示加载提示
        uni.showLoading({
          title: '登录中...',
          mask: true
        });
        
        // 获取用户信息
        const userInfo = await getUserProfile();
        
        // 获取登录凭证
        const code = await getLoginCode();
        
        // TODO: 这里需要把code发送到后端换取token
        // const token = await loginAPI(code, userInfo);
        loginWithCredential(code, userInfo).then(res => {
          const token = res.accessToken;
          Object.assign(userInfo, res.user);
          
          // 保存用户信息和token
          saveUserInfo(userInfo);
          saveToken(token);
          
          // 更新状态
          this.userInfo = userInfo;
          this.isLoggedIn = true;
          this.checkLogin(true)
          // 显示成功提示
          uni.showToast({
            title: '登录成功',
            icon: 'success'
          });
        })
      } catch (error) {
        console.error('登录失败:', error);
        uni.showToast({
          title: '登录失败',
          icon: 'error'
        });
      } finally {
        uni.hideLoading();
      }
    },
    
    // 处理退出登录
    handleLogout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            // 清除登录信息
            clearLoginInfo();
            
            // 更新状态
            this.userInfo = null;
            this.isLoggedIn = false;
            
            // 显示提示
            uni.showToast({
              title: '已退出登录',
              icon: 'success'
            });
          }
        }
      });
    }
  }
}
</script>

<style lang="scss">
.login-container {
  padding: 20rpx 30rpx;
  
  .login-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30rpx;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 20rpx;
    backdrop-filter: blur(10rpx);
    
    .avatar-default {
      width: 120rpx;
      height: 120rpx;
      border-radius: 50%;
      margin-bottom: 20rpx;
      border: 4rpx solid rgba(255, 255, 255, 0.8);
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
    }
    
    .login-tips {
      font-size: 28rpx;
      color: #666;
      margin-bottom: 30rpx;
    }
    
    .login-btn {
      width: 100%;
      height: 80rpx;
      line-height: 80rpx;
      text-align: center;
      background: linear-gradient(45deg, #4ECDC4, #45B7D1);
      color: #fff;
      border-radius: 40rpx;
      font-size: 32rpx;
      border: none;
      
      &:active {
        transform: scale(0.98);
        background: linear-gradient(45deg, #45B7D1, #4ECDC4);
      }
    }
  }
  
  .user-info {
    display: flex;
    align-items: flex-start;
    padding: 20rpx;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 20rpx;
    backdrop-filter: blur(10rpx);
    
    .avatar {
      width: 100rpx;
      height: 100rpx;
      border-radius: 50%;
      margin-right: 20rpx;
      border: 4rpx solid rgba(255, 255, 255, 0.8);
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
    }
    
    .info-box {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 12rpx;
      padding-top: 6rpx;
      
      .user-meta {
        .nickname {
          font-size: 32rpx;
          color: #333;
          font-weight: bold;
          display: block;
          max-width: 400rpx;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.2;
        }
      }
      
      .logout-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8rpx;
        height: 56rpx;
        padding: 0 20rpx;
        background: linear-gradient(45deg, #FF6B6B, #FFB199);
        color: #fff;
        border-radius: 28rpx;
        font-size: 24rpx;
        border: none;
        transition: all 0.3s ease;
        box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.2);
        margin-left: -2rpx;
        
        .btn-icon {
          font-size: 28rpx;
        }
        
        .btn-text {
          line-height: 1;
        }
        
        &:active {
          transform: scale(0.95);
          background: linear-gradient(45deg, #FF5252, #FF8F73);
          box-shadow: 0 2rpx 8rpx rgba(255, 107, 107, 0.1);
        }
      }
    }
  }
}
</style> 