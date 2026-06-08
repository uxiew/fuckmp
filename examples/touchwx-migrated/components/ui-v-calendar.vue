<script setup lang="ts">
/** TouchWX ui-v-calendar 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-v-calendar">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-v-calendar {
  box-sizing: border-box;
}
.ui-v-calendar:empty::after {
  color: #9aa4b2;
  content: 'v-calendar';
  font-size: 24rpx;
}
</style>
