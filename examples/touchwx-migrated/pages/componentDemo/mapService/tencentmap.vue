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
const conHeight = ref(0)
const headerHeight = ref(0)
const tips = ref([])
const tips2 = ref([])
const tips3 = ref([])
const keywords = ref('')
const tempKeywords = ref('')
const latitude = ref(39.855060)
const longitude = ref(116.368650)
const analogSearch = ref('')
const show = ref(false)
const show2 = ref(false)
const show3 = ref(false)
const flag = ref(null)
const markers = ref([])

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'conHeight')) conHeight.value = patch['conHeight']
  if (Object.prototype.hasOwnProperty.call(patch, 'headerHeight')) headerHeight.value = patch['headerHeight']
  if (Object.prototype.hasOwnProperty.call(patch, 'tips')) tips.value = patch['tips']
  if (Object.prototype.hasOwnProperty.call(patch, 'tips2')) tips2.value = patch['tips2']
  if (Object.prototype.hasOwnProperty.call(patch, 'tips3')) tips3.value = patch['tips3']
  if (Object.prototype.hasOwnProperty.call(patch, 'keywords')) keywords.value = patch['keywords']
  if (Object.prototype.hasOwnProperty.call(patch, 'tempKeywords')) tempKeywords.value = patch['tempKeywords']
  if (Object.prototype.hasOwnProperty.call(patch, 'latitude')) latitude.value = patch['latitude']
  if (Object.prototype.hasOwnProperty.call(patch, 'longitude')) longitude.value = patch['longitude']
  if (Object.prototype.hasOwnProperty.call(patch, 'analogSearch')) analogSearch.value = patch['analogSearch']
  if (Object.prototype.hasOwnProperty.call(patch, 'show')) show.value = patch['show']
  if (Object.prototype.hasOwnProperty.call(patch, 'show2')) show2.value = patch['show2']
  if (Object.prototype.hasOwnProperty.call(patch, 'show3')) show3.value = patch['show3']
  if (Object.prototype.hasOwnProperty.call(patch, 'flag')) flag.value = patch['flag']
  if (Object.prototype.hasOwnProperty.call(patch, 'markers')) markers.value = patch['markers']
}

