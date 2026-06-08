<script setup lang="ts">
/** TouchWX ui-image 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-image">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-image {
  box-sizing: border-box;
}
.ui-image:empty::after {
  color: #9aa4b2;
  content: 'image';
  font-size: 24rpx;
}
</style>
