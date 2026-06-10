<script setup lang="ts">
import { ref } from 'vue'

const wxSafe = typeof wx !== 'undefined'
  ? wx
  : {
      STATUS_BAR_HEIGHT: 20,
      DEFAULT_HEADER_HEIGHT: 46,
      DEFAULT_CONTENT_HEIGHT: 667,
      WIN_WIDTH: 375,
      navigateBack() {},
      navigateTo() {},
      showToast() {},
      setStorageSync() {},
      createMapContext() {
        return { moveToLocation() {} }
      },
      openSysMap() {}
    }

const height = ref(0)
const NAV_HEIGHT = ref(0)
const top2 = ref(0)
const showMask1 = ref(false)
const showMask2 = ref(false)
const showMask3 = ref(false)
const showMask4 = ref(false)
const showMask5 = ref(false)
const showMask6 = ref(false)
const showMask7 = ref(false)
const showMask8 = ref(false)
const showMask9 = ref(false)
const showMask10 = ref(false)
const imgSrc1 = ref('http://images.uileader.com/20180315/da626bbd-4a86-4d5d-9690-00350528d91f.png')
const customStyle1 = ref({
  'background-color': 'rgba(255, 255, 255, 0.8)'
})
const customStyle2 = ref({
  'background-color': 'rgba(255, 255, 255, 0)'
})

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'height')) height.value = patch['height']
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'top2')) top2.value = patch['top2']
  if (Object.prototype.hasOwnProperty.call(patch, 'showMask1')) showMask1.value = patch['showMask1']
  if (Object.prototype.hasOwnProperty.call(patch, 'showMask2')) showMask2.value = patch['showMask2']
  if (Object.prototype.hasOwnProperty.call(patch, 'showMask3')) showMask3.value = patch['showMask3']
  if (Object.prototype.hasOwnProperty.call(patch, 'showMask4')) showMask4.value = patch['showMask4']
  if (Object.prototype.hasOwnProperty.call(patch, 'showMask5')) showMask5.value = patch['showMask5']
  if (Object.prototype.hasOwnProperty.call(patch, 'showMask6')) showMask6.value = patch['showMask6']
  if (Object.prototype.hasOwnProperty.call(patch, 'showMask7')) showMask7.value = patch['showMask7']
  if (Object.prototype.hasOwnProperty.call(patch, 'showMask8')) showMask8.value = patch['showMask8']
  if (Object.prototype.hasOwnProperty.call(patch, 'showMask9')) showMask9.value = patch['showMask9']
  if (Object.prototype.hasOwnProperty.call(patch, 'showMask10')) showMask10.value = patch['showMask10']
  if (Object.prototype.hasOwnProperty.call(patch, 'imgSrc1')) imgSrc1.value = patch['imgSrc1']
  if (Object.prototype.hasOwnProperty.call(patch, 'customStyle1')) customStyle1.value = patch['customStyle1']
  if (Object.prototype.hasOwnProperty.call(patch, 'customStyle2')) customStyle2.value = patch['customStyle2']
}

const masktap = (e) => {
  console.log(e);
}

const handleTap = () => {
  wxSafe.showToast({
    title: 'tap...'
  });
}

const handleShowMask1 = (e) => {
  console.log(e);
  let show = e.currentTarget.dataset.show;
  setData({
    showMask1: show
  });
}

const handleShowMask2 = (e) => {
  let show = e.currentTarget.dataset.show;
  setData({
    showMask2: show
  });
}

const handleShowMask3 = (e) => {
  console.log(e);
  let show = e.currentTarget.dataset.show;
  setData({
    showMask3: show
  });
}

const handleShowMask4 = (e) => {
  let show = e.currentTarget.dataset.show;
  setData({
    showMask4: show
  });
}

const handleShowMask5 = (e) => {
  let show = e.currentTarget.dataset.show;
  setData({
    showMask5: show
  });
}

const handleShowMask6 = (e) => {
  let show = e.currentTarget.dataset.show;
  setData({
    showMask6: show
  });
}

const handleShowMask7 = (e) => {
  let show = e.currentTarget.dataset.show;
  setData({
    showMask7: show
  });
}

const handleShowMask8 = (e) => {
  let show = e.currentTarget.dataset.show;
  setData({
    showMask8: show
  });
}

const handleShowMask9 = (e) => {
  let show = e.currentTarget.dataset.show;
  setData({
    showMask9: show
  });
}

const navigateBack = () => {
  wxSafe.navigateBack();
}

</script>

