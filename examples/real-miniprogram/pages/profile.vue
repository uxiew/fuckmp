<template>
  <view class="profile-page shared-card">
    <text class="title">{{ profileTitle }}</text>

    <view v-if="profileReady" class="profile-summary">
      <text class="summary-text">{{ profileSummary }}</text>
      <text class="profile-meta">{{ profileMeta }}</text>
    </view>

    <text class="muted-text">这是真实示例的第二个页面</text>
  </view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import '../styles/shared.scss'

const profileTitle = ref('资料页')
const profileName = ref('示例用户')
const profileRole = ref('真实验收')
const profileReady = ref(true)
const profileMeta = ref('页面级 ref / computed / v-if')
const profileSummary = computed(() => `${profileName.value} · ${profileRole.value}`)
</script>

<style lang="scss" scoped>
@import '../styles/shared.scss';

.profile-page {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin: 32rpx;
}

.title {
  color: $text-color;
  display: block;
  font-size: 36rpx;
  font-weight: 700;
}

.profile-summary {
  background: rgba($primary-color, 0.08);
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 20rpx;
}

.summary-text {
  color: $primary-color;
  font-size: 30rpx;
  font-weight: 700;
}

.profile-meta {
  color: #5f6b82;
  font-size: 24rpx;
}
</style>
