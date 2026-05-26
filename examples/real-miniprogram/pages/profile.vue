<template>
  <view class="profile-page shared-card">
    <text class="title">{{ profileTitle }}</text>

    <view v-if="profileReady" class="profile-summary">
      <text class="summary-text">{{ profileSummary }}</text>
      <text class="profile-meta">{{ profileMeta }}</text>
    </view>

    <view class="preference-row">
      <text class="preference-label">接收验收提醒</text>
      <switch :checked="emailOptIn" @change="handleEmailOptInChange" />
    </view>

    <view class="preference-row">
      <text class="preference-label">资料主题</text>
      <picker class="theme-picker" :value="themeIndex" :range="themeOptions" @change="handleThemeChange">
        <view class="picker-value">{{ selectedTheme }}</view>
      </picker>
    </view>

    <view class="slider-row">
      <text class="preference-label">资料完整度</text>
      <text class="completion-text">{{ completionText }}</text>
      <slider
        class="completion-slider"
        min="0"
        max="100"
        step="10"
        :value="completionLevel"
        @change="handleCompletionChange"
      />
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

interface MiniSwitchChangeEvent {
  detail: {
    value: boolean
  }
}

interface MiniPickerChangeEvent {
  detail: {
    value: number
  }
}

interface MiniSliderChangeEvent {
  detail: {
    value: number
  }
}

const profileTitle = ref('资料页')
const profileName = ref('示例用户')
const profileRole = ref('真实验收')
const profileReady = ref(true)
const profileMeta = ref('页面级 ref / computed / v-if')
const bioDraft = ref('使用 textarea 验收原生 input / focus / blur 事件')
const emailOptIn = ref(true)
const themeOptions = ref(['默认主题', '活力主题', '沉稳主题'])
const themeIndex = ref(0)
const completionLevel = ref(60)
const profileSummary = computed(() => `${profileName.value} · ${profileRole.value}`)
const selectedTheme = computed(() => themeOptions.value[themeIndex.value])
const completionText = computed(() => `${completionLevel.value}%`)

const handleBioInput = (event: MiniTextareaInputEvent) => {
  bioDraft.value = event.detail.value
}

const handleBioFocus = () => {
  console.log('bio focus')
}

const handleBioBlur = () => {
  console.log('bio blur')
}

const handleEmailOptInChange = (event: MiniSwitchChangeEvent) => {
  emailOptIn.value = event.detail.value
}

const handleThemeChange = (event: MiniPickerChangeEvent) => {
  themeIndex.value = event.detail.value
}

const handleCompletionChange = (event: MiniSliderChangeEvent) => {
  completionLevel.value = event.detail.value
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

.preference-row {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.preference-label {
  color: $text-color;
  font-size: 26rpx;
}

.theme-picker {
  color: $primary-color;
}

.picker-value {
  color: $primary-color;
  font-size: 26rpx;
  font-weight: 600;
}

.slider-row {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.completion-text {
  color: $primary-color;
  font-size: 24rpx;
  font-weight: 600;
}

.completion-slider {
  width: 100%;
}
</style>
