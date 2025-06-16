<template>
  <view class="test-page">
    <text>这个页面不应该被编译</text>
  </view>
</template>

<script setup lang="ts">
// 这个页面以 _ 开头，不应该被编译
console.log('这个页面不应该被编译')
</script>

<style lang="scss" scoped>
.test-page {
  background: yellow;
  padding: 20rpx;
}
</style>
