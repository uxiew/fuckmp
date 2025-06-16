<template>
  <view class="app">
    <text class="app-title">Vue3 小程序示例</text>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const appTitle = ref('Vue3 小程序')

onMounted(() => {
  console.log('App 启动完成')
})
</script>

<style lang="scss">
.app {
  padding: 40rpx 20rpx;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  
  .app-title {
    font-size: 48rpx;
    font-weight: bold;
    color: white;
    text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
  }
}

/* 全局样式 */
page {
  background-color: #f5f5f5;
}

.btn {
  padding: 20rpx 40rpx;
  border-radius: 8rpx;
  border: none;
  font-size: 28rpx;
  
  &.primary {
    background: #007bff;
    color: white;
  }
  
  &.secondary {
    background: #6c757d;
    color: white;
  }
}
</style>
