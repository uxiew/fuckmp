<script setup lang="ts">
/** _original 迁移时为缺失引用 ui-icon 生成的轻量组件，保证 usingComponents 可解析。 */
</script>

<template>
  <view class="ui-icon">
    <slot></slot>
  </view>
</template>

<style scoped>
.ui-icon {
  box-sizing: border-box;
}
</style>
