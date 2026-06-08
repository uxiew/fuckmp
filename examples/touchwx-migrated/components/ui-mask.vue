<script setup lang="ts">
/** TouchWX ui-mask 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-mask">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-mask {
  box-sizing: border-box;
}
.ui-mask:empty::after {
  color: #9aa4b2;
  content: 'mask';
  font-size: 24rpx;
}
</style>
