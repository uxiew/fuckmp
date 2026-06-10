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

const inkBarStyle = ref({
  'border-bottom': '2px solid #fff',
  'width': '50%',
  'top': '-4px'
})
const tabStyle = ref({
  'color': '#fff'
})
const DEFAULT_CONTENT_HEIGHT = ref(0)
const width = ref(0)
const NAV_HEIGHT = ref(0)
const current = ref(0)
const items0 = ref([])
const items1 = ref([])
const items2 = ref([])
const items3 = ref([])
const items4 = ref([])
const items5 = ref([])
const items6 = ref([])
const items7 = ref([])
const items8 = ref([])
const items9 = ref([])
const contentHeight = ref(0)
const tabsWidth = ref(0)
const navBarStyle = ref({
  'background-color': '#39f',
  'color': '#fff'
})

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'inkBarStyle')) inkBarStyle.value = patch['inkBarStyle']
  if (Object.prototype.hasOwnProperty.call(patch, 'tabStyle')) tabStyle.value = patch['tabStyle']
  if (Object.prototype.hasOwnProperty.call(patch, 'DEFAULT_CONTENT_HEIGHT')) DEFAULT_CONTENT_HEIGHT.value = patch['DEFAULT_CONTENT_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'width')) width.value = patch['width']
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'current')) current.value = patch['current']
  if (Object.prototype.hasOwnProperty.call(patch, 'items0')) items0.value = patch['items0']
  if (Object.prototype.hasOwnProperty.call(patch, 'items1')) items1.value = patch['items1']
  if (Object.prototype.hasOwnProperty.call(patch, 'items2')) items2.value = patch['items2']
  if (Object.prototype.hasOwnProperty.call(patch, 'items3')) items3.value = patch['items3']
  if (Object.prototype.hasOwnProperty.call(patch, 'items4')) items4.value = patch['items4']
  if (Object.prototype.hasOwnProperty.call(patch, 'items5')) items5.value = patch['items5']
  if (Object.prototype.hasOwnProperty.call(patch, 'items6')) items6.value = patch['items6']
  if (Object.prototype.hasOwnProperty.call(patch, 'items7')) items7.value = patch['items7']
  if (Object.prototype.hasOwnProperty.call(patch, 'items8')) items8.value = patch['items8']
  if (Object.prototype.hasOwnProperty.call(patch, 'items9')) items9.value = patch['items9']
  if (Object.prototype.hasOwnProperty.call(patch, 'contentHeight')) contentHeight.value = patch['contentHeight']
  if (Object.prototype.hasOwnProperty.call(patch, 'tabsWidth')) tabsWidth.value = patch['tabsWidth']
  if (Object.prototype.hasOwnProperty.call(patch, 'navBarStyle')) navBarStyle.value = patch['navBarStyle']
}

const navigateBack = () => {
  wxSafe.navigateBack();
}

const handleChange = (e) => {
  console.log(e);
  let index = e.detail.index;
  // current.value = index
  // current.value = index
  setData({
    current: index
  });
  // this[key] = index
}

const handleContentChange = (e) => {
  // this[key] = index
  console.log(e);
  let index = e.detail.current;
  setData({
    current: index
  });
}

onReady(() => {
  let items0 = [];
  let items1 = [];
  let items2 = [];
  let items3 = [];
  let items4 = [];
  let items5 = [];
  let items6 = [];
  let items7 = [];
  let items8 = [];
  let items9 = [];
  for (let i = 1; i <= 100; i++) {
    items0.push(i + ' - 推荐项目列表');
    items1.push(i + ' - 热点项目列表');
    items2.push(i + ' - 视频项目列表');
    items3.push(i + ' - 问答项目列表');
    items4.push(i + ' - 社会项目列表');
    items5.push(i + ' - 娱乐项目列表');
    items6.push(i + ' - 科技项目列表');
    items7.push(i + ' - 汽车项目列表');
  }
  setData({
    items0: items0,
    items1: items1,
    items2: items2,
    items3: items4,
    items4: items4,
    items5: items5,
    items6: items6,
    items7: items7
  });
})

</script>

