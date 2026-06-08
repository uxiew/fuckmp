<script setup lang="ts">
/** TouchWX ui-input 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-input">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-input {
  box-sizing: border-box;
}
.ui-input:empty::after {
  color: #9aa4b2;
  content: 'input';
  font-size: 24rpx;
}
</style>
