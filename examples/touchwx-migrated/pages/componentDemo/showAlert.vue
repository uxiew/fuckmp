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

const showAlert1 = () => {
  wxSafe.showAlert({
    title: '开票须知',
    content: '国家税务总局规定：7月1日起，开具增值税普通发票，需提供单位抬头与税号，否者无法用于单位报销；开具增值税专用发票，需提供单位完整信息。请咨询单位财务部门获取相关信息。'
  });
}

const showAlert2 = () => {
  wxSafe.showAlert({
    content: '我们团队重视用户隐私并严格遵守相关法律法规的要求。我们对《隐私保护指引》进行了更新，请先阅读内容后再继续使用。',
    confirmText: '了解更多',
    success() {
      wxSafe.showToast({
        title: '触发了解更多'
      });
    }
  });
}

const showAlert3 = () => {
  wxSafe.showAlert({
    content: '我们团队重视用户隐私并严格遵守相关法律法规的要求。\r\n我们对《隐私保护指引》进行了更新，请先阅读内容后再继续使用。',
    confirmText: '了解更多'
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
          <view>showAlert</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
        </ui-col>
      </ui-row>
    </ui-nav-bar>
    <view style="height:{{NAV_HEIGHT}}"></view>
    <view class="sample_title">显示警告框</view>
    <view class="sample_content">
        <button bindtap="showAlert1">显示Alert</button>
        <button bindtap="showAlert2">点击Alert框触发按钮事件</button>
        <button bindtap="showAlert3">换行显示【需要手机上预览】</button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
button{
  margin:10px;
}
</style>
