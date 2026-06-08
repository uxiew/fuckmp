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
const url = ref('http://images.uileader.com/20180321/ce7dcb1c-5d37-485b-a429-95be5d10edbe.jpg')
const url2 = ref('http://images.uileader.com/20180321/9d5abf36-1994-41cd-9f0d-e5977379b9fb.jpg')

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'url')) url.value = patch['url']
  if (Object.prototype.hasOwnProperty.call(patch, 'url2')) url2.value = patch['url2']
}

const navigateBack = () => {
  wxSafe.navigateBack();
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
          <view>朦胧图</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
        </ui-col>
      </ui-row>
    </ui-nav-bar>
    <!-- 设置内容距离nav-bar高度占位 -->
    <view style="height:{{NAV_HEIGHT}}"></view>
    <view class="sample_title">基本使用</view>
    <ui-divider>原图</ui-divider>
    <view>
      <image
      src="{{ url }}"
      mode='aspectFill'
      style="width: 80px; height: 80px;"
      ></image>
    </view>
    <ui-divider>朦胧效果</ui-divider>
    <ui-blur url="{{ url }}" height="200"></ui-blur>

    <view class="sample_title">更换图片路径</view>
    <ui-divider>原图</ui-divider>
    <view>
      <image
      src="{{ url2 }}"
      mode='aspectFill'
      style="width: 80px; height: 80px;"
      ></image>
    </view>
    <ui-divider>朦胧效果</ui-divider>
    <ui-blur url="{{ url2 }}" height="200"></ui-blur>


    <view class="sample_title">自定义高度</view>
    <ui-blur url="{{ url }}" height="300"></ui-blur>
  </view>
</template>

<style lang="scss" scoped>
.img_content_wrap{
  height: 200px;
  overflow: hidden;
}
</style>
