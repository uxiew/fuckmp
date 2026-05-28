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
      @longtap="handleLongTap"
      @longpress="handleLongPress"
    >
      <text class="preference-label">触摸验收</text>
      <text class="touch-text">{{ touchPhase }}</text>
    </view>

    <view class="capture-card" @click.capture="handleCaptureTap">
      <text class="preference-label">捕获验收</text>
      <text class="capture-text">{{ capturePhase }}</text>
    </view>

    <view class="capture-stop-card" @click.capture.stop="handleCaptureStopTap">
      <text class="preference-label">捕获阻止验收</text>
      <text class="capture-text">{{ capturePhase }}</text>
    </view>

    <view class="scroll-card">
      <text class="preference-label">滚动验收</text>
      <text class="scroll-status">阶段：{{ scrollStatus }} · scrollTop：{{ scrollTop }}</text>
      <scroll-view
        class="scroll-box"
        scroll-y="true"
        @scrolltoupper="handleScrollToUpper"
        @scrolltolower="handleScrollToLower"
        @scroll="handleProfileScroll"
      >
        <view v-for="item in scrollItems" :key="item" class="scroll-row">
          <text>{{ item }}</text>
        </view>
      </scroll-view>
    </view>

    <view class="swiper-card">
      <text class="preference-label">轮播验收</text>
      <text class="swiper-index">当前页：{{ swiperIndex }}</text>
      <swiper
        class="profile-swiper"
        indicator-dots="true"
        :current="swiperIndex"
        @change="handleSwiperChange"
      >
        <swiper-item>
          <view class="swiper-panel primary-panel">原生 swiper 第一页</view>
        </swiper-item>
        <swiper-item>
          <view class="swiper-panel secondary-panel">原生 swiper 第二页</view>
        </swiper-item>
      </swiper>
    </view>

    <view class="video-card">
      <text class="preference-label">视频验收</text>
      <text class="video-status">状态：{{ videoStatus }} · {{ videoCurrentTime }}s</text>
      <video
        class="profile-video"
        :src="profileVideoSrc"
        controls="true"
        @play="handleVideoPlay"
        @pause="handleVideoPause"
        @ended="handleVideoEnded"
        @timeupdate="handleVideoTimeUpdate"
      />
    </view>

    <view class="movable-card">
      <text class="preference-label">拖拽验收</text>
      <text class="movable-status">位置：{{ movableX }}, {{ movableY }} · 缩放：{{ movableScale }}</text>
      <movable-area class="movable-area">
        <movable-view
          class="movable-handle"
          :x="movableX"
          :y="movableY"
          direction="all"
          scale="true"
          @change="handleMovableChange"
          @scale="handleMovableScale"
        >
          拖拽
        </movable-view>
      </movable-area>
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

interface MiniScrollEvent {
  detail: {
    scrollTop: number
  }
}

interface MiniSwiperChangeEvent {
  detail: {
    current: number
  }
}

interface MiniVideoTimeUpdateEvent {
  detail: {
    currentTime: number
  }
}

interface MiniMovableChangeEvent {
  detail: {
    x: number
    y: number
  }
}

