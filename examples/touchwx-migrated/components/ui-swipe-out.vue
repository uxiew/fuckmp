<script setup lang="ts">
/** TouchWX ui-swipe-out 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-swipe-out">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-swipe-out {
  box-sizing: border-box;
}
.ui-swipe-out:empty::after {
  color: #9aa4b2;
  content: 'swipe-out';
  font-size: 24rpx;
}
</style>
