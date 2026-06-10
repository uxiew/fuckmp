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
const src = ref('/images/shop-1.png')
const markers = ref([{
  id: 1,
  latitude: 39.855745,
  longitude: 116.368432,
  iconPath: iconActive,
  width: 23,
  height: 30
}, {
  id: 2,
  latitude: 39.867277,
  longitude: 116.368475,
  iconPath: icon,
  width: 23,
  height: 30
}, {
  id: 3,
  latitude: 39.857755,
  longitude: 116.364870,
  iconPath: icon,
  width: 23,
  height: 30
}, {
  id: 4,
  latitude: 39.851907,
  longitude: 116.376114,
  iconPath: icon,
  width: 23,
  height: 30
}, {
  id: 5,
  latitude: 39.863898,
  longitude: 116.375256,
  iconPath: icon,
  width: 23,
  height: 30
}])
const latitude = ref(39.855745)
const longitude = ref(116.368432)
const textData = ref({})
const controls = ref([{
  id: 0,
  // 设置当前控件id,且唯一
  iconPath: '/images/location.png',
  clickable: true,
  position: {
    left: 15,
    top: 450,
    width: 64,
    height: 64
  }
}])
const city = ref('')
const starData = ref([])
const mapHeight = ref(0)
const height = ref(0)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'src')) src.value = patch['src']
  if (Object.prototype.hasOwnProperty.call(patch, 'markers')) markers.value = patch['markers']
  if (Object.prototype.hasOwnProperty.call(patch, 'latitude')) latitude.value = patch['latitude']
  if (Object.prototype.hasOwnProperty.call(patch, 'longitude')) longitude.value = patch['longitude']
  if (Object.prototype.hasOwnProperty.call(patch, 'textData')) textData.value = patch['textData']
  if (Object.prototype.hasOwnProperty.call(patch, 'controls')) controls.value = patch['controls']
  if (Object.prototype.hasOwnProperty.call(patch, 'city')) city.value = patch['city']
  if (Object.prototype.hasOwnProperty.call(patch, 'starData')) starData.value = patch['starData']
  if (Object.prototype.hasOwnProperty.call(patch, 'mapHeight')) mapHeight.value = patch['mapHeight']
  if (Object.prototype.hasOwnProperty.call(patch, 'height')) height.value = patch['height']
}

onReady(() => {
  var obj = {
    latitude: 39.855745,
    longitude: 116.368432
  };
  reserveAddr(obj);
})

const makertap = (e) => {
  console.log(e);
  var markerId = e.markerId;
  // 执行标记点活动事件
  // 执行标记点活动事件
  markerActive(markerId);
  // 执行更新信息事件
  // 执行更新信息事件
  infoChange(markerId);
}

const markerActive = (id) => {
  // 遍历marker数组若每一项的id与传过来的参数id相等  那么将该项的图标变为活动状态
  var a = markers.value.map((item, index) => {
    return item.id === id ? {
      id: item.id,
      latitude: item.latitude,
      longitude: item.longitude,
      iconPath: iconActive,
      width: item.width,
      height: item.height
    } : {
      id: item.id,
      latitude: item.latitude,
      longitude: item.longitude,
      iconPath: icon,
      width: item.width,
      height: item.height
    };
  });
  setData({
    markers: a
  });
}

const infoChange = (id) => {
  var current = markers.value.filter((item, index) => {
    return item.id === id;
  })[0];
  reserveAddr(current);
}

const reserveAddr = (markerObj) => {
  // 调用amapFile.AMapWX构造函数创建myAmapFun实例
  var myAmapFun = new amapFile.AMapWX({
    key: key
  });
  // 根据参数的坐标值,调用getRegeo方法逆解析地址
  // 根据参数的坐标值,调用getRegeo方法逆解析地址
  myAmapFun.getRegeo({
    location: `${markerObj.longitude},${markerObj.latitude}`,
    success: data => {
      // 调用成功则将相关数据存储至textData
      setData({
        textData: {
          name: data[0].regeocodeData.formatted_address,
          address: data[0].name,
          latitude: data[0].latitude,
          longitude: data[0].longitude
        }
      });
    }
  });
}

const open = () => {
  // 调用ui.openLocation方法打开本机地图查看
  wxSafe.openLocation({
    backgroundColor: '#fff',
    color: '#000',
    longitude: Number(textData.value.longitude),
    latitude: Number(textData.value.latitude),
    name: textData.value.name,
    address: textData.value.address,
    scale: 16
  });
}

const controltap = (e) => {
  var mapCtx = wxSafe.createMapContext('map');
  if (e.controlId === 0) {
    // 调用获取的map对象的移动地图中心点到定位点方法
    mapCtx.moveToLocation();
  }
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
          <view>地址逆解析</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
        </ui-col>
      </ui-row>
    </ui-nav-bar>
    <view style="height:{{NAV_HEIGHT}}"></view>
    <view class="map_container" style="height:{{height-140}}px">
      <map 
        id="map" 
        longitude="{{longitude}}" 
        latitude="{{latitude}}" 
        scale="14" 
        markers="{{markers}}"
        controls="{{controls}}"
        bindcontroltap="controltap"
        show-location
        bindmarkertap="makertap"
        style="width:100%;height:{{height-140}}px"> 
      </map>
    </view>
    <view class="bot">
      <view class="map_text border">
        <view class="pic">
          <image src="{{src}}"></image>
        </view>
        <view class="shop-info">
          <view class="shop-name">{{textData.name}}</view>
          <view class="judge">
            <ui-mini-star value="4.1" width="73"></ui-mini-star>
          </view>
          <view class="shop-addr">{{textData.address}}</view>
        </view>
      </view>
      <ui-row height="50" bindtap="open">
        <ui-col space-left="10" vertical-align="middle">
          <view>预计到达时间10分钟</view>
        </ui-col>
        <ui-col space-right="10" vertical-align="middle" width="100">
          <button type="primary">查看路线</button>
        </ui-col>
      </ui-row>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.map_container {
  position: relative;
}
.h1 {
  margin: 8px 0;
  font-size:15px;
  
}
.info {
  margin: 5px 0;
  display: block;
  font-size:12px;
}
.map_text {
  height: 86px;
  padding: 8px 10px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow:0 -4px 1px 0 rgba(204, 204, 204,.2);
}
.border {
  /* migrated less mixin: .mix-1px(0, 0, 1, 0, #aaa); */
}

.pic {
  width: 70px;
  height: 70px;
  .ui-image {
      width: 100%;
      height: 100%;
  }
}

.shop-info {
  width: 278px;
  height: 69px;
  
}
.shop-name {
  font-size: 14px;
  line-height: 14px;
}
.shop-addr {
  font-size: 10px;
  line-height: 10px;
}
.bot {
  width: 100%;
  position: absolute;
  left: 0;
  bottom: 0;
  background: #ffffff;
}
.judge {
  margin: 5px 0 8px;
}
</style>
