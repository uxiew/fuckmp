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
const moveBtnClick = ref(true)
const back = ref(false)
const polyline = ref([{
  points: [{
    latitude: 39.855745,
    longitude: 116.368432
  }, {
    latitude: 39.856264,
    longitude: 116.370331
  }, {
    latitude: 39.856462,
    longitude: 116.371404
  }, {
    latitude: 39.853212,
    longitude: 116.371388
  }],
  color: '#FF0000DD',
  width: 2,
  dottedLine: true
}])
const markers = ref([{
  id: 0,
  latitude: 39.855745,
  longitude: 116.368432,
  iconPath: '/images/car.png',
  width: 30,
  height: 30,
  rotate: 100,
  anchor: {
    x: 0.5,
    y: 0.5
  }
}, {
  id: 1,
  latitude: 39.855745,
  longitude: 116.368432,
  iconPath: '/images/posi.png',
  callout: {
    content: '路径A',
    color: '#000000',
    fontSize: 12,
    bgColor: '#ffffff',
    borderRadius: 11,
    display: 'BYCLICK',
    padding: 5
  },
  width: 30,
  height: 40
}, {
  id: 2,
  latitude: 39.856264,
  longitude: 116.370331,
  iconPath: '/images/posi.png',
  callout: {
    content: '路径B',
    color: '#000000',
    fontSize: 12,
    bgColor: '#ffffff',
    borderRadius: 11,
    display: 'BYCLICK',
    padding: 5
  },
  width: 30,
  height: 40
}, {
  id: 3,
  latitude: 39.856462,
  longitude: 116.371404,
  iconPath: '/images/posi.png',
  callout: {
    content: '路径C',
    color: '#000000',
    fontSize: 12,
    bgColor: '#ffffff',
    borderRadius: 11,
    display: 'BYCLICK',
    padding: 5
  },
  width: 30,
  height: 40
}, {
  id: 4,
  latitude: 39.853212,
  longitude: 116.371388,
  iconPath: '/images/posi.png',
  callout: {
    content: '路径D',
    color: '#000000',
    fontSize: 12,
    bgColor: '#ffffff',
    borderRadius: 11,
    display: 'BYCLICK',
    padding: 5
  },
  width: 30,
  height: 40
}])
const controls = ref([{
  id: 2,
  iconPath: '/images/location.png',
  clickable: true,
  position: {
    left: 15,
    top: 570,
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
const height = ref(0)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'latitude')) latitude.value = patch['latitude']
  if (Object.prototype.hasOwnProperty.call(patch, 'longitude')) longitude.value = patch['longitude']
  if (Object.prototype.hasOwnProperty.call(patch, 'scale')) scale.value = patch['scale']
  if (Object.prototype.hasOwnProperty.call(patch, 'showLocation')) showLocation.value = patch['showLocation']
  if (Object.prototype.hasOwnProperty.call(patch, 'mapCtx')) mapCtx.value = patch['mapCtx']
  if (Object.prototype.hasOwnProperty.call(patch, 'moveBtnClick')) moveBtnClick.value = patch['moveBtnClick']
  if (Object.prototype.hasOwnProperty.call(patch, 'back')) back.value = patch['back']
  if (Object.prototype.hasOwnProperty.call(patch, 'polyline')) polyline.value = patch['polyline']
  if (Object.prototype.hasOwnProperty.call(patch, 'markers')) markers.value = patch['markers']
  if (Object.prototype.hasOwnProperty.call(patch, 'controls')) controls.value = patch['controls']
  if (Object.prototype.hasOwnProperty.call(patch, 'circles')) circles.value = patch['circles']
  if (Object.prototype.hasOwnProperty.call(patch, 'height')) height.value = patch['height']
}

onReady(() => {
  mapCtx.value = wxSafe.createMapContext('map');
})

const navigateBack = () => {
  wxSafe.navigateBack();
}

const move = () => {
  mapCtx.value.includePoints({
    padding: [10],
    points: [{
      latitude: 39.855745,
      longitude: 116.368432
    }, {
      latitude: 39.856264,
      longitude: 116.370331
    }]
  });
  if (!moveBtnClick.value) return;
  moveBtnClick.value = false;
  var mapCtx = wxSafe.createMapContext('map');
  // 声明汽车运动轨迹
  // 声明汽车运动轨迹
  var path = [{
    latitude: 39.855745,
    longitude: 116.368432
  }, {
    latitude: 39.856264,
    longitude: 116.370331
  }, {
    latitude: 39.856462,
    longitude: 116.371404
  }, {
    latitude: 39.853212,
    longitude: 116.371388
  }];
  if (back.value) path.reverse();
  mapCtx.translateMarker({
    markerId: 0,
    destination: path[1],
    autoRotate: true,
    duration: 4000,
    rotate: 10,
    animationEnd: () => {
      mapCtx.value.includePoints({
        padding: [10],
        points: [{
          latitude: 39.856264,
          longitude: 116.370331
        }, {
          latitude: 39.856462,
          longitude: 116.371404
        }]
      });
      mapCtx.translateMarker({
        markerId: 0,
        destination: path[2],
        autoRotate: true,
        rotate: 120,
        duration: 4000,
        animationEnd: () => {
          mapCtx.value.includePoints({
            padding: [100, 10, 100, 10],
            points: [{
              latitude: 39.856462,
              longitude: 116.371404
            }, {
              latitude: 39.853212,
              longitude: 116.371388
            }]
          });
          mapCtx.translateMarker({
            markerId: 0,
            destination: path[3],
            autoRotate: true,
            rotate: 300,
            duration: 4000,
            animationEnd: () => {
              back.value = !back.value;
              moveBtnClick.value = true;
            }
          });
        }
      });
    }
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
          <view>轨迹移动缩放</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
        </ui-col>
      </ui-row>
    </ui-nav-bar>
    <view style="height:{{NAV_HEIGHT}}"></view>
    <view class="map-wrap">
      <map 
        id="map" 
        longitude="{{longitude}}" 
        latitude="{{latitude}}"
        scale="{{scale}}"
        show-location="{{showLocation}}"
        markers="{{markers}}"
        polyline="{{polyline}}"
        style="width:100%;height:{{height-100}}px;">
      </map>
    </view>
      <view class="bottom">
        <button type="primary" bindtap="move">点击开始导航</button>
      </view>
  </view>
</template>

<style lang="scss" scoped>
.bottom{
  width: 100%;
  padding: 20px 10px;
  left: 0;
}
</style>
