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
const contentshow = ref(0)
const items0 = ref([])
const items1 = ref([])
const setShow = ref(false)
const itemStyle = ref({
  'border-color': '#0dc1ae',
  'color': '#0dc1ae',
  'font-size': '14px'
})
const activeItemStyle = ref({
  'color': '#fff',
  'background-color': '#0dc1ae'
})

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'contentshow')) contentshow.value = patch['contentshow']
  if (Object.prototype.hasOwnProperty.call(patch, 'items0')) items0.value = patch['items0']
  if (Object.prototype.hasOwnProperty.call(patch, 'items1')) items1.value = patch['items1']
  if (Object.prototype.hasOwnProperty.call(patch, 'setShow')) setShow.value = patch['setShow']
  if (Object.prototype.hasOwnProperty.call(patch, 'itemStyle')) itemStyle.value = patch['itemStyle']
  if (Object.prototype.hasOwnProperty.call(patch, 'activeItemStyle')) activeItemStyle.value = patch['activeItemStyle']
}

const navigateBack = () => {
  wxSafe.navigateBack();
}

const handleNavRight = () => {
  wxSafe.showActionSheet({
    itemList: ['转账记录', '使用帮助', '延时转账服务'],
    success: index => {
      wxSafe.showToast({
        title: `index: ${index}`
      });
    }
  });
}

const changTab = (e) => {
  let index = e.detail.index;
  setData({
    contentshow: index
  });
  // if (index === 0) {
  //   setShow.value = false
  //   setData({
  //     setShow:false
  //   })
  // } else {
  //   setData({
  //     setShow:true
  //   })
  // }
}

onReady(() => {
  let arr = [];
  let arr2 = [];
  for (let i = 1; i <= 30; i++) {
    arr.push(` - 推荐列表项目${i}`);
  }
  for (let i = 1; i <= 30; i++) {
    arr2.push(` - 热点列表项目${i}`);
  }
  setData({
    items0: arr,
    items1: arr2
  });
})

</script>

<template>
<view>
    <ui-nav-bar slot="nav-bar" class="nav_bar" custom-style="{{ {backgroundColor:'#fff'} }}">
      <ui-row height="46">
        <ui-col vertical-align="middle" align="center" width="60" bindtap="navigateBack">
          <ui-icon type="arrow-left" size="16" color="#0dc1ae"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle">
          <ui-segment bindchange="changTab" item-style="{{itemStyle}}" active-item-style="{{activeItemStyle}}">
            <ui-segment-item>
              好友去哪
            </ui-segment-item>
            <ui-segment-item>
              我的好友
            </ui-segment-item>
          </ui-segment>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="80" >
        </ui-col>
      </ui-row>
    </ui-nav-bar>
    <view style="height:{{NAV_HEIGHT}}"></view>
    <view class="tabContent" wx:if="{{contentshow === 0}}">
      <view class="content_list">
        <view wx:for="{{ items0 }}" class="{{index % 2 == 0 ? 'grey-bg':''}}">
          {{ item }}
        </view>
      </view>
    </view>
    <view class="tabContent" wx:if="{{contentshow === 1}}">
      <view class="content_list">
        <view wx:for="{{ items1 }}" class="{{index % 2 == 0 ? 'grey-bg':''}}">
          {{ item }}
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
// segment2.less
.nav_bar{
  background-color: #fff;
}
.set{
  color:#0dc1ae;
  font-size:14px
}
</style>
