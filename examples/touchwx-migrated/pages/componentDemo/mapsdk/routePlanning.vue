<script setup lang="ts">
import { onLoad, onReady, ref } from 'vue'

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
const latitude = ref(39.973700)
const longitude = ref(116.470528)
const showLocation = ref(true)
const mapCtx = ref(null)
const myAmapFun = ref(null)
const markers = ref([{
  id: 0,
  latitude: 39.989643,
  longitude: 116.481028,
  iconPath: '/images/mapicon_navi_s.png',
  width: 24,
  height: 34
}, {
  id: 1,
  latitude: 39.90816,
  longitude: 116.434446,
  iconPath: '/images/mapicon_navi_e.png',
  width: 24,
  height: 34
}])
const includePoints = ref([])
const polyline = ref([])
const distance = ref(0)
const cost = ref(0.00)
const height = ref(0)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'mapHeight')) mapHeight.value = patch['mapHeight']
  if (Object.prototype.hasOwnProperty.call(patch, 'latitude')) latitude.value = patch['latitude']
  if (Object.prototype.hasOwnProperty.call(patch, 'longitude')) longitude.value = patch['longitude']
  if (Object.prototype.hasOwnProperty.call(patch, 'showLocation')) showLocation.value = patch['showLocation']
  if (Object.prototype.hasOwnProperty.call(patch, 'mapCtx')) mapCtx.value = patch['mapCtx']
  if (Object.prototype.hasOwnProperty.call(patch, 'myAmapFun')) myAmapFun.value = patch['myAmapFun']
  if (Object.prototype.hasOwnProperty.call(patch, 'markers')) markers.value = patch['markers']
  if (Object.prototype.hasOwnProperty.call(patch, 'includePoints')) includePoints.value = patch['includePoints']
  if (Object.prototype.hasOwnProperty.call(patch, 'polyline')) polyline.value = patch['polyline']
  if (Object.prototype.hasOwnProperty.call(patch, 'distance')) distance.value = patch['distance']
  if (Object.prototype.hasOwnProperty.call(patch, 'cost')) cost.value = patch['cost']
  if (Object.prototype.hasOwnProperty.call(patch, 'height')) height.value = patch['height']
}

onLoad(() => {
  initView();
})

onReady(() => {
  mapCtx.value = wxSafe.createMapContext('map');
  myAmapFun.value = new amapFile.AMapWX({
    key: key
  });
  initView();
})

const navigateBack = () => {
  wxSafe.navigateBack();
}

const walkNav = () => {
  initView();
  myAmapFun.value.getWalkingRoute({
    origin: '116.481028,39.989643',
    destination: '116.434446,39.90816',
    success: data => {
      drawLine(data, 'steps');
    },
    fail: info => {}
  });
}

const driveNav = () => {
  initView();
  myAmapFun.value.getDrivingRoute({
    origin: '116.481028,39.989643',
    destination: '116.434446,39.90816',
    success: data => {
      drawLine(data, 'steps');
    },
    fail: info => {}
  });
}

const ridingNav = () => {
  initView();
  myAmapFun.value.getRidingRoute({
    origin: '116.481028,39.989643',
    destination: '116.434446,39.90816',
    success: data => {
      drawLine(data, 'steps');
    },
    fail: info => {}
  });
}

const transitNav = () => {
  initView();
  myAmapFun.value.getTransitRoute({
    origin: '116.481028,39.989643',
    destination: '116.434446,39.90816',
    city: '北京',
    success: data => {
      setData({
        distance: data.distance,
        cost: parseFloat(data.taxi_cost).toFixed(2)
      });
    },
    fail: info => {}
  });
}

const drawLine = (data, styles) => {
  console.log(data, styles);
  var points = [];
  if (data.paths && data.paths[0] && data.paths[0][styles]) {
    setData({
      distance: data.paths[0].distance,
      cost: 0.00
    });
    console.log(distance.value, cost.value);
    var steps = data.paths[0][styles];
    steps.forEach((item, index) => {
      var polen = item.polyline.split(';');
      polen.forEach((item_, index_) => {
        points.push({
          longitude: parseFloat(item_.split(',')[0]),
          latitude: parseFloat(item_.split(',')[1])
        });
      });
    });
  }
  setData({
    polyline: [{
      points: points,
      color: '#0091ff',
      width: 5
    }]
  });
  console.log(polyline.value);
}

const initView = () => {
  setData({
    includePoints: [{
      latitude: 39.989643,
      longitude: 116.481028
    }, {
      latitude: 39.90816,
      longitude: 116.434446
    }]
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
          <view>路线选择与规划</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
        </ui-col>
      </ui-row>
    </ui-nav-bar>
    <view style="height:{{NAV_HEIGHT}}"></view>
    <view style="height:{{ height-100 }}px">
      <map 
        id="map" 
        class="map"
        longitude="{{longitude}}" 
        latitude="{{latitude}}"
        show-location="{{showLocation}}"
        markers="{{markers}}"
        polyline="{{polyline}}"
        include-points="{{includePoints}}"
        style="width:100%;height:{{ height-100 }}px">
      </map>
    </view>

    <ui-fixed-view bottom="0" right="0" left="0">
      <view class="map_text">
        <ui-row height="45" space-bottom="10">
        <ui-col span="3" algin="center" vertical-align="middle" space="10">
          <button type="primary" bindtap="walkNav">步行</button>
        </ui-col>
        <ui-col span="3" algin="center" vertical-align="middle" space="10">
          <button type="primary" bindtap="driveNav">驾车</button>
        </ui-col>
        <ui-col span="3" algin="center" vertical-align="middle" space="10">
          <button type="primary" bindtap="ridingNav">骑行</button>
        </ui-col>
        <ui-col span="3" algin="center" vertical-align="middle" space="10">
          <button type="primary" bindtap="transitNav">公交</button>
        </ui-col>
      </ui-row>
      <ui-row>
        <ui-col span="6" space="10">距离:{{distance}}米</ui-col>
        <ui-col span="6" space="10">车费:{{cost}}元</ui-col>
      </ui-row>
      </view>
    </ui-fixed-view>
  </view>
</template>

<style lang="scss" scoped>
// routePlanning.less
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
  text{
    line-height: 25px;
  }
}
</style>
