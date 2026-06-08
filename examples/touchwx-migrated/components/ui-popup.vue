<script setup lang="ts">
/** TouchWX ui-popup 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-popup">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-popup {
  box-sizing: border-box;
}
.ui-popup:empty::after {
  color: #9aa4b2;
  content: 'popup';
  font-size: 24rpx;
}
</style>
