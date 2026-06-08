<script setup lang="ts">
/** TouchWX ui-stepper 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-stepper">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-stepper {
  box-sizing: border-box;
}
.ui-stepper:empty::after {
  color: #9aa4b2;
  content: 'stepper';
  font-size: 24rpx;
}
</style>