const callouttap = (e) => {
  toSysMap(39.855060, 116.368650, '北京引领视觉科技有限公司');
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

const bindhide = () => {
  // show3.value = true
  console.log('显示');
  setData({
    show3: true
  });
}

const bindshow = () => {
  console.log('隐藏');
  // show3.value = false
  // show3.value = false
  setData({
    show3: false
  });
}

const toggle = () => {
  // show2.value = true
  setData({
    show2: true
  });
}

const bindtap2 = () => {
  // show2.value = true
  setData({
    show2: true,
    show: false
  });
  let that = this;
  // analogSearch.value = keywords.value
  // analogSearch.value = keywords.value 
  setData({
    analogSearch: keywords.value
  });
  wxSafe.request({
    url: 'https://apis.map.qq.com/ws/place/v1/search',
    data: {
      keyword: keywords.value,
      boundary: 'region(北京,0)',
      key: 'RHGBZ-S2LAU-5MRV7-4QPTZ-JI25K-HVBDV'
    },
    success: function (res) {
      // that.data.tips3 = res.data.data
      that.setData({
        tips3: res.data.data
      });
      console.log(that.data.tips3);
    }
  });
}

const bindInput = (e) => {
  console.log(e);
  if (e === undefined) {
    return false;
  }
  setData({
    keywords: e.detail.value
  });
  // show.value = true
  // show.value = true
  setData({
    show: true
  });
  let that = this;
  wxSafe.request({
    url: 'https://apis.map.qq.com/ws/place/v1/suggestion',
    data: {
      keyword: keywords.value,
      region: '北京',
      key: 'RHGBZ-S2LAU-5MRV7-4QPTZ-JI25K-HVBDV'
    },
    success: function (res) {
      if (res.data.status === 120) {
        return false;
      } else {
        // that.data.tips = res.data.data
        that.setData({
          tips: res.data.data
        });
      }
    }
  });
}

const associationalSearch = (e) => {
  //获取输入的字符
  console.log(e);
  let data, index, title, flag;
  if (e.target.dataset.value === undefined) {
    data = e.currentTarget.dataset.value;
    index = e.currentTarget.dataset.index;
    title = e.currentTarget.dataset.title;
    flag = e.currentTarget.dataset.flag;
  } else {
    data = e.target.dataset.value;
    index = e.target.dataset.index;
    title = e.target.dataset.title;
    flag = e.target.dataset.flag;
  }
  let that = this;
  // show3.value = false
  // show3.value = false
  setData({
    show3: false
  });
  var keywords = title;
  console.log(title, keywords);
  if (flag === "0") {
    // analogSearch.value = keywords
    // tempKeywords.value = keywords
    // flag.value = 0
    setData({
      analogSearch: keywords,
      tempKeywords: keywords,
      flag: 0
    });
    console.log(analogSearch.value, 'analogSearch.value');
  } else if (flag === "1") {
    flag.value = 1;
    tempKeywords.value = keywords;
    setData({
      tempKeywords: keywords,
      flag: 1
    });
  }
  latitude.value = data.value[data][index].location.lat;
  longitude.value = data.value[data][index].location.lng;
  setData({
    latitude: data.value[data][index].location.lat,
    longitude: data.value[data][index].location.lng
  });
  let markersSearch = [{
    id: 1,
    latitude: latitude.value,
    longitude: longitude.value,
    iconPath: '/images/posi.png',
    label: {
      fontSize: 12,
      color: '#FF0000',
      content: '',
      x: 0.5,
      y: 0.5
    },
    callout: {
      content: `${data.value[data][index].title},${data.value[data][index].address}`,
      color: '#000000',
      fontSize: 16,
      bgColor: '#ffffff',
      borderRadius: 10,
      display: 'ALWAYS',
      padding: 6
    },
    width: 30,
    height: 40
  }];
  console.log(markersSearch);
  // markers.value = JSON.parse(JSON.stringify(markersSearch))
  // markers.value = JSON.parse(JSON.stringify(markersSearch))
  setData({
    markers: JSON.parse(JSON.stringify(markersSearch))
  });
  console.log(markers.value);

  // show.value = false
  // show2.value= false

  // this[data] = []

  // tips.value = []
  // tips2.value = []
  // show.value = false
  // show2.value= false

  // this[data] = []

  // tips.value = []
  // tips2.value = []

  setData({
    show: false,
    show2: false,
    tips: [],
    tips2: []
  });
  // console.log()
}

const bindtap = () => {
  show.value = false;
  console.log(show.value);
  show2.value = true;
  let that = this;
  wxSafe.request({
    url: 'http://apis.map.qq.com/ws/place/v1/suggestion',
    data: {
      keyword: keywords.value,
      region: '北京',
      key: 'RHGBZ-S2LAU-5MRV7-4QPTZ-JI25K-HVBDV'
    },
    success: function (res) {
      console.log(res.data.data);
      that.tips2 = res.data.data;
    }
  });
}

const bindfocus = () => {
  show.value = true;
  console.log('huodejiaodian');
  bindInput();
}

const bindblur = () => {
  show.value = false;
  console.log(show.value);
}

const searchShow = () => {
  console.log('searchShow');
  // show.value = true
  // show.value = true
  setData({
    show: true
  });
  if (flag.value === 0) {
    // keywords.value = tempKeywords.value
    setData({
      keywords: tempKeywords.value
    });
  } else if (flag.value === 1) {
    return false;
  }
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
            <view>地图绘制</view>
          </ui-col>
          <ui-col vertical-align="middle" align="center" width="60">
          </ui-col>
        </ui-row>
      </ui-nav-bar>
      <view style="height:{{NAV_HEIGHT}}"></view>
      <view class="querySearch" style="height:{{conHeight}}px" hidden="{{!show}}">
        <view class="section {{show?'sectionBack':''}}">
        <form action="/search" bindsubmit="bindtap2"> 
          <ui-row>
            <ui-col vertical-align="middle">
              <input bindinput="bindInput" bindconfirm="bindtap2" focus="{{ show }}" value="{{keywords}}" type="search"  bindfocus="bindfocus" bindblur="bindblur" name="search" placeholder="搜索地点" />
            </ui-col>
          </ui-row>
        </form>
      </view>
          <view bindtap="associationalSearch" data-value="tips" data-index="{{index}}" data-flag="0" data-title = "{{item.title}}"  data-keywords="{{item.title}}" wx:for-item="item" class="text_box" wx:for="{{tips}}">
          {{item.title}}
        </view>
      </view>
    <view height="{{conHeight}}">
      <view bindtap="searchShow" class="section {{show?'sectionBack':''}}">
        <ui-row>
          <ui-col vertical-align="middle">
            <view class="analogSearch" wx:if="{{keywords === ''}}">搜索地点</view>
            <view class="analogSearch" wx:elif="{{keywords !== ''}}">{{analogSearch}}</view>
          </ui-col>
        </ui-row>
      </view>


      
      

      <ui-popup show="{{ show2 }}" position="bottom" mask-style="{{ { backgroundColor: 'transparent' } }}"  hide-on-tap="{{false}}" bindhide="bindhide" bindshow="bindshow">
          <view wx:for="{{tips3}}" class="infobox" bindtap="associationalSearch"  data-value="tips3" data-index="{{index}}" data-flag="1" data-title = "{{item.title}}">
            <ui-row height="25" space="10">
              <ui-col vertical-align="middle">
                <view>
                  <text class="info-1">{{item.title}}</text>
                  <text class="info-2" wx:if="item.type===0"></text>
                  <text class="info-2" wx:elif="item.type===1">（公交车站）</text>
                  <text class="info-2" wx:elif="item.type===2">（地铁站)</text>
                  <text class="info-2" wx:elif="item.type===3">(行政区划)</text>
                </view>
              </ui-col>
            </ui-row>
            <ui-row height="20" space="10">
              <ui-col vertical-align="middle">
                <view class="overflow">
                  <text class="info-2">{{item.tel}}</text>
                </view>
              </ui-col>
            
            </ui-row>
            <ui-row height="20" space="10">
              <ui-col vertical-align="middle">
                <ui-mini-star value="4.5"></ui-mini-star>
              </ui-col>
            </ui-row>
            <ui-row height="20" space="10">
              <ui-col vertical-align="middle" class="info-3">{{item.address}}</ui-col>
            </ui-row>
          </view>
          
      </ui-popup>

      <!-- <view hidden="{{!show3}}">11111test</view> -->
      <ui-fixed-view bottom="0" left="0" right="0"  bindtap="toggle" wx:if="{{show3}}">
        <view  style="width:100%;height:45px;z-index:1;background-color:#fff;width:100%;text-align:center;line-height:45px;" ></view>
        查看“{{keywords}}”搜索结果
      </ui-fixed-view> 
      
    
      <map 
      id="map" 
      map-service="tencent"
      height="{{conHeight}}"
      markers="{{markers}}"
      longitude="{{longitude}}"
      latitude="{{latitude}}"
      show-location
      bindcallouttap="callouttap"
      scale="18"
      style="width:100%;height:{{conHeight-50}}px;margin-top:50px;">
    </map>
    </view>
  </view>
</template>

<style lang="scss" scoped>
// mapSearchTips.less
  .analogSearch{
    background-color:#fff;
    border:1px solid #ccc;
    border-radius:5px;
    height:33px;
    line-height:33px;
    padding:0 12px;
    color:#797474;
  }
  .infobox{
    padding:10px 20px;
    /* migrated less mixin: .mix-1px(0, 0, 1, 0, #ccc); */
    .info-1{
      font-size:18px;
      padding-right:5px;
    }
    .overflow{
      /* migrated less mixin: .mix-text-overflow(); */
    }
    .info-2{
      font-size:12px;
    }
    .info-3{
      font-size:12px;
      color:#666;
    }
  }

.section {
  padding: 5px 20px;
  position: absolute;
  width: 100%;
  height: 46px;
  z-index: 9;
  input {
    width: 100%;
    height: 30px;
    border-radius: 5px;
    outline: none;
  }
}

.sectionBack{
  background-color:#fff
}

.querySearch{
  position: absolute;
  width: 100%;
  z-index: 9;
  background-color:rgba(255,255,255,.8)
}
.text_box {
  padding: 10px 20px;
  line-height: 20px;
}
.map .section {
  margin-bottom: 0;
}

.c-wrap {
display: flex;
justify-content: space-between;
align-items: center;

}
.info {
max-width:180px;
/* migrated less mixin: .mix-text-overflow(); */
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
width: 100%;
font-size: 12px;
color: #000;
line-height: 16px;
/* migrated less mixin: .mix-text-overflow(); */
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
</style>
