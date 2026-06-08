<script setup lang="ts">
/** TouchWX ui-calendar 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-calendar">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-calendar {
  box-sizing: border-box;
}
.ui-calendar:empty::after {
  color: #9aa4b2;
  content: 'calendar';
  font-size: 24rpx;
}
</style>
