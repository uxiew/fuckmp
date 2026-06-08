<script setup lang="ts">
/** TouchWX ui-blur 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-blur">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-blur {
  box-sizing: border-box;
}
.ui-blur:empty::after {
  color: #9aa4b2;
  content: 'blur';
  font-size: 24rpx;
}
</style>
