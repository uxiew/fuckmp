<template>
  <view class="user-card shared-card" :class="{ active: active }" @click="handleClick">
    <view class="avatar">
      <text class="avatar-text">{{ user.name.slice(0, 1) }}</text>
    </view>
    <view class="content">
      <text class="name">{{ user.name }}</text>
      <text class="muted-text">{{ user.email }}</text>
    </view>
    <button class="message-button" @click.stop="handleMessage">消息</button>
  </view>
</template>

<script lang="ts" setup>
interface User {
  id: number
  name: string
  email: string
}

interface Props {
  user: User
  active?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  active: false
})

const emit = defineEmits<{
  userClick: [user: User]
  sendMessage: [user: User]
}>()

const handleClick = () => {
  emit('userClick', props.user)
}

const handleMessage = () => {
  emit('sendMessage', props.user)
}
</script>

<style lang="scss" scoped>
@import '../styles/shared.scss';

.user-card {
  align-items: center;
  display: flex;
  gap: 20rpx;
  margin-bottom: 24rpx;

  &.active {
    border: 2rpx solid $primary-color;
  }
}

.avatar {
  align-items: center;
  background: rgba($primary-color, 0.12);
  border-radius: 50%;
  display: flex;
  height: 80rpx;
  justify-content: center;
  width: 80rpx;
}

.avatar-text {
  color: $primary-color;
  font-size: 36rpx;
  font-weight: 700;
}

.content {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.name {
  color: $text-color;
  font-size: 32rpx;
  font-weight: 700;
}

.message-button {
  font-size: 24rpx;
  padding: 8rpx 20rpx;
}
</style>
