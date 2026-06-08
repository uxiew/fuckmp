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
const delay = ref({
  delay: 3000
})
const imgHeight = ref(0)
const alpha = ref(0)
const bottom = ref(30)
const className = ref('')
const statusHeight = ref(0)
const isSplashSwiper = ref(false)
const items = ref([{
  src: 'http://images.uileader.com/20180408/eef1a709-72d8-45e4-a62c-a887a1685576.jpg',
  url: '/pages/templeteDemo/O2O/O2O'
}, {
  src: 'http://images.uileader.com/20180408/8e90e7ef-ef87-4668-ad70-d9dff30145be.jpg',
  url: '/pages/templeteDemo/graphic/graphic'
}, {
  src: 'http://images.uileader.com/20180408/01fda88d-8b55-405f-bc78-1e091607be64.jpg',
  url: '/pages/templeteDemo/form/payment'
}, {
  src: 'http://images.uileader.com/20180408/e9a11567-8cbf-4a66-b486-4ddb0b10ab31.jpg',
  url: '/pages/templeteDemo/dataReport/fundOptional'
}])

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'delay')) delay.value = patch['delay']
  if (Object.prototype.hasOwnProperty.call(patch, 'imgHeight')) imgHeight.value = patch['imgHeight']
  if (Object.prototype.hasOwnProperty.call(patch, 'alpha')) alpha.value = patch['alpha']
  if (Object.prototype.hasOwnProperty.call(patch, 'bottom')) bottom.value = patch['bottom']
  if (Object.prototype.hasOwnProperty.call(patch, 'className')) className.value = patch['className']
  if (Object.prototype.hasOwnProperty.call(patch, 'statusHeight')) statusHeight.value = patch['statusHeight']
  if (Object.prototype.hasOwnProperty.call(patch, 'isSplashSwiper')) isSplashSwiper.value = patch['isSplashSwiper']
  if (Object.prototype.hasOwnProperty.call(patch, 'items')) items.value = patch['items']
}

const navigateTo = (index) => {
  wxSafe.navigateTo({
    url: items.value[index].url
  });
}

const handlePullRefresh = () => {
  wxSafe.showToast({
    title: '处理下拉刷新'
  });
}

const handleBegin = ({
  distance,
  direction
}) => {
  if (distance > 10) {
    className.value = 'opacity';
  }
}

const handleAfter = () => {
  className.value = 'opacity opacity1';
}

const splashInto = () => {
  isSplashSwiper.value = false;
  wxSafe.setStorageSync('splash', 'show');
}

const changeSwiper = (e) => {

}

const onShareAppMessage = () => {

}

</script>

