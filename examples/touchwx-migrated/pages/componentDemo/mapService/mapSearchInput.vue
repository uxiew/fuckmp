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
const text = ref('定位中…')
const latitude = ref('')
const longitude = ref('')
const location = ref('')
const src = ref('/images/pos.png')

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'text')) text.value = patch['text']
  if (Object.prototype.hasOwnProperty.call(patch, 'latitude')) latitude.value = patch['latitude']
  if (Object.prototype.hasOwnProperty.call(patch, 'longitude')) longitude.value = patch['longitude']
  if (Object.prototype.hasOwnProperty.call(patch, 'location')) location.value = patch['location']
  if (Object.prototype.hasOwnProperty.call(patch, 'src')) src.value = patch['src']
}

const fn = () => {
  wxSafe.getLocation({
    type: 'wgs84',
    success: res => {
      location.value = res.latitude + ',' + res.longitude;
      console.log(location.value, 'location');
    },
    fail: err => {}
  });
}

const reserveAddr = () => {
  console.log(location.value);
  wxSafe.request({
    url: 'https://apis.map.qq.com/ws/geocoder/v1/?',
    data: {
      location: location.value,
      key: 'RHGBZ-S2LAU-5MRV7-4QPTZ-JI25K-HVBDV'
    },
    success: res => {
      console.log(res);
      setData({
        text: res.data.result.address
      });
    }
  });
}

const toast = () => {
  wxSafe.showToast({
    title: '点击“我的位置”按钮测试',
    icon: 'none'
  });
}

const getPosition = () => {
  wxSafe.request({
    url: 'https://apis.map.qq.com/ws/location/v1/ip',
    data: {
      key: 'RHGBZ-S2LAU-5MRV7-4QPTZ-JI25K-HVBDV'
    },
    success: res => {
      console.log(res.data.result.ad_info.city);
      // text.value = res.data.result.ad_info.city
      setData({
        text: res.data.result.ad_info.city
      });
    }
  });
}

const navigateBack = () => {
  wxSafe.navigateBack();
}

onReady(() => {
  getPosition();
  fn();
})

</script>

<template>
<view>
    <ui-nav-bar slot="nav-bar" custom-style="{{ {borderBottom:'1px solid rgba(231, 231, 231, 0.6)',backgroundColor:'#fff'} }}">
      <ui-row height="46">
        <ui-col vertical-align="middle" align="center" width="60" bindtap="navigateBack">
            <ui-icon type="arrow-left" size="16" color="#333"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="center">
          <view>地图绘制</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
        </ui-col>
      </ui-row>
    </ui-nav-bar>
    <view style="height:{{NAV_HEIGHT}}"></view>
    <view class="content">
      <view class="btn-area">
        <ui-row height="50" border-bottom>
          <ui-col width="50" align="center" vertical-align="middle">
            <ui-icon type="building" size="24" color="#FD8137"></ui-icon>
          </ui-col>
          <ui-col vertical-align="middle">{{ text }}</ui-col>
          <ui-col width="70" align="center" vertical-align="middle" bindtap="reserveAddr">
              <image src="{{src}}" style="width:15px;height:15px;"></image>
              <view>我的位置</view>
          </ui-col>
        </ui-row>
        <ui-row height="50">
          <ui-col width="50" align="center" vertical-align="middle">
            <ui-icon type="qn-activity" size="24" color="#FD8137"></ui-icon>
          </ui-col>
          <ui-col vertical-align="middle">09月27日</ui-col>
          <ui-col vertical-align="middle">今天</ui-col>
          <ui-col vertical-align="middle">明天</ui-col>
          <ui-col vertical-align="middle">共一晚</ui-col>
        </ui-row>
      </view>
      <view class="btn-area">
        <ui-row height="50">
          <ui-col width="50" align="center" vertical-align="middle">
            <ui-icon type="magnifier" size="24" color="#FD8137"></ui-icon>
          </ui-col>
          <ui-col vertical-align="middle">
            <input placeholder="景点/商圈/关键词" placeholder-style="color:#BBBBBB"></input>
          </ui-col>
        </ui-row>
      </view>
      <button class="find" bindtap="toast">查找酒店</button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
// mapSearchInput.less
.content{
  padding: 15px;
}
.btn-area {
  // padding: 0px 15px;
  box-shadow: 0 0 10px 1px #EBEBEB;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 50px;
  .ui-image{
    margin-bottom: 5px;
  }
  .ui-input{
    border: 0;
  }
}
.find{
  background-color: #FD8137;
  border: 0;
  color: #fff;
  outline: none;
}
</style>
