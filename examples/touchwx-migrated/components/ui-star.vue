<script setup lang="ts">
/** TouchWX ui-star 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-star">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-star {
  box-sizing: border-box;
}
.ui-star:empty::after {
  color: #9aa4b2;
  content: 'star';
  font-size: 24rpx;
}
</style>
