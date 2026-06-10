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
const tips = ref([])
const prevent = ref(false)
const keywords = ref('')

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'tips')) tips.value = patch['tips']
  if (Object.prototype.hasOwnProperty.call(patch, 'prevent')) prevent.value = patch['prevent']
  if (Object.prototype.hasOwnProperty.call(patch, 'keywords')) keywords.value = patch['keywords']
}

const bindInput = (e) => {
  console.log(e);
  // 通过e.target.value获得输入框当前的值
  // 通过e.target.value获得输入框当前的值
  var keywords = e.detail.value;
  // 调用amapFile.AMapWX方法构建myAmapFun对象
  // 调用amapFile.AMapWX方法构建myAmapFun对象
  var myAmapFun = new amapFile.AMapWX({
    key: key
  });

  // myAmapFun对象调用getInputtips方法获得搜索提示数据
  // myAmapFun对象调用getInputtips方法获得搜索提示数据
  myAmapFun.getInputtips({
    keywords: keywords,
    // 输入框键入的关键字
    location: lonlat,
    // 坐标
    city: city,
    // 城市
    success: data => {
      // 调用成功后的回调函数
      console.log(data, 'data');
      if (data && data.tips) {
        setData({
          tips: data.tips
        });
      }
      console.log(tips.value, 'tips.value');
    }
  });
}

const bindSearch = (e) => {
  var keywords = e.target.dataset.keywords;
  // 调用QQMapWX构造函数构建出qqmap对象
  // 调用QQMapWX构造函数构建出qqmap对象
  var qqmap = new QQMapWX({
    key: qqkey
  });
  // qqmap调用geocoder方法来获取
  // qqmap调用geocoder方法来获取
  qqmap.geocoder({
    address: `北京${keywords}`,
    success: res => {
      // 调用成功则执行文字描述转换事件
      reverseGeocoder(qqmap, res);
    },
    fail: res => {
      // 调用失败则执行此回调函数
    },
    complete: res => {
      // 成功与否都将执行此回调函数
    }
  });
}

const reverseGeocoder = (mapObj, response) => {
  var name = response.result.title;
  // 调用reverseGeocoder由坐标到坐标所在位置的文字描述的转换，输入坐标返回地理位置信息和附近poi列表
  // 调用reverseGeocoder由坐标到坐标所在位置的文字描述的转换，输入坐标返回地理位置信息和附近poi列表
  mapObj.reverseGeocoder({
    location: {
      latitude: response.result.location.lat,
      longitude: response.result.location.lng
    },
    success: res => {
      // 调用成功则执行此回调函数
      // 执行打开第三方地图查看事件
      openLocation(res, name);
    },
    fail: res => {
      // 调用失败则执行此回调函数
    },
    complete: res => {
      // 无论成功与否都会执行此回调函数
    }
  });
}

const openLocation = (response, name) => {
  // 通过拿到的response解构赋值给lat lng
  let {
    lat,
    lng
  } = response.result.location;
  // 调用ui.openLocation方法打开第三方地图查看
  // 调用ui.openLocation方法打开第三方地图查看
  wxSafe.openLocation({
    backgroundColor: '#fff',
    color: '#000',
    latitude: lat,
    longitude: lng,
    name: name,
    address: response.result.address,
    scale: 28
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
          <view>搜索位置并查看</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
        </ui-col>
      </ui-row>
    </ui-nav-bar>
    <view style="height:{{NAV_HEIGHT}}"></view>
    <view class="prevent-screen" hidden="{{!prevent}}"></view>
    <view class="section">
      <input bindinput="bindInput" placeholder="搜索" value="{{keywords}}"></input>
    </view>
    <view wx:if="{{tips.length > 0}}" bindtap="bindSearch" data-keywords="{{item.name}}" class="text_box"
      wx:for="{{tips}}">
      {{item.name}}
    </view>
  </view>
</template>

<style lang="scss" scoped>
// mapSearchTips.less
.section {
  padding: 5px 20px;
  input {
    width: 100%;
    height: 30px;
    border-radius: 5px;
    outline: none;
    border:1px solid #ccc;
    padding-left:10px;
  }
}
.text_box {
  padding: 10px 20px;
  line-height: 20px;
}
.map .section {
  margin-bottom: 0;
}
</style>
