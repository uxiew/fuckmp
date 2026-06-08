<script setup lang="ts">
/** TouchWX ui-roller 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-roller">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-roller {
  box-sizing: border-box;
}
.ui-roller:empty::after {
  color: #9aa4b2;
  content: 'roller';
  font-size: 24rpx;
}
</style>
