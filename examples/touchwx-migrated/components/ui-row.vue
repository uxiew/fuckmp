<script setup lang="ts">
/** TouchWX ui-row 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-row">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-row {
  box-sizing: border-box;
}
.ui-row:empty::after {
  color: #9aa4b2;
  content: 'row';
  font-size: 24rpx;
}
</style>
