<script setup lang="ts">
/** TouchWX ui-fixed-view 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-fixed-view">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-fixed-view {
  box-sizing: border-box;
}
.ui-fixed-view:empty::after {
  color: #9aa4b2;
  content: 'fixed-view';
  font-size: 24rpx;
}
</style>
