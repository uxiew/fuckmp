<script setup lang="ts">
/** TouchWX ui-nav-bar 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-nav-bar">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-nav-bar {
  box-sizing: border-box;
}
.ui-nav-bar:empty::after {
  color: #9aa4b2;
  content: 'nav-bar';
  font-size: 24rpx;
}
</style>
