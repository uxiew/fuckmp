<script setup lang="ts">
/** TouchWX ui-icon 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-icon">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-icon {
  box-sizing: border-box;
}
.ui-icon:empty::after {
  color: #9aa4b2;
  content: 'icon';
  font-size: 24rpx;
}
</style>
