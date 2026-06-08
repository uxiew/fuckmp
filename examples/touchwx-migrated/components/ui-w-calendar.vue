<script setup lang="ts">
/** TouchWX ui-w-calendar 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-w-calendar">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-w-calendar {
  box-sizing: border-box;
}
.ui-w-calendar:empty::after {
  color: #9aa4b2;
  content: 'w-calendar';
  font-size: 24rpx;
}
</style>
