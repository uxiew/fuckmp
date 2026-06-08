<script setup lang="ts">
/** TouchWX ui-divider 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-divider">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-divider {
  box-sizing: border-box;
}
.ui-divider:empty::after {
  color: #9aa4b2;
  content: 'divider';
  font-size: 24rpx;
}
</style>
