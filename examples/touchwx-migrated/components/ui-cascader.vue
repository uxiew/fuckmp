<script setup lang="ts">
/** TouchWX ui-cascader 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-cascader">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-cascader {
  box-sizing: border-box;
}
.ui-cascader:empty::after {
  color: #9aa4b2;
  content: 'cascader';
  font-size: 24rpx;
}
</style>
