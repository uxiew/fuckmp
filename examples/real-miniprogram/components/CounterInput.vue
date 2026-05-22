<template>
  <view class="counter-input shared-card">
    <text class="label">昵称</text>
    <input class="input" v-model.trim="modelValue" />
    <text class="label">访问次数</text>
    <input class="input" type="number" v-model.number="count" />
  </view>
</template>

<script lang="ts" setup>
const [modelValue] = defineModel<string>({ default: '访客' })
const [count] = defineModel<number>('count', { default: 1 })
</script>

<style lang="scss" scoped>
@import '../styles/shared.scss';

.counter-input {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.label {
  color: $text-color;
  font-size: 24rpx;
}

.input {
  background: #f6f8fb;
  border-radius: 12rpx;
  color: $text-color;
  min-height: 72rpx;
  padding: 0 20rpx;
}
</style>
