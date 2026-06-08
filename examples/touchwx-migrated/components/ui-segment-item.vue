<script setup lang="ts">
/** TouchWX ui-segment-item 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-segment-item">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-segment-item {
  box-sizing: border-box;
}
.ui-segment-item:empty::after {
  color: #9aa4b2;
  content: 'segment-item';
  font-size: 24rpx;
}
</style>
