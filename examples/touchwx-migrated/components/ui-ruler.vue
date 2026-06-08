<script setup lang="ts">
/** TouchWX ui-ruler 轻量迁移占位组件。 */
</script>

<template>
  <view class="ui-ruler">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-ruler {
  box-sizing: border-box;
}
.ui-ruler:empty::after {
  color: #9aa4b2;
  content: 'ruler';
  font-size: 24rpx;
}
</style>
