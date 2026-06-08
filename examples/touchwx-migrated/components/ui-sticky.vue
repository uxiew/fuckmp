<script setup lang="ts">
/** TouchWX ui-sticky 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-sticky">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-sticky {
  box-sizing: border-box;
}
.ui-sticky:empty::after {
  color: #9aa4b2;
  content: 'sticky';
  font-size: 24rpx;
}
</style>
