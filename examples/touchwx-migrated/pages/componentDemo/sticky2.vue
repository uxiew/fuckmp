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
const items = ref(null)
const imgHeight = ref(0)
const scrollTop = ref(0)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'items')) items.value = patch['items']
  if (Object.prototype.hasOwnProperty.call(patch, 'imgHeight')) imgHeight.value = patch['imgHeight']
  if (Object.prototype.hasOwnProperty.call(patch, 'scrollTop')) scrollTop.value = patch['scrollTop']
}

const onPageScroll = (e) => {
  setData({
    scrollTop: e.scrollTop
  });
}

const navigateBack = () => {
  wxSafe.navigateBack();
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
          <view>多个吸顶容器</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
        </ui-col>
      </ui-row>
    </ui-nav-bar>
      <view style="height:{{NAV_HEIGHT}}px"></view>
    <image
    src="http://images.uileader.com/20171117/a1fa37d0-fbd7-4316-be27-1136a97b459b.jpg"
    style="height:{{imgHeight}}px"
    ></image>
    <ui-sticky scroll-top="{{ scrollTop }}" top="{{NAV_HEIGHT}}">
      <view class="sample_title">一 前言</view>
      <view slot="sticky">
        <view class="sample_title">一 前言</view>
      </view>
    </ui-sticky>
    <view class="content_list">
      <view wx:for="{{ items }}" class="{{index % 2 == 0 ? 'grey-bg':''}}">
        {{ item }}
      </view>
    </view>
    <ui-sticky scroll-top="{{ scrollTop }}" top="{{NAV_HEIGHT}}">
      <view class="sample_title">二 日常沟通场景中当职场写作</view>
      <view slot="sticky">
        <view class="sample_title">二 日常沟通场景中当职场写作</view>
      </view>
    </ui-sticky>
    <view class="content_list">
      <view wx:for="{{items}}" class="{{index % 2 == 0 ? 'grey-bg':''}}">
        {{ item }}
      </view>
    </view>
    <ui-sticky scroll-top="{{ scrollTop }}" top="{{NAV_HEIGHT}}">
      <view class="sample_title">三 会议活动场景中的职场写作</view>
      <view slot="sticky">
        <view class="sample_title">三 会议活动场景中的职场写作</view>
      </view>
    </ui-sticky>
    <view class="content_list">
      <view wx:for="{{items}}" class="{{index % 2 == 0 ? 'grey-bg':''}}">
        {{ item }}
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.sample_title{
    height: 46px;
    line-height: 46px;
  }
</style>
