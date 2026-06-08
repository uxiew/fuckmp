<script setup lang="ts">
/** TouchWX ui-count-up 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-count-up">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-count-up {
  box-sizing: border-box;
}
.ui-count-up:empty::after {
  color: #9aa4b2;
  content: 'count-up';
  font-size: 24rpx;
}
</style>
