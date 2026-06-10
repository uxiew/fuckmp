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
const latitude = ref(39.855060)
const longitude = ref(116.368650)
const scale = ref(18)
const showLocation = ref(true)
const mapCtx = ref(null)
const polyline = ref([{
  points: [{
    latitude: 39.853332,
    longitude: 116.371028
  }, {
    latitude: 39.854864,
    longitude: 116.371179
  }, {
    latitude: 39.856289,
    longitude: 116.370293
  }, {
    latitude: 39.855897,
    longitude: 116.368909
  }],
  color: '#ff0000',
  width: 2,
  dottedLine: true
}])
const controls = ref([{
  id: 1,
  iconPath: '/images/location.png',
  clickable: true,
  position: {
    left: 15,
    top: wxSafe.DEFAULT_CONTENT_HEIGHT - 100,
    width: 64,
    height: 64
  }
}])
const circles = ref([{
  latitude: 39.855060,
  longitude: 116.368650,
  color: '#0000FF33',
  fillColor: '#0000FF33',
  radius: 100,
  strokeWidth: 1
}])

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'latitude')) latitude.value = patch['latitude']
  if (Object.prototype.hasOwnProperty.call(patch, 'longitude')) longitude.value = patch['longitude']
  if (Object.prototype.hasOwnProperty.call(patch, 'scale')) scale.value = patch['scale']
  if (Object.prototype.hasOwnProperty.call(patch, 'showLocation')) showLocation.value = patch['showLocation']
  if (Object.prototype.hasOwnProperty.call(patch, 'mapCtx')) mapCtx.value = patch['mapCtx']
  if (Object.prototype.hasOwnProperty.call(patch, 'polyline')) polyline.value = patch['polyline']
  if (Object.prototype.hasOwnProperty.call(patch, 'controls')) controls.value = patch['controls']
  if (Object.prototype.hasOwnProperty.call(patch, 'circles')) circles.value = patch['circles']
}

const navigateBack = () => {
  wxSafe.navigateBack();
}

onReady(() => {
  mapCtx.value = wxSafe.createMapContext('map');
})

const controltap = (e) => {
  if (e.controlId === 1) {
    mapCtx.value.moveToLocation();
  }
}

const regionchange = () => {

}

const callouttap = (e) => {
  if (e.markerId === 2) return;
  if (e.markerId === 1) {
    toSysMap(39.855060, 116.368650, '北京引领视觉科技有限公司');
  }
  if (e.markerId === 3) {
    toSysMap(39.858620, 116.369580, '右安门翠林小区二里');
  }
}

const toSysMap = (lat, lng, names) => {
  wxSafe.openSysMap({
    latitude: lat,
    longitude: lng,
    name: names,
    success: function (res) {},
    fail: function (res) {},
    complete: function (res) {}
  });
}

const go = () => {

}

</script>

<template>
<view class="map-wrap">
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
    <map 
      id="map" 
      map-service="tencent"
      longitude="{{longitude}}" 
      latitude="{{latitude}}"
      scale="{{scale}}"
      polyline="{{polyline}}" 
      show-location="{{showLocation}}"
      controls="{{controls}}"
      circles="{{circles}}"
      bindcontroltap="controltap"
      bindregionchange="regionchange"
      bindcallouttap="callouttap"
      style="width:100%;height:93vh;">
    </map>
  </view>
</template>

<style lang="scss" scoped>
// mapDemo.less
.c-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
}
.info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  margin-right: 25px;
  p {
      padding: 0 5px;
  }
}
.a-name {
  font-size: 14px;
  color: #000;
  line-height: 20px;
}
.a-info {
  font-size: 12px;
  color: #000;
  line-height: 16px;
}
.click {
  position: absolute;
  left: calc(100% - 6px);
  top: 0;
  width: 50px;
  height: 100%;
  background-color: #FF6600;
  line-height: 48px;
  color: #fff;
  text-align: center;
  font-size: 16px;
  border-radius: 0 10px 10px 0; 
}

.s-map {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.s-name {
  margin-right: 10px;
  font-size: 16px;
}
.btn{
  height: 25px;
  padding: 0 5px;
  background-color: #3783fe;
  border-radius: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  img {
      width: 16px;
      height: 16px;
      margin-right: 3px;
  }
  span {
      font-size: 13px;
      color: #fff;
      
  }
}
</style>
