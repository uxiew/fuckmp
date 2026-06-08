<script setup lang="ts">
/** TouchWX ui-v-tab 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-v-tab">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-v-tab {
  box-sizing: border-box;
}
.ui-v-tab:empty::after {
  color: #9aa4b2;
  content: 'v-tab';
  font-size: 24rpx;
}
</style>