interface MiniMovableScaleEvent {
  detail: {
    scale: number
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
const capturePhase = ref('idle')
const scrollItems = ref(['资料概览', '偏好设置', '通知渠道', '提交资料'])
const scrollStatus = ref('idle')
const scrollTop = ref(0)
const swiperIndex = ref(0)
const profileVideoSrc = ref('https://media.w3.org/2010/05/sintel/trailer.mp4')
const videoStatus = ref('idle')
const videoCurrentTime = ref(0)
const movableX = ref(0)
const movableY = ref(0)
const movableScale = ref(1)
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

/** 验收 longtap 事件会映射为微信原生 bind:longtap。 */
const handleLongTap = () => {
  touchPhase.value = 'longtap'
}

/** 验收 longpress 事件会映射为微信原生 bind:longpress。 */
const handleLongPress = () => {
  touchPhase.value = 'longpress'
}

/** 验收 click.capture 事件会映射为微信原生 capture-bind:tap。 */
const handleCaptureTap = () => {
  capturePhase.value = 'captured'
}

/** 验收 click.capture.stop 事件会映射为微信原生 capture-catch:tap。 */
const handleCaptureStopTap = () => {
  capturePhase.value = 'capture-stop'
}

/** 验收 scrolltoupper 事件会映射为微信原生 bind:scrolltoupper。 */
const handleScrollToUpper = () => {
  scrollStatus.value = 'upper'
}

/** 验收 scrolltolower 事件会映射为微信原生 bind:scrolltolower。 */
const handleScrollToLower = () => {
  scrollStatus.value = 'lower'
}

/** 验收 scroll 事件读取微信原生 event.detail.scrollTop。 */
const handleProfileScroll = (event: MiniScrollEvent) => {
  scrollStatus.value = 'scroll'
  scrollTop.value = event.detail.scrollTop
}

/** 验收 swiper change 事件读取微信原生 event.detail.current。 */
const handleSwiperChange = (event: MiniSwiperChangeEvent) => {
  swiperIndex.value = event.detail.current
}

/** 验收 video play 事件会映射为微信原生 bind:play。 */
const handleVideoPlay = () => {
  videoStatus.value = 'playing'
}

/** 验收 video pause 事件会映射为微信原生 bind:pause。 */
const handleVideoPause = () => {
  videoStatus.value = 'paused'
}

/** 验收 video ended 事件会映射为微信原生 bind:ended。 */
const handleVideoEnded = () => {
  videoStatus.value = 'ended'
}

/** 验收 video timeupdate 事件读取微信原生 event.detail.currentTime。 */
const handleVideoTimeUpdate = (event: MiniVideoTimeUpdateEvent) => {
  videoCurrentTime.value = event.detail.currentTime
}

/** 验收 movable-view change 事件读取微信原生 event.detail.x/y。 */
const handleMovableChange = (event: MiniMovableChangeEvent) => {
  movableX.value = event.detail.x
  movableY.value = event.detail.y
}

/** 验收 movable-view scale 事件读取微信原生 event.detail.scale。 */
const handleMovableScale = (event: MiniMovableScaleEvent) => {
  movableScale.value = event.detail.scale
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

.capture-card {
  background: #f8fbff;
  border: 1rpx solid rgba($primary-color, 0.16);
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 20rpx;
}

.capture-stop-card {
  background: #fff8f2;
  border: 1rpx solid rgba($primary-color, 0.16);
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 20rpx;
}

.capture-text {
  color: $primary-color;
  font-size: 24rpx;
  font-weight: 600;
}

.scroll-card {
  background: #f8fbff;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 20rpx;
}

.scroll-status {
  color: $primary-color;
  font-size: 24rpx;
  font-weight: 600;
}

.scroll-box {
  height: 160rpx;
}

.scroll-row {
  background: #ffffff;
  border-radius: 8rpx;
  color: $text-color;
  margin-bottom: 8rpx;
  padding: 18rpx;
}

.swiper-card {
  background: rgba($primary-color, 0.06);
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 20rpx;
}

.swiper-index {
  color: $primary-color;
  font-size: 24rpx;
  font-weight: 600;
}

.profile-swiper {
  height: 180rpx;
}

.swiper-panel {
  align-items: center;
  border-radius: 12rpx;
  color: #ffffff;
  display: flex;
  font-size: 26rpx;
  font-weight: 600;
  height: 180rpx;
  justify-content: center;
}

.primary-panel {
  background: $primary-color;
}

.secondary-panel {
  background: #5f6b82;
}

.video-card {
  background: #f8fbff;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 20rpx;
}

.video-status {
  color: $primary-color;
  font-size: 24rpx;
  font-weight: 600;
}

.profile-video {
  border-radius: 12rpx;
  height: 220rpx;
  overflow: hidden;
  width: 100%;
}

.movable-card {
  background: rgba($primary-color, 0.06);
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 20rpx;
}

.movable-status {
  color: $primary-color;
  font-size: 24rpx;
  font-weight: 600;
}

.movable-area {
  background: #eef2f8;
  border-radius: 12rpx;
  height: 180rpx;
  width: 100%;
}

.movable-handle {
  align-items: center;
  background: $primary-color;
  border-radius: 50%;
  color: #ffffff;
  display: flex;
  font-size: 24rpx;
  height: 96rpx;
  justify-content: center;
  width: 96rpx;
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