<template>
<view>

    <!-- 自定义导航 -->
    <ui-nav-bar slot="nav-bar" custom-style="{{ {boxShadow: '0 0px 16px 0 #ccc',backgroundColor:'#fff'} }}">
      <ui-row height="46" >
        <ui-col vertical-align="middle" align="center">
          <view>
            Touch WX框架
          </view>
        </ui-col>
      </ui-row>
    </ui-nav-bar>

    <!-- 设置内容距离nav-bar高度占位 -->
    <view style="height:{{NAV_HEIGHT}}"></view>
    <view style="padding:10px 0;box-shadow: 0 0px 16px 0 #ccc;position:relative;z-index:99;">
      <image 
        src="http://images.uileader.com/20180705/5696ce1b-8628-4726-9b12-63136b2d5608.png" 
        mode="simple" 
        style="width:100%;height:{{imgHeight}}px;"
    ></image>
    </view>
    

    <view class="class-wrap">
      <ui-row height="60" class="title">
        <ui-col vertical-align="middle" align="left" width="20">
          <ui-icon type="location" size="18" color="#39f"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="left" space-left="10">
          <view>容器</view>
        </ui-col>
      </ui-row>
      
      <ui-row class="class-item" height="100" space-bottom="20">
        <ui-col vertical-align="middle" align="center" class="left-item" space="20">
          <navigator url="/pages/home/viewList">
            <view class="title">布局类容器</view>
            <text class="small-title"> row&col / row-list / fixed-view</text>
          </navigator>
        </ui-col>
        <ui-col width="20"></ui-col>
        <ui-col vertical-align="middle" align="center" class="right-item" space="20">
          <navigator url="/pages/home/viewList2">
            <view class="title">功能类容器</view>
            <text class="small-title">sticky / swipe-out / accordion / summary</text>
          </navigator>
        </ui-col>
      </ui-row>
      <ui-row class="class-item2" hover-class="touchui-hover" space-bottom="20" url="/pages/home/changeList" height="80">
        <ui-col vertical-align="middle" align="center" width="120" class="left-item application_06">
          <ui-icon type="home-change" size="50" color="#fff"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="left" space-left="10">
          <view class="title">切换类容器</view>
          <text class="small-title">swiper / tabs / v-tabs / segment</text>
        </ui-col>
      </ui-row>
      <ui-row class="class-item2" hover-class="touchui-hover" space-bottom="20" url="/pages/home/modalList" height="80">
        <ui-col vertical-align="middle" align="center" width="120" class="left-item application_07">
          <ui-icon type="home-modal" size="50" color="#fff"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="left" space-left="10">
          <view class="title">模态类容器</view>
          <text class="small-title">mask / popup </text>
        </ui-col>
      </ui-row>
    </view>

    <view class="class-wrap active">
      <ui-row height="60" class="title">
        <ui-col vertical-align="middle" align="left" width="20">
          <ui-icon type="location" size="18" color="#39f"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="left" space-left="10">
          <view>表单</view>
        </ui-col>
      </ui-row>
      
      <ui-row class="class-item2" hover-class="touchui-hover" space-bottom="20" url="/pages/home/formList" height="80">
        <ui-col vertical-align="middle" align="center" width="120" class="left-item application_08">
          <ui-icon type="api-event" size="50" color="#fff"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="left" space-left="10">
          <view class="title">手势表单元素</view>
          <text class="small-title">button / slider / ruler</text>
        </ui-col>
      </ui-row>
      <ui-row class="class-item2" hover-class="touchui-hover" space-bottom="20" url="/pages/home/formList3" height="80">
        <ui-col vertical-align="middle" align="center" width="120" class="left-item application_02">
          <ui-icon type="home-choose" size="50" color="#fff"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="left" space-left="10">
          <view class="title">选择表单元素</view>
          <text class="small-title">check-list / stepper / cascader / index-list / calendar</text>
        </ui-col>
      </ui-row>
    </view>

    <view class="class-wrap">
      <ui-row height="60" class="title">
        <ui-col vertical-align="middle" align="left" width="20">
          <ui-icon type="location" size="18" color="#39f"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="left" space-left="10">
          <view>媒体</view>
        </ui-col>
      </ui-row>
      
      <ui-row class="class-item2" hover-class="touchui-hover" space-bottom="20" url="/pages/home/textList" height="80">
        <ui-col vertical-align="middle" align="center" width="120" class="left-item application_04">
          <ui-icon type="home-text" size="50" color="#fff"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="left" space-left="10">
          <view class="title">文本</view>
          <text class="small-title"> tags / count-up / count-down / roller</text>
        </ui-col>
      </ui-row>
      <ui-row class="class-item2" hover-class="touchui-hover" space-bottom="20" url="/pages/home/mediaCompList" height="80">
        <ui-col vertical-align="middle" align="center" width="120" class="left-item application_05">
          <ui-icon type="photo" size="50" color="#fff"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="left" space-left="10">
          <view class="title">图标与图片</view>
          <text class="small-title">演示了icon图标使用 / 朦胧图等效果</text>
        </ui-col>
      </ui-row>
      
    </view>

    <view class="class-wrap active">
      <ui-row height="60" class="title">
        <ui-col vertical-align="middle" align="left" width="20">
          <ui-icon type="location" size="18" color="#39f"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="left" space-left="10">
          <view>图形化</view>
        </ui-col>
      </ui-row>
      
      <ui-row class="class-item2" hover-class="touchui-hover" space-bottom="20" url="/pages/home/graphicalList" height="80">
        <ui-col vertical-align="middle" align="center" width="120" class="left-item application_07">
          <ui-icon type="collect1" size="50" color="#fff"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="left" space-left="10">
          <view class="title">图形与交互</view>
          <text class="small-title">badge / divider / star / mini-star </text>
        </ui-col>
      </ui-row>
      <ui-row class="class-item2" hover-class="touchui-hover" space-bottom="20" url="/pages/home/graphicalList2" height="80">
        <ui-col vertical-align="middle" align="center" width="120" class="left-item application_08">
          <ui-icon type="home-jindu" size="50" color="#fff"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="left" space-left="10">
          <view class="title">进度类图形</view>
          <text class="small-title">timeline</text>
        </ui-col>
      </ui-row>
    </view>

    <view class="class-wrap">
      <ui-row height="60" class="title">
        <ui-col vertical-align="middle" align="left" width="20">
          <ui-icon type="home-map" size="18" color="#39f"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="left" space-left="10">
          <view>地图</view>
        </ui-col>
      </ui-row>

      <ui-row class="class-item2" hover-class="touchui-hover" space-bottom="20" url="/pages/home/mapList" height="80">
        <ui-col vertical-align="middle" align="center" width="120" class="left-item application_07">
          <ui-icon type="home-map" size="50" color="#fff"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="left" space-left="10">
          <view class="title">地图组件</view>
          <text class="small-title">演示地图操作、标记点、气泡、绘制等相关特性 </text>
        </ui-col>
      </ui-row>

      <ui-row class="class-item2" hover-class="touchui-hover" space-bottom="20" url="/pages/home/mapList2" height="80">
        <ui-col vertical-align="middle" align="center" width="120" class="left-item application_03">
          <ui-icon type="home-sdk" size="50" color="#fff"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="left" space-left="10">
          <view class="title">地图服务SDK</view>
          <text class="small-title">包含了讯地图服务和高德地图服务的SDK示例</text>
        </ui-col>
      </ui-row>
    </view>

    <view class="class-wrap active">
      <ui-row height="60" class="title">
        <ui-col vertical-align="middle" align="left" width="20">
          <ui-icon type="location" size="18" color="#39f"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="left" space-left="10">
          <view>其他</view>
        </ui-col>
      </ui-row>

      <ui-row class="class-item2" hover-class="touchui-hover" space-bottom="20" url="/pages/home/apiList" height="80">
        <ui-col vertical-align="middle" align="center" width="120" class="left-item application_07">
          <ui-icon type="home-modal" size="50" color="#fff"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="left" space-left="10">
          <view class="title">扩展API</view>
          <text class="small-title"> </text>
        </ui-col>
      </ui-row>

      <ui-row class="class-item2" hover-class="touchui-hover" space-bottom="20" url="/pages/componentDemo/styleLib" height="80">
        <ui-col vertical-align="middle" align="center" width="120" class="left-item application_03">
          <ui-icon type="home-tabBar" size="50" color="#fff"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="left" space-left="10">
          <view class="title">Less函数库</view>
          <text class="small-title"></text>
        </ui-col>
      </ui-row>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.pull-down-content {
    height: 60px;
    margin-top: -60px;
    display: flex; align-items: center; justify-content: center;
}

