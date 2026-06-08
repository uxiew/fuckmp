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
const numberStyle = ref({
  backgroundColor: '#4c4c4c',
  color: '#fff',
  paddingLeft: '4px',
  paddingRight: '4px',
  marginLeft: '8px',
  marginRight: '8px',
  borderRadius: '4px',
  fontSize: '12px',
  minWidth: '30px',
  display: 'inline-block',
  textAlign: 'center',
  lineHeight: '20px'
})

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'numberStyle')) numberStyle.value = patch['numberStyle']
}

const navigateBack = () => {
  wxSafe.navigateBack();
}

const bindtimeup = () => {
  wxSafe.showToast({
    title: '倒计时结束',
    icon: 'none'
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
            <view>倒计时</view>
          </ui-col>
          <ui-col vertical-align="middle" align="center" width="60">
          </ui-col>
        </ui-row>
      </ui-nav-bar>
      <view style="height:{{NAV_HEIGHT}}"></view>
      <view class="sample_title">基本使用</view>
      <view class="sample_content">
          <ui-count-down time="2019/11/10 06:06:06"></ui-count-down>
      </view>
  
      <view class="sample_title">传入时间为秒</view>
      <view class="sample_content">
        <ui-count-down time="20" timetype="second" done-text="结束啦～～" format="{%s}秒" bindtimeup="bindtimeup"></ui-count-down>
      </view>

      <view class="sample_title">自定义参数模版</view>
      <view class="sample_content">
          <ui-count-down time="2019/11/10 06:06:06" format="{%d}天-{%h}时-{%m}分-{%s}秒"></ui-count-down>
      </view>

      <view class="sample_title">自定义样式</view>
      <view class="sample_content">
        <view class="custom">
          <view class="title">大牌臻选</view>
          <ui-count-down 
          timetype="second"
          time="10000"
          format="{%h}时{%m}分{%s}秒"
          number-style="{{numberStyle}}"></ui-count-down>
        </view>
        
      </view>
     
    </view>
</template>

<style lang="scss" scoped>
.custom{
  width:210px;
  border:1px solid #f5f5f5;
  padding: 10px;
  position:relative;
  .title{
    font-size: 18px;
    text-align: center;
    line-height: 30px;
    color: #1D1D1D;
    font-weight: 800;
  }
}
</style>
