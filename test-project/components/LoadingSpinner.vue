<template>
  <view class="loading-spinner" v-if="visible">
    <view class="spinner-overlay" @tap="handleOverlayClick">
      <view class="spinner-container">
        <view class="spinner"></view>
        <text class="loading-text" v-if="text">{{ text }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Props {
  visible?: boolean
  text?: string
  maskClosable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  text: '加载中...',
  maskClosable: false
})

const emit = defineEmits<{
  close: []
}>()

const handleOverlayClick = () => {
  if (props.maskClosable) {
    emit('close')
  }
}
</script>

<style lang="scss" scoped>
.loading-spinner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  
  .spinner-overlay {
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    
    .spinner-container {
      background: white;
      border-radius: 16rpx;
      padding: 40rpx;
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .spinner {
        width: 60rpx;
        height: 60rpx;
        border: 4rpx solid #f3f3f3;
        border-top: 4rpx solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      .loading-text {
        margin-top: 20rpx;
        font-size: 28rpx;
        color: #666;
      }
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
