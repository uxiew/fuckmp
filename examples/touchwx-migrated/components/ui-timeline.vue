<script setup lang="ts">
/** TouchWX ui-timeline 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-timeline">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-timeline {
  box-sizing: border-box;
}
.ui-timeline:empty::after {
  color: #9aa4b2;
  content: 'timeline';
  font-size: 24rpx;
}
</style>