<template>
<ui-nav-bar slot="nav-bar" class="nav_bar" custom-style="{{ navBarStyle }}">
      <ui-row height="46">
        <ui-col vertical-align="middle" align="center" width="35" bindtap="navigateBack">
            <ui-icon type="arrow-left" size="16" color="#fff"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle">
          <ui-tabs
          ink-bar
          ink-bar-style="{{ inkBarStyle }}"
          tab-style="{{tabStyle}}"
          width="{{ width-140 }}" index="{{ current }}" bindchange="handleChange">
            <ui-tab>
                  <view class="">推荐</view>
            </ui-tab>
            <ui-tab>
                    <view class="">热点</view>
            </ui-tab>
            <ui-tab>
                    <view class="">视频</view>
            </ui-tab>
            <ui-tab>
                    <view class="">问答</view>
            </ui-tab>
            <ui-tab>
                    <view class="">社会</view>
            </ui-tab>
            <ui-tab>
                    <view class="">娱乐</view>
            </ui-tab>
            <ui-tab>
                    <view class="">科技</view>
            </ui-tab>
            <ui-tab>
                <view class="">汽车</view>
            </ui-tab>
          </ui-tabs>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="100">
          <!-- <ui-icon type="more" size="16" color="#fff"></ui-icon> -->
        </ui-col>
      </ui-row>

    </ui-nav-bar>
    <view style="height:{{NAV_HEIGHT}}"></view>
    <swiper style="height:{{ contentHeight }}px" class="content" current="{{ current }}" bindchange="handleContentChange">
      <swiper-item>
          <scroll-view scroll-y style="height:{{DEFAULT_CONTENT_HEIGHT}}px" class="content_list">
            <view wx:for="{{ items0 }}" class="{{index % 2 == 0 ? 'grey-bg':''}}">
              {{ item }}
            </view></scroll-view>
      </swiper-item>
      <swiper-item>
          <scroll-view scroll-y style="height:{{DEFAULT_CONTENT_HEIGHT}}px" class="content_list">
            <view wx:for="{{ items1 }}" class="{{index % 2 == 0 ? 'grey-bg':''}}">
              {{ item }}
            </view>
          </scroll-view >
      </swiper-item>
      <swiper-item>
          <scroll-view scroll-y style="height:{{DEFAULT_CONTENT_HEIGHT}}px" class="content_list">
            <view wx:for="{{ items2 }}" class="{{index % 2 == 0 ? 'grey-bg':''}}">
              {{ item }}
            </view>
          </scroll-view >
      </swiper-item>
      <swiper-item>
          <scroll-view scroll-y style="height:{{DEFAULT_CONTENT_HEIGHT}}px" class="content_list">
            <view wx:for="{{ items3 }}" class="{{index % 2 == 0 ? 'grey-bg':''}}">
              {{ item }}
            </view>
          </scroll-view >
      </swiper-item>
      <swiper-item>
          <scroll-view scroll-y style="height:{{DEFAULT_CONTENT_HEIGHT}}px" class="content_list">
            <view wx:for="{{ items4 }}" class="{{index % 2 == 0 ? 'grey-bg':''}}">
              {{ item }}
            </view>
          </scroll-view >
      </swiper-item>
      <swiper-item>
          <scroll-view scroll-y style="height:{{DEFAULT_CONTENT_HEIGHT}}px" class="content_list">
            <view wx:for="{{ items5 }}" class="{{index % 2 == 0 ? 'grey-bg':''}}">
              {{ item }}
            </view>
          </scroll-view >
      </swiper-item>
      <swiper-item>
          <scroll-view scroll-y style="height:{{DEFAULT_CONTENT_HEIGHT}}px" class="content_list">
            <view wx:for="{{ items6 }}" class="{{index % 2 == 0 ? 'grey-bg':''}}">
              {{ item }}
            </view>
          </scroll-view >
      </swiper-item>
      <swiper-item>
          <scroll-view scroll-y style="height:{{DEFAULT_CONTENT_HEIGHT}}px" class="content_list">
            <view wx:for="{{ items7 }}" class="{{index % 2 == 0 ? 'grey-bg':''}}">
              {{ item }}
            </view>
          </scroll-view >
      </swiper-item>

    </swiper>
</template>

<style lang="scss" scoped>

</style>
