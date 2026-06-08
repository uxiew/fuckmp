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
const list = ref([])
const left = ref(0)
const winWidth = ref(0)
const color = ref('')

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'list')) list.value = patch['list']
  if (Object.prototype.hasOwnProperty.call(patch, 'left')) left.value = patch['left']
  if (Object.prototype.hasOwnProperty.call(patch, 'winWidth')) winWidth.value = patch['winWidth']
  if (Object.prototype.hasOwnProperty.call(patch, 'color')) color.value = patch['color']
}

onReady(() => {
  list.value.splice(0, 0, {
    time: '今天 05-14',
    content: '0.28'
  }, {
    time: '周一 05-15',
    content: '0.52'
  }, {
    time: '周二 05-16',
    content: '待领取'
  }, {
    time: '周三 05-17',
    content: '支付后获得'
  }, {
    time: '周四 05-18',
    content: '支付后获得'
  }, {
    time: '周五 / 周六',
    content: '已累积'
  });
  setData({
    list: list.value
  });
})

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
          <view>竖向时间轴</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
        </ui-col>
      </ui-row>
    </ui-nav-bar>
      <view style="height:{{NAV_HEIGHT}}"></view>
    <view class="wrap">
      <ui-timeline style="width:100%">
        <ui-timeline-item 
          wx:for="{{list}}"  
          wx:key="index" 
          point-color="{{index <= 2 ? '#3399ff' : '#8a8a8a'}}"  
          line-color="{{index<=1?'#3399ff':''}}"
          show-line="{{index === (list.length - 1) ? false : true}}"
          shadow="{{index === 2 ? true : false}}"
          >
        <ui-row class="zindex">
          <ui-col span=12 class="continer">
            <ui-row class="list" height="24">
            <ui-col span=6 class="item" style="color:#AAAAAA;" :style="{'color': index === 2 ? '#3399ff' : '#AAAAAA','font-weight':index === 2 ? 600 : ''}">{{item.time}}
              </ui-col>
            <ui-col span=6 class="item" style="text-align: left">{{item.content}} </ui-col>
            </ui-row>
          </ui-col>
        </ui-row>
        </ui-timeline-item>
      </ui-timeline>
    </view>
  </view>
</template>

<style lang="scss" scoped>
// timeline.less
.wrap{
  display: flex;
  justify-content: center;
  background: #ffffff;
  border-radius: 4px;
  width: 80%;
  margin: 80px auto;

  .continer{
    padding: 42px;
    position: relative;
    .list{
      position: absolute;
      top: -5px;
      width: 100%;
      left: 40px;
      .item{
        font-size: 15px;
      }
    }
  }

}
</style>
