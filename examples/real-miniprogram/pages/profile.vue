<template>
  <view class="profile-page shared-card">
    <text class="title">{{ profileTitle }}</text>
    <text class="muted-text">这是真实示例的第二个页面</text>
  </view>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import '../styles/shared.scss'

const profileTitle = ref('资料页')
</script>

<style lang="scss" scoped>
@import '../styles/shared.scss';

.profile-page {
  margin: 32rpx;
}

.title {
  color: $text-color;
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  margin-bottom: 12rpx;
}
</style>
