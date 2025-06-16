<template>
  <view class="profile-page">
    <view class="header">
      <image :src="userInfo.avatar" class="avatar" />
      <text class="name">{{ userInfo.name }}</text>
      <text class="email">{{ userInfo.email }}</text>
    </view>

    <view class="info-section">
      <view class="section-title">
        <text>个人信息</text>
      </view>
      <view class="info-list">
        <view class="info-item">
          <text class="label">用户ID</text>
          <text class="value">{{ userInfo.id }}</text>
        </view>
        <view class="info-item">
          <text class="label">注册时间</text>
          <text class="value">{{ formatDate(userInfo.registerTime) }}</text>
        </view>
        <view class="info-item">
          <text class="label">最后登录</text>
          <text class="value">{{ formatDate(userInfo.lastLogin) }}</text>
        </view>
      </view>
    </view>

    <view class="menu-section">
      <view class="section-title">
        <text>功能菜单</text>
      </view>
      <view class="menu">
        <view class="menu-item" @tap="handleMenuClick('settings')">
          <text class="menu-text">设置</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @tap="handleMenuClick('help')">
          <text class="menu-text">帮助与反馈</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @tap="handleMenuClick('about')">
          <text class="menu-text">关于我们</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item danger" @tap="handleMenuClick('logout')">
          <text class="menu-text">退出登录</text>
          <text class="menu-arrow">></text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive } from 'vue'

interface UserInfo {
  id: number
  name: string
  email: string
  avatar: string
  registerTime: Date
  lastLogin: Date
}

const userInfo = reactive<UserInfo>({
  id: 1001,
  name: '张三',
  email: 'zhangsan@example.com',
  avatar: '/assets/images/avatar.png',
  registerTime: new Date('2023-01-15'),
  lastLogin: new Date()
})

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const handleMenuClick = (action: string) => {
  console.log('菜单点击:', action)

  switch (action) {
    case 'settings':
      wx.showToast({
        title: '设置功能开发中',
        icon: 'none'
      })
      break
    case 'help':
      wx.showToast({
        title: '帮助功能开发中',
        icon: 'none'
      })
      break
    case 'about':
      wx.showModal({
        title: '关于我们',
        content: 'Vue3 微信小程序编译器示例\n版本: 1.0.0',
        showCancel: false
      })
      break
    case 'logout':
      wx.showModal({
        title: '确认',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            wx.showToast({
              title: '已退出登录',
              icon: 'success'
            })
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          }
        }
      })
      break
    default:
      wx.showToast({
        title: `点击了${action}`,
        icon: 'none'
      })
  }
}
</script>

<style lang="scss" scoped>
.profile-page {
  padding: 20rpx;
  background: #f5f5f5;
  min-height: 100vh;

  .header {
    background: white;
    border-radius: 16rpx;
    padding: 40rpx;
    text-align: center;
    margin-bottom: 20rpx;

    .avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: 50%;
      margin-bottom: 20rpx;
    }

    .name {
      display: block;
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 10rpx;
    }

    .email {
      font-size: 28rpx;
      color: #666;
    }
  }

  .info-section,
  .menu-section {
    margin-bottom: 20rpx;

    .section-title {
      padding: 20rpx 0;

      text {
        font-size: 32rpx;
        font-weight: 500;
        color: #333;
      }
    }
  }

  .info-list {
    background: white;
    border-radius: 12rpx;
    overflow: hidden;

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 30rpx 20rpx;
      border-bottom: 1rpx solid #eee;

      &:last-child {
        border-bottom: none;
      }

      .label {
        font-size: 30rpx;
        color: #333;
      }

      .value {
        font-size: 30rpx;
        color: #666;
      }
    }
  }

  .menu {
    background: white;
    border-radius: 12rpx;
    overflow: hidden;

    .menu-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 30rpx 20rpx;
      border-bottom: 1rpx solid #eee;

      &:last-child {
        border-bottom: none;
      }

      &.danger .menu-text {
        color: #dc3545;
      }

      .menu-text {
        font-size: 32rpx;
        color: #333;
      }

      .menu-arrow {
        font-size: 28rpx;
        color: #999;
      }
    }
  }
}
</style>
