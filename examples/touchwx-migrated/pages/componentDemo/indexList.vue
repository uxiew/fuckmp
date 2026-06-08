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
const country1 = ref('北京')
const country2 = ref('宝马')
const country3 = ref('阿强')
const currency = ref('澳元(OPM)')

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'country1')) country1.value = patch['country1']
  if (Object.prototype.hasOwnProperty.call(patch, 'country2')) country2.value = patch['country2']
  if (Object.prototype.hasOwnProperty.call(patch, 'country3')) country3.value = patch['country3']
  if (Object.prototype.hasOwnProperty.call(patch, 'currency')) currency.value = patch['currency']
}

const navigateBack = () => {
  wxSafe.navigateBack();
}

const showIndexList1 = () => {
  wxSafe.navigateTo({
    url: `/pages/componentDemo/indexList1?country=${country1.value}`
  });
}

const showIndexList4 = () => {
  wxSafe.navigateTo({
    url: '/pages/componentDemo/indexList4'
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
            <view>表单</view>
          </ui-col>
          <ui-col vertical-align="middle" align="center" width="60">
          </ui-col>
        </ui-row>
      </ui-nav-bar>
      <view style="height:{{NAV_HEIGHT}}"></view>
    <view class="sample_title">
      城市选择
    </view>
    <view class="sample_content" bindtap="showIndexList1">
      <text style="font-size: 14px;">{{country1}}</text>
      <ui-icon type="arrow-down"></ui-icon>
    </view>

    <view class="sample_title">
      自定义数据格式
    </view>
    <view class="sample_content" bindtap="showIndexList4">
        <text style="font-size: 14px;">{{currency}}</text>
        <ui-icon type="arrow-down"></ui-icon>
    </view>
  </view>
</template>

<style lang="scss" scoped>

</style>
