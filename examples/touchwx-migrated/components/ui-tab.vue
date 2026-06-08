<script setup lang="ts">
/** TouchWX ui-tab 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-tab">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-tab {
  box-sizing: border-box;
}
.ui-tab:empty::after {
  color: #9aa4b2;
  content: 'tab';
  font-size: 24rpx;
}
</style>
