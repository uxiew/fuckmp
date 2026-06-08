<script setup lang="ts">
/** TouchWX ui-count-down 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-count-down">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-count-down {
  box-sizing: border-box;
}
.ui-count-down:empty::after {
  color: #9aa4b2;
  content: 'count-down';
  font-size: 24rpx;
}
</style>
