<script setup lang="ts">
import { onReady, ref } from 'vue'

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
const isAPP = ref('')
const isAndroid = ref('')
const isIOS = ref('')
const winHeight = ref('')
const statusBarHright = ref('')
const defaultHeaderHeight = ref('')
const defaultContentHright = ref('')
const winWidth = ref('')

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'isAPP')) isAPP.value = patch['isAPP']
  if (Object.prototype.hasOwnProperty.call(patch, 'isAndroid')) isAndroid.value = patch['isAndroid']
  if (Object.prototype.hasOwnProperty.call(patch, 'isIOS')) isIOS.value = patch['isIOS']
  if (Object.prototype.hasOwnProperty.call(patch, 'winHeight')) winHeight.value = patch['winHeight']
  if (Object.prototype.hasOwnProperty.call(patch, 'statusBarHright')) statusBarHright.value = patch['statusBarHright']
  if (Object.prototype.hasOwnProperty.call(patch, 'defaultHeaderHeight')) defaultHeaderHeight.value = patch['defaultHeaderHeight']
  if (Object.prototype.hasOwnProperty.call(patch, 'defaultContentHright')) defaultContentHright.value = patch['defaultContentHright']
  if (Object.prototype.hasOwnProperty.call(patch, 'winWidth')) winWidth.value = patch['winWidth']
}

onReady(() => {
  setData({
    isAPP: wxSafe.IS_APP,
    isAndroid: wxSafe.IS_ANDROID,
    isIOS: wxSafe.IS_IOS,
    winHeight: wxSafe.WIN_HEIGHT,
    statusBarHright: wxSafe.STATUS_BAR_HEIGHT,
    defaultHeaderHeight: wxSafe.DEFAULT_HEADER_HEIGHT,
    defaultContentHright: wxSafe.DEFAULT_CONTENT_HEIGHT,
    winWidth: wxSafe.WIN_WIDTH
  });
})

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
          <view>获取常量</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
          
        </ui-col>
      </ui-row>
    </ui-nav-bar>
    <view style="height:{{NAV_HEIGHT}}"></view>
    <view class="content">
      <ui-row-list>
        <ui-row height="40" space-bottom="10">
          <ui-col span="5"  vertical-align="middle" align="right">
            App环境：
          </ui-col>
          <ui-col span="7" vertical-align="middle" space-left="10">
              <view>{{ isAPP }}</view>
          </ui-col>
        </ui-row>
        <ui-row height="40" space-bottom="10">
          <ui-col span="5"  vertical-align="middle" align="right">
            Android环境：
          </ui-col>
          <ui-col span="7" vertical-align="middle" space-left="10">
              <view>{{ isAndroid }}</view>
          </ui-col>
        </ui-row>
        <ui-row height="40" space-bottom="10">
          <ui-col span="5"  vertical-align="middle" align="right">
            IOS环境：
          </ui-col>
          <ui-col span="7" vertical-align="middle" space-left="10">
              <view>{{ isIOS }}</view>
          </ui-col>
        </ui-row>
        <ui-row height="40" space-bottom="10">
          <ui-col span="5"  vertical-align="middle" align="right">
            窗体高度：
          </ui-col>
          <ui-col span="7" vertical-align="middle" space-left="10">
              <view>{{ winHeight }}</view>
          </ui-col>
        </ui-row>
        <ui-row height="40" space-bottom="10">
          <ui-col span="5"  vertical-align="middle" align="right">
            状态栏高度：
          </ui-col>
          <ui-col span="7" vertical-align="middle" space-left="10">
              <view>{{ statusBarHright }}</view>
          </ui-col>
        </ui-row>
        <ui-row height="40" space-bottom="10">
          <ui-col span="5"  vertical-align="middle" align="right">
            当前导航栏高度：
          </ui-col>
          <ui-col span="7" vertical-align="middle" space-left="10">
              <view>{{ defaultHeaderHeight }}</view>
          </ui-col>
        </ui-row>
        <ui-row height="40" space-bottom="10">
          <ui-col span="5"  vertical-align="middle" align="right">
            当前内容高度：
          </ui-col>
          <ui-col span="7" vertical-align="middle" space-left="10">
              <view>{{ defaultContentHright }}</view>
          </ui-col>
        </ui-row>
        <ui-row height="40" space-bottom="10">
          <ui-col span="5"  vertical-align="middle" align="right">
            当前屏幕宽度：
          </ui-col>
          <ui-col span="7" vertical-align="middle" space-left="10">
              <view>{{ winWidth }}</view>
          </ui-col>
        </ui-row>
      </ui-row-list>
    </view>
  </view>
</template>

<style lang="scss" scoped>
// constant.less
.content{
  padding: 10px;
}
</style>
