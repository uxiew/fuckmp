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
const show = ref(false)
const show1 = ref(false)
const show2 = ref(false)
const show3 = ref(false)
const show4 = ref(false)
const show5 = ref(false)
const show6 = ref(false)
const show7 = ref(false)
const show8 = ref(false)
const tagsWidth = ref(0)
const poptpTop = ref(0)
const maskStyle1 = ref({
  'background-color': 'transparent'
})
const maskStyle2 = ref({
  'top': '198px'
})
const list00 = ref([{
  text: '全部活动',
  tagStyle: tagStyle,
  tagSelectedStyle: selectStyle,
  checked: true
}, {
  text: '电脑办公',
  tagStyle: tagStyle,
  tagSelectedStyle: selectStyle,
  checked: false
}, {
  text: '精选活动',
  tagStyle: tagStyle,
  tagSelectedStyle: selectStyle,
  checked: false
}, {
  text: '个护美妆',
  tagStyle: tagStyle,
  tagSelectedStyle: selectStyle,
  checked: false
}, {
  text: '家用电器',
  tagStyle: tagStyle,
  tagSelectedStyle: selectStyle,
  checked: false
}, {
  text: '酒水饮料',
  tagStyle: tagStyle,
  tagSelectedStyle: selectStyle,
  checked: false
}, {
  text: '日用百货',
  tagStyle: tagStyle,
  tagSelectedStyle: selectStyle,
  checked: false
}, {
  text: '流行服饰',
  tagStyle: tagStyle,
  tagSelectedStyle: selectStyle,
  checked: false
}, {
  text: '鞋靴箱包',
  tagStyle: tagStyle,
  tagSelectedStyle: selectStyle,
  checked: false
}, {
  text: '手机数码',
  tagStyle: tagStyle,
  tagSelectedStyle: selectStyle,
  checked: false
}, {
  text: '钟表珠宝',
  tagStyle: tagStyle,
  tagSelectedStyle: selectStyle,
  checked: false
}])

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'show')) show.value = patch['show']
  if (Object.prototype.hasOwnProperty.call(patch, 'show1')) show1.value = patch['show1']
  if (Object.prototype.hasOwnProperty.call(patch, 'show2')) show2.value = patch['show2']
  if (Object.prototype.hasOwnProperty.call(patch, 'show3')) show3.value = patch['show3']
  if (Object.prototype.hasOwnProperty.call(patch, 'show4')) show4.value = patch['show4']
  if (Object.prototype.hasOwnProperty.call(patch, 'show5')) show5.value = patch['show5']
  if (Object.prototype.hasOwnProperty.call(patch, 'show6')) show6.value = patch['show6']
  if (Object.prototype.hasOwnProperty.call(patch, 'show7')) show7.value = patch['show7']
  if (Object.prototype.hasOwnProperty.call(patch, 'show8')) show8.value = patch['show8']
  if (Object.prototype.hasOwnProperty.call(patch, 'tagsWidth')) tagsWidth.value = patch['tagsWidth']
  if (Object.prototype.hasOwnProperty.call(patch, 'poptpTop')) poptpTop.value = patch['poptpTop']
  if (Object.prototype.hasOwnProperty.call(patch, 'maskStyle1')) maskStyle1.value = patch['maskStyle1']
  if (Object.prototype.hasOwnProperty.call(patch, 'maskStyle2')) maskStyle2.value = patch['maskStyle2']
  if (Object.prototype.hasOwnProperty.call(patch, 'list00')) list00.value = patch['list00']
}

const navigateBack = () => {
  wxSafe.navigateBack();
}

const log = (str) => {
  if (str === 'hide') {
    show1.value = false;
  }
}

const handleShow2 = () => {
  setData({
    show2: false
  });
}

const bindinit = (e) => {
  console.log('bindinit');
}

const bindshow = () => {
  console.log('bindshow');
}

const handleShow3 = () => {
  setData({
    show3: false
  });
}

const handleShow4 = () => {
  setData({
    show4: false
  });
}

const handleShow5 = () => {
  setData({
    show5: false
  });
}

const singleTap = (e) => {
  let opt = e.detail.index;
  wxSafe.showToast({
    title: list00.value[opt].text,
    icon: 'none'
  });
  // show7.value = false
  // show7.value = false
  list00.value.forEach((item, index) => {
    item.checked = index === opt;
  });
  setData({
    show7: false,
    list00: list00.value
  });
}

const openPopup1 = (e) => {
  let show = e.currentTarget.dataset.show;
  setData({
    show1: show
  });
}

const openPopup2 = (e) => {
  let show = e.currentTarget.dataset.show;
  setData({
    show2: show
  });
}

const openPopup3 = (e) => {
  let show = e.currentTarget.dataset.show;
  setData({
    show3: show
  });
}

const openPopup4 = (e) => {
  let show = e.currentTarget.dataset.show;
  setData({
    show4: show
  });
}

