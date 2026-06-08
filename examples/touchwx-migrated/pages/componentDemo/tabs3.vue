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
const current1 = ref(0)
const current2 = ref(0)
const isnull = ref(false)
const isflag = ref(0)
const ratate = ref(0)
const customStyle2 = ref({
  'background-color': '#fbb966',
  'border-radius': '3px',
  'font-size': '14px',
  'padding': '0'
})
const films = ref([{
  film: ''
}, {
  film: [{
    startTime: '09:20',
    endTime: '11:23散场',
    filmMode: '英语2D',
    filmHall: '7号厅',
    filmSale: '￥35.9起',
    filmPrice: '39元',
    filmState: '购买'
  }, {
    startTime: '10:05',
    endTime: '12:08散场',
    filmMode: '英语2D',
    filmHall: 'POLY全景巨幕厅(大)',
    filmSale: '￥35.9起',
    filmPrice: '39元',
    filmState: '购买'
  }]
}, {
  film: [{
    startTime: '10:20',
    endTime: '12:23散场',
    filmMode: '英语2D',
    filmHall: 'POLY全景巨幕厅(大)',
    filmSale: '￥35.9起',
    filmPrice: '39元',
    filmState: '购买'
  }, {
    startTime: '12:35',
    endTime: '14:38散场',
    filmMode: '英语2D',
    filmHall: 'POLY全景巨幕厅(大)',
    filmSale: '￥35.9起',
    filmPrice: '39元',
    filmState: '购买'
  }, {
    startTime: '14:50',
    endTime: '16:53散场',
    filmMode: '英语2D',
    filmHall: 'POLY全景巨幕厅(大)',
    filmSale: '￥35.9起',
    filmPrice: '39元',
    filmState: '购买'
  }]
}, {
  film: [{
    startTime: '08:20',
    endTime: '10:23散场',
    filmMode: '英语3D',
    filmHall: '7号厅',
    filmSale: '￥50.9起',
    filmPrice: '66元',
    filmState: '购买'
  }, {
    startTime: '12:35',
    endTime: '14:38散场',
    filmMode: '英语2D',
    filmHall: '1号厅',
    filmSale: '￥48.9起',
    filmPrice: '60元',
    filmState: '购买'
  }, {
    startTime: '13:50',
    endTime: '15:53散场',
    filmMode: '英语3D',
    filmHall: '9号厅',
    filmSale: '￥40.9起',
    filmPrice: '50元',
    filmState: '购买'
  }, {
    startTime: '14:50',
    endTime: '16:53散场',
    filmMode: '英语2D',
    filmHall: '5号厅',
    filmSale: '￥35.9起',
    filmPrice: '39元',
    filmState: '购买'
  }]
}, {
  film: [{
    startTime: '10:20',
    endTime: '12:23散场',
    filmMode: '英语2D',
    filmHall: 'POLY全景巨幕厅(大)',
    filmSale: '￥35.9起',
    filmPrice: '39元',
    filmState: '购买'
  }, {
    startTime: '14:50',
    endTime: '16:53散场',
    filmMode: '英语2D',
    filmHall: 'POLY全景巨幕厅(大)',
    filmSale: '￥35.9起',
    filmPrice: '39元',
    filmState: '购买'
  }]
}, {
  film: [{
    startTime: '12:35',
    endTime: '14:38散场',
    filmMode: '英语2D',
    filmHall: 'POLY全景巨幕厅(大)',
    filmSale: '￥35.9起',
    filmPrice: '39元',
    filmState: '购买'
  }, {
    startTime: '14:50',
    endTime: '16:53散场',
    filmMode: '英语2D',
    filmHall: 'POLY全景巨幕厅(大)',
    filmSale: '￥35.9起',
    filmPrice: '39元',
    filmState: '购买'
  }]
}, {
  film: [{
    startTime: '10:20',
    endTime: '12:23散场',
    filmMode: '英语2D',
    filmHall: '5号厅',
    filmSale: '￥55.9起',
    filmPrice: '69元',
    filmState: '购买'
  }, {
    startTime: '12:35',
    endTime: '14:38散场',
    filmMode: '英语2D',
    filmHall: '1号厅',
    filmSale: '￥55.9起',
    filmPrice: '59元',
    filmState: '购买'
  }, {
    startTime: '14:50',
    endTime: '16:53散场',
    filmMode: '英语2D',
    filmHall: '7号厅',
    filmSale: '￥50.9起',
    filmPrice: '59元',
    filmState: '购买'
  }]
}])
const activeTabStyle = ref({
  'color': '#24c471',
  'border-bottom': '1px solid #24c471'
})
const activeTabStyle2 = ref({
  'color': '#e60012',
  'border-bottom': '1px solid #e60012'
})
const filmData = ref([])
const currentData = ref({
  startPlace: '上海',
  startTime: '3月8日',
  startWek: '周四',
  endPlace: '三亚',
  endTime: '3月9日',
  endWek: '周五',
  startHotel: '上海'
})

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'current1')) current1.value = patch['current1']
  if (Object.prototype.hasOwnProperty.call(patch, 'current2')) current2.value = patch['current2']
  if (Object.prototype.hasOwnProperty.call(patch, 'isnull')) isnull.value = patch['isnull']
  if (Object.prototype.hasOwnProperty.call(patch, 'isflag')) isflag.value = patch['isflag']
  if (Object.prototype.hasOwnProperty.call(patch, 'ratate')) ratate.value = patch['ratate']
  if (Object.prototype.hasOwnProperty.call(patch, 'customStyle2')) customStyle2.value = patch['customStyle2']
  if (Object.prototype.hasOwnProperty.call(patch, 'films')) films.value = patch['films']
  if (Object.prototype.hasOwnProperty.call(patch, 'activeTabStyle')) activeTabStyle.value = patch['activeTabStyle']
  if (Object.prototype.hasOwnProperty.call(patch, 'activeTabStyle2')) activeTabStyle2.value = patch['activeTabStyle2']
  if (Object.prototype.hasOwnProperty.call(patch, 'filmData')) filmData.value = patch['filmData']
  if (Object.prototype.hasOwnProperty.call(patch, 'currentData')) currentData.value = patch['currentData']
}

