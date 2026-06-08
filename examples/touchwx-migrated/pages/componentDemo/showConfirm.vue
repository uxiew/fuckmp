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

const showConfirm1 = () => {
  wxSafe.showConfirm({
    content: '您尚未绑定银行卡，绑定银行卡后即可向商家付款',
    cancelColor: 'red',
    confirmColor: '#3399ff',
    confirmText: '去绑卡',
    cancelText: '返回'
  });
}

const showConfirm2 = () => {
  wxSafe.showConfirm({
    title: '提示',
    content: '您尚未绑定银行卡，绑定银行卡后即可向商家付款',
    cancelColor: '#e60012',
    confirmColor: '#3399ff',
    confirmText: '去绑卡',
    cancelText: '返回'
  });
}

const showConfirm3 = () => {
  wxSafe.showConfirm({
    title: '提示',
    content: '您尚未绑定银行卡\r\n绑定银行卡后即可向商家付款',
    cancelColor: 'red',
    confirmColor: '#3399ff',
    confirmText: '去绑卡',
    cancelText: '返回',
    success: res => {
      if (res) {
        wxSafe.showToast({
          title: '触发去绑卡按钮'
        });
      }
    }
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
          <view>showConfirm</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
        </ui-col>
      </ui-row>
    </ui-nav-bar>
    <view style="height:{{NAV_HEIGHT}}"></view>
    <view class="sample_title">显示消息确认框</view>
    <view class="sample_content">
        <button bindtap="showConfirm1">打开Confirm</button>
        <button bindtap="showConfirm2">带title的Confirm</button>
        <button bindtap="showConfirm3">换行显示【需要手机上预览】</button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
// showConfirm.less
button{
  margin:10px;
}
</style>
