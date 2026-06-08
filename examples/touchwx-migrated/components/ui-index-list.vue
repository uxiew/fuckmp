<script setup lang="ts">
/** TouchWX ui-index-list 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-index-list">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-index-list {
  box-sizing: border-box;
}
.ui-index-list:empty::after {
  color: #9aa4b2;
  content: 'index-list';
  font-size: 24rpx;
}
</style>
