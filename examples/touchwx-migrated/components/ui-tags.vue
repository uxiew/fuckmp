<script setup lang="ts">
/** TouchWX ui-tags 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-tags">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-tags {
  box-sizing: border-box;
}
.ui-tags:empty::after {
  color: #9aa4b2;
  content: 'tags';
  font-size: 24rpx;
}
</style>
