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

const NAV_HEIGHT = ref(0)
const showMask1 = ref(true)
const customSyle = ref({
  'background': 'rgba(0, 0, 0, 0.8)',
  'display': 'flex',
  'align-items': 'center',
  'justify-content': 'center'
})

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'showMask1')) showMask1.value = patch['showMask1']
  if (Object.prototype.hasOwnProperty.call(patch, 'customSyle')) customSyle.value = patch['customSyle']
}

const navigateBack = () => {
  wxSafe.navigateBack();
}

const handleShowMask1 = (e) => {
  console.log(e);
  let show = e.currentTarget.dataset.show;
  setData({
    showMask1: show
  });
}

</script>

<template>
<view>
    <ui-nav-bar slot="nav-bar" custom-style="{{ {borderBottom:'1px solid rgba(231, 231, 231, 0.6)',backgroundColor:'#fff'} }}">
      <ui-row height="46">
        <ui-col vertical-align="middle" align="center" width="60" bindtap="navigateBack">
            <ui-icon type="arrow-left" size="16" color="#333"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="center">
          <view>操作引导</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
          
        </ui-col>
      </ui-row>
    </ui-nav-bar>
      <view style="height:{{NAV_HEIGHT}}"></view>
    <view class="sample_content">
      <button type="primary" data-show="{{true}}" bindtap="handleShowMask1">功能引导</button>
    </view>

    <ui-mask show="{{showMask1}}" custom-style="{{customSyle}}" >
      <view class="finger-swiper" data-show="{{false}}"  bindtap="handleShowMask1">
        <ui-row>
          <ui-col space-right="10">
            <ui-icon type="one-finger-swipe-lef" size="36" color="#fff" align="right"></ui-icon>
          </ui-col>
          <ui-col space-left="10">
            <ui-icon type="one-finger-swipe-rig" size="36" color="#fff" align="left"></ui-icon>
          </ui-col>
        </ui-row>
        <view>左右滑屏，查看上/下一个案例</view>
        <view class="know">我知道了</view>
      </view>
    </ui-mask>
  </view>
</template>

<style lang="scss" scoped>
// maskGuide.less
.mask1{
  display: flex; align-items: center; justify-content: center;
  
}
.finger-swiper{
    color: #fff;
    text-align: center;
  }
  .know{
    color: #d6545d;
    text-decoration: underline;
  }
</style>
