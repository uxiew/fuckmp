<template>
  <view class="index-page">
    <view class="header">
      <text class="title">{{ title }}</text>
      <text class="subtitle">{{ subtitle }}</text>
    </view>

    <view class="content">
      <UserCard :user="currentUser" @user-click="handleUserClick" />

      <view class="stats">
        <view class="stat-item">
          <text class="stat-label">访问次数</text>
          <text class="stat-value">{{ visitCount }}</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">在线时长</text>
          <text class="stat-value">{{ onlineTime }}分钟</text>
        </view>
      </view>

      <view class="actions">
        <button @tap="incrementVisit" class="btn primary">
          增加访问
        </button>
        <button @tap="navigateToProfile" class="btn secondary">
          个人中心
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import UserCard from '@/components/UserCard.vue'

interface User {
  id: number
  name: string
  avatar: string
  email: string
}

const title = ref('首页')
const subtitle = ref('欢迎使用 Vue3 小程序')
const visitCount = ref(0)
const onlineTime = ref(0)

const currentUser = reactive<User>({
  id: 1,
  name: '张三',
  avatar: '/images/avatar.png',
  email: 'zhangsan@example.com'
})

const handleUserClick = (user: User) => {
  console.log('用户点击:', user.name)
  wx.showToast({
    title: `点击了 ${user.name}`,
    icon: 'none'
  })
}

const incrementVisit = () => {
  visitCount.value++
  wx.showToast({
    title: `访问次数: ${visitCount.value}`,
    icon: 'success'
  })
}

const navigateToProfile = () => {
  wx.switchTab({
    url: '/pages/profile'
  })
}

onMounted(() => {
  console.log('首页加载完成')
  // 模拟在线时长计时
  setInterval(() => {
    onlineTime.value++
  }, 60000) // 每分钟更新一次
})
</script>

<style lang="scss">
.index-page {
  padding: 20rpx;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);

  .header {
    text-align: center;
    padding: 40rpx 0;
    margin-bottom: 40rpx;

    .title {
      display: block;
      font-size: 48rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 10rpx;
    }

    .subtitle {
      font-size: 28rpx;
      color: #666;
    }
  }

  .content {
    .stats {
      display: flex;
      justify-content: space-around;
      margin: 40rpx 0;

      .stat-item {
        text-align: center;

        .stat-label {
          display: block;
          font-size: 24rpx;
          color: #999;
          margin-bottom: 10rpx;
        }

        .stat-value {
          font-size: 36rpx;
          font-weight: bold;
          color: #007bff;
        }
      }
    }

    .actions {
      display: flex;
      gap: 20rpx;
      margin-top: 40rpx;

      .btn {
        flex: 1;
        padding: 25rpx;
        border-radius: 12rpx;
        border: none;
        font-size: 32rpx;
        font-weight: 500;

        &.primary {
          background: #007bff;
          color: white;
        }

        &.secondary {
          background: #6c757d;
          color: white;
        }
      }
    }
  }
}
</style>
