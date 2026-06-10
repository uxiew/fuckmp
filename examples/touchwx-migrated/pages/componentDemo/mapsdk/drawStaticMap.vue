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
const src = ref('')
const myAmapFun = ref(null)
const height = ref(0)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'src')) src.value = patch['src']
  if (Object.prototype.hasOwnProperty.call(patch, 'myAmapFun')) myAmapFun.value = patch['myAmapFun']
  if (Object.prototype.hasOwnProperty.call(patch, 'height')) height.value = patch['height']
}

onReady(() => {
  // 挂载完成后执行初始化静态图事件
  initStacticMap();
})

const navigateBack = () => {
  wxSafe.navigateBack();
}

const initStacticMap = () => {
  // 调用amapFile.AMapWX构造函数创建myAmapFun实例对象
  myAmapFun.value = new amapFile.AMapWX({
    key: key
  });
  // 调用ui.getSystemInfo获取设备信息
  // 调用ui.getSystemInfo获取设备信息
  wxSafe.getSystemInfo({
    success: data => {
      // 获取设备浏览器宽高
      var height = data.windowHeight;
      var width = data.windowWidth;
      var size = width + '*' + height;
      // 执行绘制静态图事件
      getStaticMap(size);
    }
  });
}

const getStaticMap = (size) => {
  myAmapFun.value.getStaticmap({
    zoom: 10,
    size: size,
    scale: 2,
    location: '116.38482,39.94858',
    //  绘制点参数
    markers: 'large,0xFF0000,起:116.31604,39.96491|large,0x008000,终:116.39361,39.936957',
    //  绘制标签参数
    labels: '朝阳公园,2,0,32,0xFFFFFF,0x008000:116.48482,39.94858',
    //  绘制线段和区域参数
    paths: '10,0x0000ff,1,,:116.31604,39.96491;116.320816,39.966606;116.321785,39.966827;116.32361,39.966957;116.39361,39.966957;116.39361,39.936957|10,0x0000ff,0.1,0xFFFF00,0.7:116.32248,39.896833;116.427537,39.901837;116.378442,39.864691',
    success: data => {
      // 调用成功则执行此函数逻辑
      setData({
        src: data.url
      });
    },
    fail: info => {}
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
          <view>绘制静态图</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
        </ui-col>
      </ui-row>
    </ui-nav-bar>
    <view style="height:{{NAV_HEIGHT}}"></view>
    <view class="img_box" style="height:{{height}}px">
      <image src="{{src}}"></image>
    </view>
  </view>
</template>

<style lang="scss" scoped>
// drawStaticMap.less
.img_box{
  image{
    width: 100%;
    height: 100%;
  }
}
</style>
