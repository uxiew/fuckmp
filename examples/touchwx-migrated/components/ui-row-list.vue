<script setup lang="ts">
/** TouchWX ui-row-list 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-row-list">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-row-list {
  box-sizing: border-box;
}
.ui-row-list:empty::after {
  color: #9aa4b2;
  content: 'row-list';
  font-size: 24rpx;
}
</style>
