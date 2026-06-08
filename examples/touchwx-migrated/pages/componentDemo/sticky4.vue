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

const items = ref(null)
const index = ref(0)
const scrollTop = ref(0)
const width = ref(0)
const NAV_HEIGHT = ref(0)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'items')) items.value = patch['items']
  if (Object.prototype.hasOwnProperty.call(patch, 'index')) index.value = patch['index']
  if (Object.prototype.hasOwnProperty.call(patch, 'scrollTop')) scrollTop.value = patch['scrollTop']
  if (Object.prototype.hasOwnProperty.call(patch, 'width')) width.value = patch['width']
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
}

const navigateBack = () => {
  wxSafe.navigateBack();
}

const handleChange = (e) => {
  console.log(e);
  let index = e.detail.index;
  setData({
    index: index
  });
}

const onPageScroll = (e) => {
  console.log(e);
  setData({
    scrollTop: e.scrollTop
  });
}

</script>

<template>
<view>
    <!-- 自定义导航 -->
    <ui-nav-bar slot="nav-bar" custom-style="{{ {borderBottom:'1px solid rgba(231, 231, 231, 0.6)',backgroundColor:'#fff'} }}">
      <ui-row height="46">
        <ui-col vertical-align="middle" align="center" width="60" bindtap="navigateBack">
            <ui-icon type="arrow-left" size="16" color="#333"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="center">
          <view>sticky和tabs共用</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
        </ui-col>
      </ui-row>
    </ui-nav-bar>
    <view style="height:{{NAV_HEIGHT}}px"></view>
    <view class="sticky-in-relative-container">
      <ui-sticky scroll-top="{{ scrollTop }}" top="{{NAV_HEIGHT}}" custom-style="{{ {backgroundColor:'#FFF'} }}">
        <view>
          <ui-tabs tab-style="{{ {width:width/2+'px !important'} }}" active-tab-style="{{ {width:width/2+'px !important'} }}" index="{{index}}" bindchange="handleChange">
            <ui-tab>选项一</ui-tab>
            <ui-tab>选项二</ui-tab>
          </ui-tabs>
        </view>
        <view slot="sticky">
          <ui-tabs tab-style="{{ {width:width/2+'px !important'} }}" active-tab-style="{{ {width:width/2+'px !important'} }}" index="{{index}}" bindchange="handleChange">
            <ui-tab>选项一</ui-tab>
            <ui-tab>选项二</ui-tab>
          </ui-tabs>
        </view>
    </ui-sticky>
    </view>
    <view class="content_list">
      <view wx:for="{{ items }}" class="{{index % 2 == 0 ? 'grey-bg':''}}">
        {{ item }}
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>

</style>