const navigateBack = () => {
  wxSafe.navigateBack();
}

const handleChangeBtn = (e) => {
  setData({
    current1: 1
  });
}

const handleChange = (e) => {
  let key = e.currentTarget.dataset.key;
  let index = e.detail.index;
  console.log(key, index);
  if (key === 'current1') {
    console.log(films.value[index]);
    setData({
      filmData: films.value[index]
    });
    if (filmData.value.film !== '') {
      setData({
        filmData: films.value[index],
        isnull: false
      });
    } else {
      setData({
        isnull: true
      });
    }
  } else if (key === 'current2') {
    isflag.value = index;
    setData({
      isflag: index
    });
  }
}

const changeAir = () => {
  let ratate = ratate.value;
  let active;
  if (ratate === 0) {
    console.log(0);
    active = currentData.value.startPlace;
    currentData.value.startPlace = currentData.value.endPlace;
    currentData.value.endPlace = active;
    // ratate.value = 180
    setData({
      ratate: 100,
      currentData: currentData.value
    });
  } else {
    active = currentData.value.startPlace;
    currentData.value.startPlace = currentData.value.endPlace;
    currentData.value.endPlace = active;
    // ratate.value = 0
    setData({
      ratate: 0,
      currentData: currentData.value
    });
  }
}

