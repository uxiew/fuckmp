<template>
  <view class="slot-panel shared-card">
    <view class="slot-panel-header">
      <slot name="header" />
    </view>
    <view class="slot-panel-body">
      <slot />
    </view>
  </view>
</template>

<script lang="ts" setup>
/**
 * 真实示例中的基础 slot 面板。
 *
 * 只覆盖微信原生可等价的 default / named slot，不实现 scoped 或 dynamic slots。
 */
</script>

<style lang="scss" scoped>
@import '../styles/shared.scss';

.slot-panel {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.slot-panel-header {
  color: $text-color;
  font-size: 30rpx;
  font-weight: 700;
}

.slot-panel-body {
  color: #5f6b82;
  font-size: 26rpx;
  line-height: 1.6;
}
</style>
