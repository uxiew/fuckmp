<script setup lang="ts">
/** TouchWX ui-button 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-button">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-button {
  box-sizing: border-box;
}
.ui-button:empty::after {
  color: #9aa4b2;
  content: 'button';
  font-size: 24rpx;
}
</style>