onReady(() => {
  console.log(films.value);
  // filmData.value = films.value[0]
  // filmData.value = films.value[0]
  filmData.value = films.value[0];
  if (filmData.value.film === '') {
    // isnull.value = true
    setData({
      isnull: true
    });
  } else {
    // filmData.value = films.value[0]
    setData({
      filmData: films.value[0]
    });
  }
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
          <view>内容共用一个容器</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
        </ui-col>
      </ui-row>
    </ui-nav-bar>
    <view style="height:{{NAV_HEIGHT}}"></view>
    <view class="sample_title">点击tab切换数据</view>
    <ui-tabs index="{{ current1 }}" active-tab-style="{{activeTabStyle2}}"  data-key="current1" bindchange="handleChange">
      <ui-tab>今天11-22</ui-tab>
      <ui-tab>
        <view class="markicon">
            明天11-23 <ui-badge custom-style="{{customStyle2}}" text="惠"></ui-badge>
        </view>
      </ui-tab>
      <ui-tab>
          <view class="markicon">
              后天11-24 <ui-badge custom-style="{{customStyle2}}" text="惠"></ui-badge>
          </view>
      </ui-tab>
      <ui-tab>
          <view class="markicon">
            周六11-25 <ui-badge custom-style="{{customStyle2}}" text="惠"></ui-badge>
          </view>
      </ui-tab>
      <ui-tab>
          <view class="markicon">
              周日11-26 <ui-badge custom-style="{{customStyle2}}" text="惠"></ui-badge>
          </view>
      </ui-tab>
      <ui-tab>
          <view class="markicon">
              周一11-27 <ui-badge custom-style="{{customStyle2}}" text="惠"></ui-badge>
          </view>
      </ui-tab>
    </ui-tabs>
    <view style="text-align:center;margin-top:20px;" wx:if="{{isnull}}">
      <view class="imgbox">
          <image src="http://images.uileader.com/20180319/84937ba3-4110-4c3b-83b7-ed86ae054938.png"></image>
      </view>
      <view style="color:#666;font-size:16px;margin-top:20px;">电影未上映</view>
      <button full-width="{{false}}" class="self-btn" data-index="1" data-key="current1" bindtap="handleChangeBtn">点击查看后天11月23日场次</button>
    </view>
    <ui-row-list wx:else>
      <view wx:if="{{ filmData.film }}">
        <ui-row class="film" wx:for="{{ filmData.film }}" height="80" border-bottom>
          <ui-col class="film-time" span="2" vertical-align="middle">
            <view class="film-time-start">{{ item.startTime }}</view>
            <view class="film-time-end">{{ item.endTime }}</view>
          </ui-col>
          <ui-col class="film-inner" vertical-align="middle" space-left="10">
            <view class="film-mode ">{{ item.filmMode }}</view>
            <view class="film-hall ">{{ item.filmHall }}</view>
          </ui-col>
          <ui-col class="film-inner1" align="right" vertical-align="middle">
            <view class="film-price ">{{ item.filmPrice }}</view>
            <view class="film-sale ">{{ item.filmSale }}</view>
          </ui-col>
          <ui-col class="film-other" vertical-align="middle" space="10">
            <button>{{ item.filmState }}</button>
          </ui-col>
        </ui-row>
      </view>
    </ui-row-list>

   
      <view class="sample_title">点击tab切换操作内容</view>
      <ui-tabs bounce="{{false}}" data-key="current2" index="{{ current2 }}" bindchange="handleChange" active-tab-style="{{activeTabStyle}}">
          <ui-tab>
            <view>
              <ui-icon type="building" size="26"></ui-icon>
              <view>国内酒店</view>
            </view>
          </ui-tab>
          <ui-tab>
            <view>
              <ui-icon type="guojijiudian" size="26"></ui-icon>
              <view>国际酒店</view>
            </view>
          </ui-tab>
          <ui-tab>
            <view>
              <ui-icon type="jipiao" size="26"></ui-icon>
              <view>机票</view>
            </view>
          </ui-tab>
          <ui-tab>
            <view>
              <ui-icon type="huochepiaoline" size="26"></ui-icon>
              <view>火车票</view>
            </view>
          </ui-tab>
      </ui-tabs>
      <view wx:if="{{isflag === 0}}" class="wineshop-1 wineshop-box">
          <ui-row-list>
            <ui-row class="wineshop" space="20">
              <ui-col>
                <ui-row>
                  <ui-col class="small-title">目的地</ui-col>
                </ui-row>
                <ui-row>
                  <ui-col class="address">搜宝商务中心</ui-col>
                </ui-row>
              </ui-col>
              <ui-col width="15" vertical-align="middle">
                <ui-icon type="arrow-right"></ui-icon>
              </ui-col>
            </ui-row>
            <ui-row class="wineshop" space="20">
              <ui-col>
                <ui-row>
                  <ui-col class="small-title">周四入住</ui-col>
                </ui-row>
                <ui-row>
                  <ui-col class="address">11月23日</ui-col>
                </ui-row>
              </ui-col>
              <ui-col width="50">
                <text class="sub-1">共一晚</text>
              </ui-col>
              <ui-col align="right">
                  <ui-row>
                    <ui-col class="small-title">周五 离店</ui-col>
                  </ui-row>
                  <ui-row>
                    <ui-col class="address">11月24日</ui-col>
                  </ui-row>
                </ui-col>
            </ui-row>
            <ui-row class="wineshop" style="border:0">
              <ui-col style="color:#666;">关键词/酒店/地址</ui-col>
              <ui-col width="15" vertical-align="middle">
                <ui-icon type="arrow-right"></ui-icon>
              </ui-col>
            </ui-row>
          </ui-row-list>
            <view class="wineshop" style="border:0">
              <button>查找酒店</button>
            </view>
      </view>
      <view class="wineshop-1 wineshop-box" wx:if="{{isflag === 1}}">
          <ui-row-list>
          <ui-row class="wineshop" space="20">
            <ui-col>
              <ui-row>
                <ui-col class="small-title">目的地</ui-col>
              </ui-row>
              <ui-row>
                <ui-col class="address">首尔</ui-col>
              </ui-row>
            </ui-col>
            <ui-col width="15" vertical-align="middle">
              <ui-icon type="arrow-right"></ui-icon>
            </ui-col>
          </ui-row>
          <ui-row class="wineshop" space="20">
            <ui-col>
              <ui-row>
                <ui-col class="small-title">周四入住</ui-col>
              </ui-row>
              <ui-row>
                <ui-col class="address">11月25日</ui-col>
              </ui-row>
            </ui-col>
            <ui-col width="50">
              <text class="sub-1">共两晚</text>
            </ui-col>
            <ui-col align="right">
                <ui-row>
                  <ui-col class="small-title">周五 离店</ui-col>
                </ui-row>
                <ui-row>
                  <ui-col class="address">11月27日</ui-col>
                </ui-row>
              </ui-col>
          </ui-row>
          <ui-row class="wineshop" style="border:0">
            <ui-col style="color:#666;">关键词/酒店/地址</ui-col>
            <ui-col width="15" vertical-align="middle">
              <ui-icon type="arrow-right"></ui-icon>
            </ui-col>
          </ui-row>
          </ui-row-list>
          <view class="wineshop" style="border:0">
            <button>查找酒店</button>
          </view>
      </view>
      <view class="wineshop-1 wineshop-box" wx:if="{{isflag === 2}}">
          <ui-row-list>
          <ui-row class="wineshop" space="20">
            <ui-col>
              <ui-row>
                <ui-col class="small-title">出发城市</ui-col>
              </ui-row>
              <ui-row>
                <ui-col class="address">{{currentData.startPlace}}</ui-col>
              </ui-row>
            </ui-col>
            <ui-col align="center" vertical-align="middle" class="con1_center" bindtap="changeAir">                                                        
              <image src="http://images.uileader.com/20180319/64d23e80-7876-44fd-a742-3776b6a11c96.png" class="backbg" style="width:30px;height:30px;transform:rotate({{ratate}})deg" mode="aspectFill"></image>
              <image src="http://images.uileader.com/20180319/5ab25fa0-2a64-4d56-b03f-6e0512c46507.png" class="back" style="width:30px;height:30px;" mode="aspectFill" ></image>
            </ui-col>
            <ui-col align="right">
              <ui-row>
                <ui-col class="small-title">到达城市</ui-col>
              </ui-row>
              <ui-row>
                <ui-col class="address">{{currentData.endPlace}}</ui-col>
              </ui-row>
            </ui-col>
          </ui-row>
          <ui-row class="wineshop" space="20">
            <ui-col>
              <ui-row>
                <ui-col class="small-title">{{currentData.startWek}}出发</ui-col>
              </ui-row>
              <ui-row>
                <ui-col class="address">{{currentData.startTime}}</ui-col>
              </ui-row>
            </ui-col>
            <ui-col width="50">
              <text class="sub-1">共一晚</text>
            </ui-col>
            <ui-col align="right">
                <ui-row>
                  <ui-col class="small-title">返程</ui-col>
                </ui-row>
                <ui-row>
                  <ui-col style="color:#666">可选返程</ui-col>
                </ui-row>
              </ui-col>
          </ui-row>
            <ui-row height="45" class="" style="border:0;margin:0 20px">
            <ui-col width="150" vertical-align="middle" align="left" >
              <text>只看头等舱／商务舱</text>
            </ui-col>
            <ui-col vertical-align="middle" align="right">
              <switch color="#24c471"></switch>
            </ui-col>
          </ui-row>
          </ui-row-list>
          <view class="wineshop" style="border:0">
            <button>查询机票</button>
          </view>
      </view>
      <view class="wineshop-1 wineshop-box" wx:if="{{isflag === 3}}">
          <ui-row-list>
          <ui-row class="wineshop" space="20">
            <ui-col>
              <ui-row>
                <ui-col class="small-title">出发城市</ui-col>
              </ui-row>
              <ui-row>
                <ui-col class="address">{{currentData.startPlace}}</ui-col>
              </ui-row>
            </ui-col>
            <ui-col align="center" vertical-align="middle" class="con1_center" bindtap="changeAir">
              <image src="http://images.uileader.com/20180319/64d23e80-7876-44fd-a742-3776b6a11c96.png" class="backbg" style="width:30px;height:30px;transform': rotate({{ratate}})deg" mode="aspectFill" ></image>
              <image src="http://images.uileader.com/20180319/5ab25fa0-2a64-4d56-b03f-6e0512c46507.png" class="back" style="width:30px;height:30px;" mode="aspectFill" ></image>
            </ui-col>
            <ui-col align="right">
              <ui-row>
                <ui-col class="small-title">到达城市</ui-col>
              </ui-row>
              <ui-row>
                <ui-col class="address">{{currentData.endPlace}}</ui-col>
              </ui-row>
            </ui-col>
          </ui-row>
          <ui-row class="wineshop" space="20">
            <ui-col>
              <ui-row>
                <ui-col style="color:666">出发日期</ui-col>
              </ui-row>
            </ui-col>
            <ui-col align="right">
                <ui-row>
                  <ui-col style="color:#666">11月24日 明天</ui-col>
                </ui-row>
              </ui-col>
          </ui-row>
          <ui-row height="45" class="" style="border:0;margin:0 20px">
            <ui-col width="150" vertical-align="middle" align="left" >
              <text>只看动车／高铁"</text>
            </ui-col>
            <ui-col vertical-align="middle" align="right">
              <switch color="#24c471"></switch>
            </ui-col>
          </ui-row>
          </ui-row-list>
          <view class="wineshop" style="border:0">
            <button>查询火车票</button>
          </view>
      </view>
  </view>
</template>

<style lang="scss" scoped>
.ui-tabs {
  padding-bottom: 1px;
}
.film {
  padding: 5px 10px;
  background: #fff;
  .film-time {
    .film-time-start {
      color:#000;
      font-size:16px;
    }
    .film-time-end {
      color:#888;
      font-size:12px;
    }
  }
  .film-inner {
    .film-mode {
      color: #1f1f1f;
      font-size: 14px;
    }
    .film-hall {
      color:#888;
      font-size:12px;
      text-overflow:ellipsis;
      overflow:hidden;
      white-space:nowrap;
    }
  }
  .film-inner1 {
    overflow:hidden;
    padding-right: 10px;
    .film-price {
      color:#D53937;
      font-size:16px;
    }
    .film-sale {
      color:#888;
      font-size:12px;
    }
  }
  .film-other {
    button {
      background:#f22;
      color:#fff;
      line-height: 30px;
      border: 0;
    }
  }
  
}

.wineshop-1{
  .small-title{
    color:#666;
    font-size:12px;
  }
  .address div{
    font-weight: bold;
  }
  .wineshop{
    margin:0 20px;
    padding:10px 0;
    // /* migrated less mixin: .mix-1px(0, 0, 1, 0, #ccc); */
    button{
      background-color:#24c471;
      border:0;
      color:#fff
    }
  }
  .sub-1 div{
    color:#666;
    font-size:12px;
    display:inline;
    padding:3px;
    /* migrated less mixin: .mix-1px(1, 1, 1, 1, #666); */
  }
}

.backbg{
  transition-duration: 1s;
}
.back{
  position: absolute;
  top: 50%;
  left: 50%;
  margin: -15px 0 0 -15px;
}
.imgbox{
  width:150px;
  height:138px;
  margin:0 auto;
  image{
    width:100%;
  }
}
.markicon{
  .ui-text{
    div{
      display: inline;
      font-size:12px;
      padding: 3px
    }
  }
}

.self-btn{
  margin:6px auto;
  width:200px;
  background-color: #fff;
  color:#fbb966
}
</style>