const openPopup5 = (e) => {
  let show = e.currentTarget.dataset.show;
  setData({
    show5: show
  });
}

const openPopup6 = (e) => {
  let show = e.currentTarget.dataset.show;
  setData({
    show6: show
  });
}

const openPopup7 = (e) => {
  let show = e.currentTarget.dataset.show;
  setData({
    show7: show
  });
}

const openPopup8 = (e) => {
  let show = e.currentTarget.dataset.show;
  setData({
    show8: show
  });
  setTimeout(() => {
    setData({
      show8: false
    });
  }, 2000);
}

const handleSwitchChange = (e) => {
  setData({
    show1: e.detail.value
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
          <view>popup基本使用</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
          
        </ui-col>
      </ui-row>
    </ui-nav-bar>
    <view style="height:{{NAV_HEIGHT}}"></view>
    <view class="sample_content">
      <button data-show="{{ true }}" bindtap="openPopup1">默认popup（高度由内容决定）</button>
      <button data-show="{{ true }}" bindtap="openPopup8">打开两秒后自动关闭</button>
      <button data-show="{{ true }}" bindtap="openPopup2">自定义高度</button>
      <button data-show="{{ true }}" bindtap="openPopup3">全屏popup</button>
      <button data-show="{{ true }}" bindtap="openPopup4">遮罩透明</button>
      <button data-show="{{ true }}" bindtap="openPopup5">自定义内容区域</button>
      <button data-show="{{ true }}" bindtap="openPopup6">自定义方向（右侧）</button>
      <button data-show="{{ true }}" bindtap="openPopup7">自定义方向（上方）</button>

    </view>

    <ui-popup show="{{show1}}" bindinit="bindinit" bindshow="bindshow">
      <view>
        <ui-row height="40">
          <ui-col vertical-align="middle">开关</ui-col>
          <ui-col vertical-align="middle" align="right">
            <switch checked="{{ show1 }}" bindchange="handleSwitchChange"></switch>
          </ui-col>
        </ui-row>
      </view>
    </ui-popup>

    <ui-popup show="{{ show2 }}" position="bottom" height="300">
      <view style="padding: 15px;">
        <button bindtap="handleShow2" plain type="primary">关闭</button>
        
      </view>
    </ui-popup>

    <ui-popup show="{{ show3 }}" height="100%">
      <view class="popup1">
        <button bindtap="handleShow3" plain type="primary">关闭</button>
      </view>
    </ui-popup>

    <ui-popup show="{{ show4 }}" position="bottom" height="300" mask-style="{{ maskStyle1}}"  hide-on-tap="{{false}}">
      <view class="popup4">
        <button bindtap="handleShow4" plain type="primary">关闭</button>
      </view>
    </ui-popup>

    <ui-popup show="{{ show5 }}" height="270" background="transparent">
      <view class="popup5">
        <ui-row height="40" border-bottom>
          <ui-col vertical-align="middle" space-left="20">动漫APP</ui-col>
          <ui-col width="40" vertical-align="middle" align="center" bindtap="handleShow5">
            <ui-icon type="x" size="18" color="#FC8950"></ui-icon>
          </ui-col>
        </ui-row>
        <view class="title">更新更快、流量超省、内容更全</view>
        <ui-row height="50">
          <ui-col space-left="20" space-right="10" vertical-align="middle">
            <button>继续阅读</button>
          </ui-col>
          <ui-col space-left="10" space-right="20" vertical-align="middle">
            <button type="primary" bindtap="handleShow5">安装享福利</button>
          </ui-col>
        </ui-row>
      </view>
    </ui-popup>

    <ui-popup show="{{ show6 }}" position="right">
      <view style="width:80vw;">
      </view>
    </ui-popup>

    <ui-popup show="{{ show7 }}" position="top" top="{{ poptpTop }}" mask-style="{{ maskStyle2}}">
      <view class="top_pop">
          <ui-tags data="{{list00}}" bindchange="singleTap" col-number="3"  fixed-width
            ></ui-tags>
      </view>
    </ui-popup>

    <ui-popup show="{{ show8 }}" hide-on-tap="{{false}}" >
      <view class="popup2">
        这是一段通知消息！
      </view>
    </ui-popup>

  </view>
</template>

<style lang="scss" scoped>
// popup.less
button {
  margin: 10px;
  height: 36px;
  line-height: 36px;
}
.popup1{
  padding: 40px 20px 0 20px;
}
.popup2{
  height:50px;
  line-height: 50px;
  text-align: center;
  font-size: 14px;
}
.popup4{
  margin-top: 20px;
  background-color:#fff;
  height:250px;
  box-shadow: 0 -12px 28px -12px #e8e8e8;
  padding: 10px;
}
.popup5{
  width: 95%;
  background-color:#fff;
  height:250px;
  margin:0 auto;
  border-radius:5px;
  overflow:hidden;
  .title{
    line-height: 30px;
    padding: 10px 20px;
  }
}

.top_pop{
  padding: 20rpx;
}
</style>
