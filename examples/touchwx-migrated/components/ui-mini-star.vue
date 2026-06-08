<script setup lang="ts">
/** TouchWX ui-mini-star 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-mini-star">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-mini-star {
  box-sizing: border-box;
}
.ui-mini-star:empty::after {
  color: #9aa4b2;
  content: 'mini-star';
  font-size: 24rpx;
}
</style>
