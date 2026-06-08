<script setup lang="ts">
/** TouchWX ui-tabs 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-tabs">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-tabs {
  box-sizing: border-box;
}
.ui-tabs:empty::after {
  color: #9aa4b2;
  content: 'tabs';
  font-size: 24rpx;
}
</style>
