<script setup lang="ts">
/** TouchWX ui-check-list 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-check-list">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-check-list {
  box-sizing: border-box;
}
.ui-check-list:empty::after {
  color: #9aa4b2;
  content: 'check-list';
  font-size: 24rpx;
}
</style>