.img-layer {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    .touch_ui{
      width: 120px;
      height:90px;
      background: url(http://images.uileader.com/20180409/b04cd18f-7010-418d-8675-745e1ec714d8.png) no-repeat;
      background-position: center 0;
      background-size: 100%;
    }
}
.statusBar{
    width: 100%;
    transition: all .25s ease-in;
}


// 头部轮播
.head-swiper{
  background-color: #fff;
  padding: 10px 0px;
  box-shadow: 0 0px 16px 0 #ccc;
  height:110px;
  .swiper-slide {
    text-align: center;
    font-size: 18px;
    background: #fff;
    width: 90%;
    /* Center slide text vertically */
    display: flex;
    justify-content: center;
    align-items: center;
    .ui-image {
      width: 100%;
      height:220rpx;
      border-radius: 5px;
    }
  }
  .swiper-pagination-bullets{
    bottom: 10px
  }
  .swiper-pagination-bullet {
    width: 20px;
    height: 3px;
    background-color: #eee;
    opacity: .5;
    border-radius: 0;
    &.swiper-pagination-bullet-active {
      background-color: #fff;
      opacity: 1;
    }
  }
}
// 类别
.class-wrap{
  background-color: #F6F9FB;
  padding: 0 10px 10px 10px;
  position: relative;
  z-index:1;
  &.active{
    background-color: #ffff;
    box-shadow: 0 0px 16px 0 #ccc;
    z-index:2;
  }
  .ui-row.title{
    .ui-view{
      font-size: 14px;
      color: #2b333b;
    }
  }
  .class-item{
    .ui-col{
      border-radius: 5px;
      .ui-text{
        text-align:left;
      }
    }
    .left-item{
      background: #ff4545 url(http://images.uileader.com/20180409/95e6daf2-0cd1-4cd4-b5dc-919f021e914d.png) no-repeat 95% 100%;
      background-size: 50px;
      box-shadow: 0 4px 16px 0 #ff4545;
    }
    .right-item{
      background: #0070bb url(http://images.uileader.com/20180409/01664d83-9430-4754-b6cb-16573d64bade.png) no-repeat 95% 95%;
      background-size: 50px;
      box-shadow: 0 4px 16px 0 #0070bb;
    }
    .title{
      color: #fff;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .small-title{
      color: #fff;
      font-size: 12px;
    }
  }
  .class-item2{
    .ui-image{
      border-radius: 5px;
    }
    .title{
      color: #2B333B;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .small-title{
      color: #71777D;
      font-size: 12px;
    }
    .left-item{
      border-radius: 5px;
      box-shadow: 0 4px 16px 0 #ccc;
    }
  }

  .application_01 {
      background-color: #FECC0B;
  }
  .application_02 {
      background-color: #44BBFC;
  }
  .application_03 {
      background-color: #5DC663;
  }
  .application_04 {
      background-color: #3CBAFF;
  }
  .application_05 {
      background-color: #35C094;
  }
  .application_06 {
      background-color: #34C9E3;
  }
  .application_07 {
      background-color: #4EC1FF;
  }
  .application_08 {
      background-color: #2B94ED;
  }
}
</style>
