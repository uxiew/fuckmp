<script setup lang="ts">
/** TouchWX ui-slider 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-slider">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-slider {
  box-sizing: border-box;
}
.ui-slider:empty::after {
  color: #9aa4b2;
  content: 'slider';
  font-size: 24rpx;
}
</style>
