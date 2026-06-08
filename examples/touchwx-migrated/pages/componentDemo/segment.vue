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
const value = ref(1)
const contentshow = ref(1)
const contentshow2 = ref(0)
const tabContent = ref(['内容一', '内容二', '内容三'])
const itemStyle = ref({
  'height': '25px',
  'color': '#333',
  'border-color': '#333',
  'background': 'transparent',
  'line-height': '25px',
  'font-size': '12px',
  'width': '77px'
})
const activeItemStyle = ref({
  'opacity': '1',
  'color': '#fff',
  'background-color': '#333'
})

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'value')) value.value = patch['value']
  if (Object.prototype.hasOwnProperty.call(patch, 'contentshow')) contentshow.value = patch['contentshow']
  if (Object.prototype.hasOwnProperty.call(patch, 'contentshow2')) contentshow2.value = patch['contentshow2']
  if (Object.prototype.hasOwnProperty.call(patch, 'tabContent')) tabContent.value = patch['tabContent']
  if (Object.prototype.hasOwnProperty.call(patch, 'itemStyle')) itemStyle.value = patch['itemStyle']
  if (Object.prototype.hasOwnProperty.call(patch, 'activeItemStyle')) activeItemStyle.value = patch['activeItemStyle']
}

const handleChange = (e) => {
  console.log(e.detail.index);
  let index = e.detail.index;
  wxSafe.showToast({
    title: 'index: ' + index,
    icon: 'none'
  });
}

const navigateBack = () => {
  wxSafe.navigateBack();
}

const changeTab1 = (e) => {
  let index = e.detail.index;
  setData({
    contentshow: index
  });
}

const changeTab2 = (e) => {
  let index = e.detail.index;
  setData({
    contentshow2: index
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
            <view>segment</view>
          </ui-col>
          <ui-col vertical-align="middle" align="center" width="60">
            
          </ui-col>
        </ui-row>
      </ui-nav-bar>
      <view style="height:{{NAV_HEIGHT}}"></view>
      <ui-divider>多个容器切换</ui-divider>
      <ui-segment bindchange="changeTab1" index="{{value}}">
        <ui-segment-item>
          First
        </ui-segment-item>
        <ui-segment-item>
          Second
        </ui-segment-item>
        <ui-segment-item>
          Third
        </ui-segment-item>
      </ui-segment>
      <view class="tabContent" wx:if="{{contentshow === 0}}">
        内容一
      </view>
      <view class="tabContent" wx:if="{{contentshow === 1}}">
        内容二
      </view>
      <view class="tabContent" wx:if="{{contentshow === 2}}">
        内容三
      </view>

      <ui-divider>共用一个容器</ui-divider>
      <ui-segment bindchange="changeTab2">
        <ui-segment-item>
          First
        </ui-segment-item>
        <ui-segment-item>
          Second
        </ui-segment-item>
        <ui-segment-item>
          Third
        </ui-segment-item>
      </ui-segment>
      <view class="tabContent">
        {{tabContent[contentshow2]}}
      </view>
    <ui-divider>基本使用</ui-divider>
    <ui-segment>
      <ui-segment-item>
        First
      </ui-segment-item>
      <ui-segment-item>
        Second
      </ui-segment-item>
      <ui-segment-item>
        Third
      </ui-segment-item>
    </ui-segment>
    <ui-divider>最多5项</ui-divider>
    <ui-segment>
      <ui-segment-item>
        First
      </ui-segment-item>
      <ui-segment-item>
        Second
      </ui-segment-item>
      <ui-segment-item>
        Third
      </ui-segment-item>
      <ui-segment-item>
        Forth
      </ui-segment-item>
      <ui-segment-item>
        Fifth
      </ui-segment-item>
    </ui-segment>
    <ui-divider>change事件</ui-divider>
    <ui-segment bindchange="handleChange">
      <ui-segment-item>
        First
      </ui-segment-item>
      <ui-segment-item>
        Second
      </ui-segment-item>
      <ui-segment-item>
        Third
      </ui-segment-item>
    </ui-segment>
    <ui-divider>自定义样式</ui-divider>
    <ui-segment item-style="{{itemStyle}}" active-item-style="{{activeItemStyle}}">
      <ui-segment-item>
        明细
      </ui-segment-item>
      <ui-segment-item>
        类别报表
      </ui-segment-item>
      <ui-segment-item>
        账户
      </ui-segment-item>
    </ui-segment>
    <ui-divider>和图标一起使用</ui-divider>
    <ui-segment>
      <ui-segment-item>
        <ui-icon type="dingding"></ui-icon>钉钉
      </ui-segment-item>
      <ui-segment-item>
        <ui-icon type="weibo"></ui-icon>微博
      </ui-segment-item>
      <ui-segment-item>
        <ui-icon type="weixin"></ui-icon>微信
      </ui-segment-item>
    </ui-segment>
  </view>
</template>

<style lang="scss" scoped>
// segment.less
ui-segment {
  margin: 1em 0;
}


ui-icon {
  margin-right: 6px;
}

.tabContent{
  margin:10px
}
</style>
