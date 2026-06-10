<script setup lang="ts">
/** TouchWX ui-col 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-col">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-col {
  box-sizing: border-box;
}
.ui-col:empty::after {
  color: #9aa4b2;
  content: 'col';
  font-size: 24rpx;
}
</style>
