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

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
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
        <view>分隔符</view>
      </ui-col>
      <ui-col vertical-align="middle" align="center" width="60">
      </ui-col>
    </ui-row>
  </ui-nav-bar>
  <view style="height:{{NAV_HEIGHT}}"></view>
    <view>
      <ui-divider>我是有底线的</ui-divider>
      <ui-divider padding="20">我是有底线的</ui-divider>
      <ui-divider color="#ff2a00">我是红色的底线</ui-divider>
      <ui-divider color="#3399ff">我是蓝色的底线</ui-divider>
      <ui-divider color="#a1e76a">我是绿色的底线</ui-divider>
      <ui-divider color="#ff2a00">
        <view style="color:#ff2a00">
          内容也是红色的
        </view>
      </ui-divider>
      <ui-divider color="#3399ff">
        <view style="color:#3399ff">
          内容也是蓝色的
        </view>
      </ui-divider>
      <ui-divider color="#a1e76a">
        <view style="color:#a1e76a">
          内容也是绿色的
        </view>
      </ui-divider>
    </view>
  </view>
</template>

<style lang="css" scoped>

</style>
