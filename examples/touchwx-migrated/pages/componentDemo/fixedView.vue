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

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'items')) items.value = patch['items']
}

const navigateBack = () => {
  wxSafe.navigateBack();
}

</script>

<template>
<view>
    <!-- 自定义导航 -->
    <ui-nav-bar slot="nav-bar" custom-style="{{ {boxShadow: '0 0px 16px 0 #ccc',backgroundColor:'#fff'} }}">
      <ui-row height="46" >
        <ui-col vertical-align="middle" align="center" width="60" bindtap="navigateBack">
            <ui-icon type="arrow-left" size="16" color="#333"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="center">
          <view>位置固定容器</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
        </ui-col>
      </ui-row>
    </ui-nav-bar>

    <!-- 设置内容距离nav-bar高度占位 -->
    <view style="height:{{NAV_HEIGHT}}"></view>
    <ui-fixed-view top="146" left="50">
      <view class="fixed-view-content">左上固定</view>
    </ui-fixed-view>
    <ui-fixed-view top="146" right="50">
      <view class="fixed-view-content">右上固定</view>
    </ui-fixed-view>
    <ui-fixed-view bottom="100" left="50">
      <view class="fixed-view-content">左下固定</view>
    </ui-fixed-view>
    <ui-fixed-view bottom="100" right="50">
      <view class="fixed-view-content">右下固定</view>
    </ui-fixed-view>
    <ui-fixed-view top="{{ fixedTop }}" left="0" right="0">
      <view class="fixed-view-content">顶部固定</view>
    </ui-fixed-view>
    <ui-fixed-view bottom="0" left="0" right="0">
      <view class="fixed-view-content">底部固定</view>
    </ui-fixed-view>
    <view class="content_list">
      <view wx:for="{{ items }}" wx:key="index" class="{{ index % 2 == 0 ? 'grey-bg':  '' }}">
        {{ item }}
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.fixed-view-content {
  padding: 0 6px;
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  background-color: #FFA060;
  z-index: 99;
}
</style>
