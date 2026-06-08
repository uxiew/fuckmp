<script setup lang="ts">
/** TouchWX ui-badge 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-badge">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-badge {
  box-sizing: border-box;
}
.ui-badge:empty::after {
  color: #9aa4b2;
  content: 'badge';
  font-size: 24rpx;
}
</style>