<template>
<view>
    <view>
      <ui-nav-bar slot="nav-bar" custom-style="{{ {borderBottom:'1px solid rgba(231, 231, 231, 0.6)',backgroundColor:'#fff'} }}">
        <ui-row height="46">
          <ui-col vertical-align="middle" align="center" width="60" bindtap="navigateBack">
              <ui-icon type="arrow-left" size="16" color="#333"></ui-icon>
          </ui-col>
          <ui-col vertical-align="middle" align="center">
            <view>mask基本使用</view>
          </ui-col>
          <ui-col vertical-align="middle" align="center" width="60">
            
          </ui-col>
        </ui-row>
      </ui-nav-bar>
      <view style="height:{{NAV_HEIGHT}}"></view>
      <view class="sample_title">基本使用</view>
      <view class="sample_content">
        <button type="primary" data-show="{{ true }}"  bindtap="handleShowMask1">打开全屏遮罩</button>
        <button type="primary" data-show="{{ true }}"  bindtap="handleShowMask2">遮罩导航栏以下的区域</button>
        <button type="primary" data-show="{{ true }}"  bindtap="handleShowMask3">点击遮罩不关闭</button>
        <button type="primary" data-show="{{ true }}"  bindtap="handleShowMask4">自定义遮罩背景</button>
        <button type="primary" data-show="{{ true }}"  bindtap="handleShowMask5">全透明遮罩</button>
        <button type="primary" data-show="{{ true }}"  bindtap="handleShowMask6">遮罩动画（由小变大）</button>
        <button type="primary" data-show="{{ true }}"  bindtap="handleShowMask9">遮罩动画（由大变小）</button>
        <button type="primary" data-show="{{ true }}"  bindtap="handleShowMask7">白色毛玻璃效果（仅IOS）</button>
        <button type="primary" data-show="{{ true }}"  bindtap="handleShowMask8">黑色毛玻璃效果（仅IOS）</button>
      </view>
    </view>
    <ui-mask show="{{showMask1}}" hide-delay="500" bindtap="masktap">
      <view class="content">
        <button type="success" data-show="{{ false }}" catchtap="handleShowMask1">关闭遮罩</button>
      </view>
    </ui-mask>
    <ui-mask show="{{showMask2}}" top="{{top2}}">
      <view class="content">
        <button type="success" data-show="{{ false }}" bindtap="handleShowMask2">关闭遮罩</button>
      </view>
    </ui-mask>
    <ui-mask show="{{showMask3}}" hide-on-tap="{{false}}" bindtap="masktap">
      <view class="content">
        <button type="success" data-show="{{ false }}" bindtap="handleShowMask3">关闭遮罩</button>
      </view>
    </ui-mask>
    <ui-mask show="{{showMask4}}" custom-style="{{ customStyle1 }}">
      <view class="content">
        <button type="success" data-show="{{ false }}" bindtap="handleShowMask4">关闭遮罩</button>
      </view>
    </ui-mask>


    <ui-mask show="{{showMask5}}" custom-style="{{ customStyle2 }}" hide-on-tap="{{false}}">
      <view class="content">
        <button type="success" data-show="{{ false }}" bindtap="handleShowMask5">关闭遮罩</button>
      </view>
    </ui-mask>

    <ui-mask show="{{showMask6}}" effect="scale-out" animation>
      <view class="content">
        <button type="success" data-show="{{ false }}" bindtap="handleShowMask6">关闭遮罩</button>
      </view>
    </ui-mask>

    <ui-mask show="{{showMask7}}" blur="light">
      <view class="content">
        <button type="success" data-show="{{ false }}" bindtap="handleShowMask7">关闭遮罩</button>
      </view>
    </ui-mask>

    <ui-mask show="{{showMask8}}" blur="dark">
      <view class="content">
        <button type="success" data-show="{{ false }}" bindtap="handleShowMask8">关闭遮罩</button>
      </view>
    </ui-mask>

    <ui-mask show="{{showMask9}}" effect="scale-in" animation>
      <view class="content content2" data-show="{{ false }}" bindtap="handleShowMask9">
        <image src="{{imgSrc1}}" style="width:300px;height:346px;" width="300"></image>
      </view>
    </ui-mask>

   
  </view>
</template>

<style lang="scss" scoped>
// mask.less
button {
  margin: 10px;
  height: 36px;
  line-height: 36px;
  color: #fff;
}
view {
  &.content {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: auto;
    width: 100%;
  }
  &.content2{
    height: 100%;
    display: flex; align-items: center; justify-content: center;
  }
}

.mask8{
  display: flex; align-items: center; justify-content: center;
  .finger-swiper{
    color: #fff;
    text-align: center;
  }
  .know{
    color: #d6545d;
    text-decoration: underline;
  }
}


.tag-6 {
  border: 1px solid #f1f2f3;
  border-radius: 3px;
  text-align: center;
  height: 24px;
  line-height: 24px;
}

.select-class {
  background: #54d09f;
  color: #fff;
}
</style>
