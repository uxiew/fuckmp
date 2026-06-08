<script setup lang="ts">
/** TouchWX ui-summary 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-summary">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-summary {
  box-sizing: border-box;
}
.ui-summary:empty::after {
  color: #9aa4b2;
  content: 'summary';
  font-size: 24rpx;
}
</style>
