<script setup lang="ts">
/** TouchWX ui-v-tabs 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-v-tabs">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-v-tabs {
  box-sizing: border-box;
}
.ui-v-tabs:empty::after {
  color: #9aa4b2;
  content: 'v-tabs';
  font-size: 24rpx;
}
</style>
