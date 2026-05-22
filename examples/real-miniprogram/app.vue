<template>
  <view class="app-shell">
    <text class="app-title">{{ appTitle }}</text>
  </view>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'

const appTitle = ref('真实示例')

onMounted(() => {
  console.log('真实示例 App 启动')
})
</script>

<style lang="scss">
page {
  background: #f6f8fb;
}

.app-shell {
  min-height: 100vh;
  padding: 32rpx;
}

.app-title {
  color: #1f2a44;
  font-size: 36rpx;
  font-weight: 700;
}
</style>
