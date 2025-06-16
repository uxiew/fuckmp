<template>
  <view class="test-component">
    <text>这个组件不应该被编译</text>
  </view>
</template>

<script setup lang="ts">
// 这个文件以 _ 开头，不应该被编译
console.log('这个文件不应该被编译')
</script>

<style lang="scss" scoped>
.test-component {
  color: red;
  font-size: 32rpx;
}
</style>
