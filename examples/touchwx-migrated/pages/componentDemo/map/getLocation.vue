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
const latitude = ref('')
const longitude = ref('')
const location = ref({})
const hasLocation = ref(false)
const textDatas = ref({})

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'latitude')) latitude.value = patch['latitude']
  if (Object.prototype.hasOwnProperty.call(patch, 'longitude')) longitude.value = patch['longitude']
  if (Object.prototype.hasOwnProperty.call(patch, 'location')) location.value = patch['location']
  if (Object.prototype.hasOwnProperty.call(patch, 'hasLocation')) hasLocation.value = patch['hasLocation']
  if (Object.prototype.hasOwnProperty.call(patch, 'textDatas')) textDatas.value = patch['textDatas']
}

const navigateBack = () => {
  wxSafe.navigateBack();
}

const getLocation = () => {
  wxSafe.getLocation({
    type: 'gcj02',
    success: res => {
      setData({
        location: {
          latitude: res.latitude,
          longitude: res.longitude
        },
        longitude: res.longitude,
        latitude: res.latitude,
        hasLocation: true
      });
      getLocalInfo();
    },
    fail: res => {}
  });
}

const getLocalInfo = () => {
  var myAmapFun = new amapFile.AMapWX({
    key: key
  });
  myAmapFun.getRegeo({
    location: `${longitude.value},${latitude.value}`,
    success: data => {
      console.log(data);
      // 调用成功则将相关数据存储至textData
      setData({
        textDatas: {
          name: data[0].regeocodeData.formatted_address,
          address: data[0].name,
          latitude: data[0].latitude,
          longitude: data[0].longitude
        }
      });
    },
    fail: info => {
      console.log(info);
    }
  });
}

const openLocation = () => {
  if (!hasLocation.value) return;
  wxSafe.openLocation({
    longitude: Number(longitude.value),
    latitude: Number(latitude.value),
    name: textDatas.value.name,
    address: textDatas.value.address,
    scale: 16,
    success: function (data) {
      console.log(data);
    },
    fail: function (data) {
      console.log(data);
    }
  });
  // wxSafe.openSysMap({
  //   latitude: Number(longitude.value),
  //   longitude: Number(latitude.value),
  //   name: textDatas.value.name,
  //   success: function(res) {
  //   },
  //   fail: function(res) {
  //   },
  //   complete: function(res) {
  //   }
  // })
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
          <view>获取位置并查看</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
        </ui-col>
      </ui-row>
    </ui-nav-bar>
    <view style="height:{{NAV_HEIGHT}}"></view>
    <view class="sample_content">
        <ui-row height="40" space="10">
          <ui-col span="2" vertical-align="middle">
            纬度： 
          </ui-col>
          <ui-col span="10">
            <input type="text" value="{{latitude}}"></input>
          </ui-col>
        </ui-row>
        <ui-row height="40" space="10">
          <ui-col span="2" vertical-align="middle">
            经度：
          </ui-col>
          <ui-col span="10">
            <input type="text" value="{{longitude}}"></input>
          </ui-col>
        </ui-row>
      <button type="primary" bindtap="getLocation">获取位置</button>
      <button bindtap="openLocation">查看位置</button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.tips {
  padding: 20px 0;
  text-align: center
}
button{
  margin-top:10px;
}
input{
  border:1px solid #ccc;
  border-radius:5px;
  line-height:36px;
  height:36px;
  padding-left:10px;
}
</style>
