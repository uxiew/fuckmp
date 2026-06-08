<script setup lang="ts">
/** TouchWX ui-accordion 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-accordion">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-accordion {
  box-sizing: border-box;
}
.ui-accordion:empty::after {
  color: #9aa4b2;
  content: 'accordion';
  font-size: 24rpx;
}
</style>
