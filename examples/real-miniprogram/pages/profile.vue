<template>
  <view class="profile-page shared-card">
    <text class="title">{{ profileTitle }}</text>

    <view v-if="profileReady" class="profile-summary">
      <text class="summary-text">{{ profileSummary }}</text>
      <text class="profile-meta">{{ profileMeta }}</text>
    </view>

    <view class="name-row">
      <text class="preference-label">昵称</text>
      <input
        class="name-input"
        :value="profileName"
        @input="handleNameInput"
        @focus="handleNameFocus"
        @blur="handleNameBlur"
      />
    </view>

    <view
      class="touch-card"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @touchcancel="handleTouchCancel"
      @longpress="handleLongPress"
    >
      <text class="preference-label">触摸验收</text>
      <text class="touch-text">{{ touchPhase }}</text>
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

    <view class="radio-row">
      <text class="preference-label">联系偏好</text>
      <text class="contact-method-text">{{ contactMethodText }}</text>
      <radio-group class="contact-method-group" @change="handleContactMethodChange">
        <label class="radio-option">
          <radio value="email" :checked="contactMethod === 'email'" />
          <text>邮箱</text>
        </label>
        <label class="radio-option">
          <radio value="phone" :checked="contactMethod === 'phone'" />
          <text>电话</text>
        </label>
      </radio-group>
    </view>

    <view class="checkbox-row">
      <text class="preference-label">通知渠道</text>
      <text class="channel-text">{{ selectedChannelsText }}</text>
      <checkbox-group class="channel-group" @change="handleChannelChange">
        <label class="checkbox-option">
          <checkbox value="email" :checked="selectedChannels.includes('email')" />
          <text>邮箱</text>
        </label>
        <label class="checkbox-option">
          <checkbox value="sms" :checked="selectedChannels.includes('sms')" />
          <text>短信</text>
        </label>
      </checkbox-group>
    </view>

    <form class="profile-form" @submit="handleProfileSubmit" @reset="handleProfileReset">
      <textarea
        class="bio-input"
        name="bio"
        :value="bioDraft"
        @input="handleBioInput"
        @focus="handleBioFocus"
        @blur="handleBioBlur"
      ></textarea>

      <view class="form-actions">
        <button class="form-button" form-type="submit">提交资料</button>
        <button class="form-button secondary" form-type="reset">重置资料</button>
      </view>
    </form>

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

/** 微信原生 input 事件，只取当前示例需要的输入值。 */
interface MiniInputEvent {
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

interface MiniRadioChangeEvent {
  detail: {
    value: string
  }
}

interface MiniCheckboxChangeEvent {
  detail: {
    value: string[]
  }
}

interface MiniFormSubmitEvent {
  detail: {
    value: {
      bio: string
    }
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
const contactMethod = ref('email')
const selectedChannels = ref(['email'])
const formSnapshot = ref({ bio: '' })
const touchPhase = ref('idle')
const profileSummary = computed(() => `${profileName.value} · ${profileRole.value}`)
const selectedTheme = computed(() => themeOptions.value[themeIndex.value])
const completionText = computed(() => `${completionLevel.value}%`)
const contactMethodText = computed(() => (contactMethod.value === 'email' ? '邮箱' : '电话'))
const selectedChannelsText = computed(() => selectedChannels.value.join(' / '))

/** 将昵称 input 的原生输入值同步到页面响应式状态。 */
const handleNameInput = (event: MiniInputEvent) => {
  profileName.value = event.detail.value
}

/** 验收 input focus 事件会映射为微信原生 bind:focus。 */
const handleNameFocus = () => {
  console.log('name focus')
}

/** 验收 input blur 事件会映射为微信原生 bind:blur。 */
const handleNameBlur = () => {
  console.log('name blur')
}

/** 验收 touchstart 事件会映射为微信原生 bind:touchstart。 */
const handleTouchStart = () => {
  touchPhase.value = 'start'
}

/** 验收 touchmove 事件会映射为微信原生 bind:touchmove。 */
const handleTouchMove = () => {
  touchPhase.value = 'move'
}

/** 验收 touchend 事件会映射为微信原生 bind:touchend。 */
const handleTouchEnd = () => {
  touchPhase.value = 'end'
}

/** 验收 touchcancel 事件会映射为微信原生 bind:touchcancel。 */
const handleTouchCancel = () => {
  touchPhase.value = 'cancel'
}

/** 验收 longpress 事件会映射为微信原生 bind:longpress。 */
const handleLongPress = () => {
  touchPhase.value = 'longpress'
}

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

const handleContactMethodChange = (event: MiniRadioChangeEvent) => {
  contactMethod.value = event.detail.value
}

const handleChannelChange = (event: MiniCheckboxChangeEvent) => {
  selectedChannels.value = event.detail.value
}

const handleProfileSubmit = (event: MiniFormSubmitEvent) => {
  formSnapshot.value = event.detail.value
}

const handleProfileReset = () => {
  bioDraft.value = ''
  formSnapshot.value = { bio: '' }
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

.name-row {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.name-input {
  background: #f6f8fb;
  border-radius: 12rpx;
  color: $text-color;
  padding: 18rpx 20rpx;
}

.touch-card {
  background: rgba($primary-color, 0.06);
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 20rpx;
}

.touch-text {
  color: $primary-color;
  font-size: 24rpx;
  font-weight: 600;
}

.bio-input {
  background: #f6f8fb;
  border-radius: 12rpx;
  color: $text-color;
  min-height: 160rpx;
  padding: 20rpx;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.form-actions {
  display: flex;
  gap: 12rpx;
}

.form-button {
  background: $primary-color;
  color: #ffffff;
  flex: 1;
  font-size: 24rpx;
}

.form-button.secondary {
  background: #eef2f8;
  color: $text-color;
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

.radio-row {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.contact-method-text {
  color: $primary-color;
  font-size: 24rpx;
  font-weight: 600;
}

.contact-method-group {
  display: flex;
  gap: 24rpx;
}

.radio-option {
  align-items: center;
  display: flex;
  gap: 8rpx;
}

.checkbox-row {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.channel-text {
  color: $primary-color;
  font-size: 24rpx;
  font-weight: 600;
}

.channel-group {
  display: flex;
  gap: 24rpx;
}

.checkbox-option {
  align-items: center;
  display: flex;
  gap: 8rpx;
}
</style>
