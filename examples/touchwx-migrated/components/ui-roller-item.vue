<script setup lang="ts">
/** TouchWX ui-roller-item 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-roller-item">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-roller-item {
  box-sizing: border-box;
}
.ui-roller-item:empty::after {
  color: #9aa4b2;
  content: 'roller-item';
  font-size: 24rpx;
}
</style>
