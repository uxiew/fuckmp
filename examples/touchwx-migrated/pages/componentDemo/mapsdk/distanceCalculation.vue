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
const mapHeight = ref(0)
const latitude = ref(39.853212)
const longitude = ref(116.371388)
const froms = ref({})
const to = ref({})
const distance = ref(0)
const mapCTX = ref(null)
const markers = ref([{
  iconPath: '/images/mapicon_navi_s.png',
  id: 0,
  latitude: 39.853212,
  longitude: 116.371388,
  width: 23,
  height: 33
}, {
  iconPath: '/images/mapicon_navi_e.png',
  id: 0,
  latitude: 39.855060,
  longitude: 116.368650,
  width: 24,
  height: 34
}])
const height = ref(0)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'mapHeight')) mapHeight.value = patch['mapHeight']
  if (Object.prototype.hasOwnProperty.call(patch, 'latitude')) latitude.value = patch['latitude']
  if (Object.prototype.hasOwnProperty.call(patch, 'longitude')) longitude.value = patch['longitude']
  if (Object.prototype.hasOwnProperty.call(patch, 'froms')) froms.value = patch['froms']
  if (Object.prototype.hasOwnProperty.call(patch, 'to')) to.value = patch['to']
  if (Object.prototype.hasOwnProperty.call(patch, 'distance')) distance.value = patch['distance']
  if (Object.prototype.hasOwnProperty.call(patch, 'mapCTX')) mapCTX.value = patch['mapCTX']
  if (Object.prototype.hasOwnProperty.call(patch, 'markers')) markers.value = patch['markers']
  if (Object.prototype.hasOwnProperty.call(patch, 'height')) height.value = patch['height']
}

onReady(() => {
  // 组件挂载完成后执行初始化
  init();
})

const init = () => {
  // 调用QQMapWX构造函数构建map对象挂载到组件data中
  mapCTX.value = new QQMapWX({
    key: qqkey
  });
  // 调用calculateDistance方法获取数据
  // 详见touch-ui文档腾讯地图SDK距离计算
  // 调用calculateDistance方法获取数据
  // 详见touch-ui文档腾讯地图SDK距离计算
  mapCTX.value.calculateDistance({
    from: {
      latitude: 39.853312,
      longitude: 116.371488
    },
    to: [{
      location: {
        lat: 39.853212,
        lng: 116.371388
      }
    }],
    success: res => {
      // 接口调用成功则执行更新数据事件
      refreshData(res);
    },
    fail: res => {
      // 失败则执行此逻辑
    },
    complete: () => {
      // 成功与否都会执行此逻辑
    }
  });
}

const refreshData = (response) => {
  list = response.result.elements[0];
  setData({
    froms: {
      latitude: list.from.lat,
      longitude: list.from.lng
    },
    to: {
      latitude: list.to.lat,
      longitude: list.to.lng
    },
    distance: list.distance
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
          <view>计算距离</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
        </ui-col>
      </ui-row>
    </ui-nav-bar>
    <view style="height:{{NAV_HEIGHT}}"></view>
    <view style="height:{{ height-100 }}px">
      <map id="navi_map" 
        class="map"
        longitude="{{longitude}}" 
        latitude="{{latitude}}" 
        scale="18" markers="{{markers}}" 
        style="width:100%;height:{{ height-100 }}px">
      </map>
    </view>
    <ui-fixed-view bottom="0" left="0" right="0">
      <view class="map_text">
        <ui-row height="30" >
          <ui-col span="3">起点坐标：</ui-col>
          <ui-col span="9">{{froms.longitude}} - {{froms.latitude}}</ui-col>
        </ui-row>
        <ui-row height="30">
          <ui-col span="3">终点坐标：</ui-col>
          <ui-col span="9">{{to.longitude}} - {{to.latitude}}</ui-col>
        </ui-row>
        <ui-row height="30">
          <ui-col span="3">相隔距离：</ui-col>
          <ui-col span="9">{{distance}}米</ui-col>
        </ui-row>
      </view>
    </ui-fixed-view>
  </view>
</template>

<style lang="scss" scoped>
.map {
  height: 100%
}
.map_text{
  width: 100%;
  height: 100px;
  bottom:0;
  left: 0;
  padding: 10px;
  background: #fff;
  box-shadow: 0 0 25px 0 #cccccc;
  .ui-text{
    line-height: 25px;
  }
}
</style>
