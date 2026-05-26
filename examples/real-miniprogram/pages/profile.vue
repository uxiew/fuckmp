<template>
  <view class="profile-page shared-card">
    <text class="title">{{ profileTitle }}</text>

    <view v-if="profileReady" class="profile-summary">
      <text class="summary-text">{{ profileSummary }}</text>
      <text class="profile-meta">{{ profileMeta }}</text>
    </view>

    <textarea
      class="bio-input"
      :value="bioDraft"
      @input="handleBioInput"
      @focus="handleBioFocus"
      @blur="handleBioBlur"
    ></textarea>

    <text class="muted-text">这是真实示例的第二个页面</text>
  </view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import '../styles/shared.scss'

interface MiniTextareaInputEvent {
  detail: {
    value: string
  }
}

const profileTitle = ref('资料页')
const profileName = ref('示例用户')
const profileRole = ref('真实验收')
const profileReady = ref(true)
const profileMeta = ref('页面级 ref / computed / v-if')
const bioDraft = ref('使用 textarea 验收原生 input / focus / blur 事件')
const profileSummary = computed(() => `${profileName.value} · ${profileRole.value}`)

const handleBioInput = (event: MiniTextareaInputEvent) => {
  bioDraft.value = event.detail.value
}

const handleBioFocus = () => {
  console.log('bio focus')
}

const handleBioBlur = () => {
  console.log('bio blur')
}
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

.bio-input {
  background: #f6f8fb;
  border-radius: 12rpx;
  color: $text-color;
  min-height: 160rpx;
  padding: 20rpx;
}
</style>
