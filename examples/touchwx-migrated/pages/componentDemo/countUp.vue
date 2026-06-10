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
  color: '#1DA1D2',
  fontSize: '30px',
  letterSpacing: '18px',
  zIndex: '2',
  position: 'absolute',
  left: '18px',
  top: '10px'
})

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'numberStyle')) numberStyle.value = patch['numberStyle']
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
          <view>数字动画</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
        </ui-col>
      </ui-row>
    </ui-nav-bar>
    <view style="height:{{NAV_HEIGHT}}"></view>
    <view class="sample_title">渐变颜色</view>
    <view class="sample_content">
        <ui-count-up from=1 to=100 from-color="#FA7474" to-color="#3399ff"></ui-count-up>
    </view>

    <view class="sample_title">保留2位小数</view>
    <view class="sample_content">
        <ui-count-up from=1.531 to=100.424 duration="1000" fixed=2></ui-count-up>
    </view>

    <view class="sample_title">持续时间</view>
    <view class="sample_content">
        <ui-count-up from=1 to=100 duration="5000"></ui-count-up>
    </view>

  <view class="sample_title">自定义样式</view>
  <view class="sample_content self_style">
      <view class="bg-box" style="">
        <view class="bg bg1"></view>
        <view class="bg bg2"></view>
        <view class="bg bg3"></view>
        <view class="bg bg4"></view>
        <view class="line line1"></view>
        <view class="line line2"></view>
        <view class="line line3"></view>
        <view class="line line4"></view>
      </view>
      <ui-count-up digit=4 from=0  to=1520 duration=1000 number-style="{{numberStyle}}"></ui-count-up>
  </view>
  </view>
</template>

<style lang="scss" scoped>
.self_style{
      position:relative;
      height: 100px;
      background-color: #03061f;
      .bg-box{
        position:absolute;
        width:200px;
        height:35px;
        left:14px;
        top:8px;
        .bg{
          background-color: rgba(18,26,49,1);
          height:35px;
          z-index:1;
          float:left;
          width:26px;
        }
        .bg1{
          margin-right:9px;
        }
        .bg2{
          margin-right:8px;
        }
        .bg3{
          margin-right:9px;
        }
        .line{
          width: 26px;
          height: 1px;
          background: #3e4969;
          position:absolute;
          top:18px;
        }
        .line1{
          margin-right:9px;
        }
        .line2{
          left:35px;
        }
        .line3{
          left:68px;
        }
        .line4{
          left:104px;
        }
      }
    }
</style>
