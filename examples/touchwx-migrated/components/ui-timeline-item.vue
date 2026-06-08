<script setup lang="ts">
/** TouchWX ui-timeline-item 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-timeline-item">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-timeline-item {
  box-sizing: border-box;
}
.ui-timeline-item:empty::after {
  color: #9aa4b2;
  content: 'timeline-item';
  font-size: 24rpx;
}
</style>
