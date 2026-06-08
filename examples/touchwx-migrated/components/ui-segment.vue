<script setup lang="ts">
/** TouchWX ui-segment 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-segment">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-segment {
  box-sizing: border-box;
}
.ui-segment:empty::after {
  color: #9aa4b2;
  content: 'segment';
  font-size: 24rpx;
}
</style>
