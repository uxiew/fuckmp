<template>
  <view class="user-card" @tap="handleClick">
    <view class="card-header">
      <image :src="user.avatar" class="avatar" />
      <view class="user-info">
        <text class="name">{{ user.name }}</text>
        <text class="email">{{ user.email }}</text>
      </view>
      <view class="status" :class="{ online: isOnline }">
        <text class="status-text">{{ isOnline ? '在线' : '离线' }}</text>
      </view>
    </view>
    
    <view class="card-body" v-if="showDetails">
      <view class="detail-item">
        <text class="label">用户ID:</text>
        <text class="value">{{ user.id }}</text>
      </view>
      <view class="detail-item">
        <text class="label">注册时间:</text>
        <text class="value">{{ formatJoinDate(user.joinDate) }}</text>
      </view>
      <view class="detail-item">
        <text class="label">积分:</text>
        <text class="value">{{ user.points || 0 }}</text>
      </view>
    </view>
    
    <view class="card-footer">
      <button @tap.stop="toggleDetails" class="btn-toggle">
        {{ showDetails ? '收起' : '展开' }}
      </button>
      <button @tap.stop="sendMessage" class="btn-message">
        发消息
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface User {
  id: number
  name: string
  avatar: string
  email: string
  joinDate?: Date
  points?: number
  lastActiveTime?: Date
}

interface Props {
  user: User
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  clickable: true
})

const emit = defineEmits<{
  userClick: [user: User]
  sendMessage: [user: User]
}>()

const showDetails = ref(false)

// 计算用户是否在线（简单逻辑：最后活跃时间在5分钟内）
const isOnline = computed(() => {
  if (!props.user.lastActiveTime) return false
  const now = new Date()
  const lastActive = new Date(props.user.lastActiveTime)
  return (now.getTime() - lastActive.getTime()) < 5 * 60 * 1000
})

const handleClick = () => {
  if (props.clickable) {
    emit('userClick', props.user)
  }
}

const toggleDetails = () => {
  showDetails.value = !showDetails.value
}

const sendMessage = () => {
  emit('sendMessage', props.user)
  wx.showToast({
    title: `向 ${props.user.name} 发送消息`,
    icon: 'none'
  })
}

const formatJoinDate = (date?: Date): string => {
  if (!date) return '未知'
  return new Date(date).toLocaleDateString('zh-CN')
}
</script>

<style lang="scss">
.user-card {
  background: white;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.98);
  }
  
  .card-header {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
    
    .avatar {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      margin-right: 20rpx;
      border: 2rpx solid #f0f0f0;
    }
    
    .user-info {
      flex: 1;
      
      .name {
        display: block;
        font-size: 32rpx;
        font-weight: 500;
        color: #333;
        margin-bottom: 8rpx;
      }
      
      .email {
        font-size: 24rpx;
        color: #666;
      }
    }
    
    .status {
      padding: 8rpx 16rpx;
      border-radius: 20rpx;
      background: #f5f5f5;
      
      &.online {
        background: #d4edda;
        
        .status-text {
          color: #155724;
        }
      }
      
      .status-text {
        font-size: 22rpx;
        color: #6c757d;
      }
    }
  }
  
  .card-body {
    padding: 20rpx 0;
    border-top: 1rpx solid #eee;
    border-bottom: 1rpx solid #eee;
    
    .detail-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15rpx;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .label {
        font-size: 26rpx;
        color: #666;
      }
      
      .value {
        font-size: 26rpx;
        color: #333;
        font-weight: 500;
      }
    }
  }
  
  .card-footer {
    display: flex;
    gap: 20rpx;
    margin-top: 20rpx;
    
    button {
      flex: 1;
      padding: 15rpx;
      border-radius: 8rpx;
      border: none;
      font-size: 26rpx;
    }
    
    .btn-toggle {
      background: #f8f9fa;
      color: #6c757d;
    }
    
    .btn-message {
      background: #007bff;
      color: white;
    }
  }
}
</style>
