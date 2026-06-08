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
const markers = ref([])
const latitude = ref('')
const longitude = ref('')
const textData = ref({})
const city = ref('')
const height = ref(0)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'markers')) markers.value = patch['markers']
  if (Object.prototype.hasOwnProperty.call(patch, 'latitude')) latitude.value = patch['latitude']
  if (Object.prototype.hasOwnProperty.call(patch, 'longitude')) longitude.value = patch['longitude']
  if (Object.prototype.hasOwnProperty.call(patch, 'textData')) textData.value = patch['textData']
  if (Object.prototype.hasOwnProperty.call(patch, 'city')) city.value = patch['city']
  if (Object.prototype.hasOwnProperty.call(patch, 'height')) height.value = patch['height']
}

const makertap = (e) => {
  var id = e.markerId;
  const that = { setData }
  that.showMarkerInfo(markersData, id);
  that.changeMarkerColor(markersData, id);
}

const navigateBack = () => {
  wxSafe.navigateBack();
}

onLoad(() => {
  const that = { setData }
  var myAmapFun = new amapFile.AMapWX({
    key: key
  });
  var params = {
    iconPathSelected: '/images/posi.png',
    iconPath: '/images/marker.png',
    success: function (data) {
      markersData = data.markers;
      var poisData = data.poisData;
      var markersNew = [];
      markersData.forEach(function (item, index) {
        markersNew.push({
          id: item.id,
          latitude: item.latitude,
          longitude: item.longitude,
          iconPath: item.iconPath,
          width: item.width,
          height: item.height
        });
      });
      if (markersData.length > 0) {
        that.setData({
          markers: markersNew
        });
        that.setData({
          city: poisData[0].cityname || ''
        });
        that.setData({
          latitude: markersData[0].latitude
        });
        that.setData({
          longitude: markersData[0].longitude
        });
        that.showMarkerInfo(markersData, 0);
      }
    },
    fail: function (info) {}
  };
  myAmapFun.getPoiAround(params);
})

const showMarkerInfo = (data, i) => {
  const that = { setData }
  that.setData({
    textData: {
      name: data[i].name,
      desc: data[i].address
    }
  });
}

const changeMarkerColor = (data, i) => {
  const that = { setData }
  var markers = [];
  for (var j = 0; j < data.length; j++) {
    if (j === i) {
      data[j].iconPath = '/images/posi.png';
    } else {
      data[j].iconPath = '/images/marker.png';
    }
    markers.push({
      id: data[j].id,
      latitude: data[j].latitude,
      longitude: data[j].longitude,
      iconPath: data[j].iconPath,
      width: data[j].width,
      height: data[j].height
    });
  }
  that.setData({
    markers: markers
  });
}

onReady(() => {
  onLoad();
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
          <view>周围兴趣点</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
        </ui-col>
      </ui-row>
    </ui-nav-bar>
    <view style="height:{{NAV_HEIGHT}}"></view>
    <view class="map_container" style="height:{{height-100}}px">
      <map 
        class="map" 
        id="map" 
        longitude="{{longitude}}" 
        latitude="{{latitude}}" 
        scale="18" 
        markers="{{markers}}"
        show-location
        bindmarkertap="makertap"
        style="width:100%;height:{{height-100}}px"> 
      </map>
    </view>
    <ui-fixed-view bottom="0" right="0" left="0">
      <view class="map_text" >
        <text>{{textData.name}}</text>
        <text>{{textData.desc}}</text>
        <view></view>
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
