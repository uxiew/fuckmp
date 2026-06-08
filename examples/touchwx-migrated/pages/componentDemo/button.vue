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
const isLoading = ref(false)
const buttonText = ref('提交')
const isDisable = ref(false)
const hoverStopPropagation = ref(true)
const array = ref(['美国', '中国', '巴西', '日本'])
const index = ref(0)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'isLoading')) isLoading.value = patch['isLoading']
  if (Object.prototype.hasOwnProperty.call(patch, 'buttonText')) buttonText.value = patch['buttonText']
  if (Object.prototype.hasOwnProperty.call(patch, 'isDisable')) isDisable.value = patch['isDisable']
  if (Object.prototype.hasOwnProperty.call(patch, 'hoverStopPropagation')) hoverStopPropagation.value = patch['hoverStopPropagation']
  if (Object.prototype.hasOwnProperty.call(patch, 'array')) array.value = patch['array']
  if (Object.prototype.hasOwnProperty.call(patch, 'index')) index.value = patch['index']
}

const submitHandler = () => {
  setData({
    isLoading: true,
    buttonText: '提交中...',
    isDisable: true
  });
  // isLoading.value = true
  // buttonText.value = '提交中...'
  // isDisable.value = true
  // isLoading.value = true
  // buttonText.value = '提交中...'
  // isDisable.value = true
  const that = { setData }
  setTimeout(function () {
    // that.isLoading = false
    // that.buttonText = '提交'
    // that.isDisable = false
    that.setData({
      isLoading: false,
      buttonText: '提交',
      isDisable: false
    });
  }, 1000);
}

const handleViewTap = () => {
  wxSafe.showToast({
    title: '点击了ui-view'
  });
}

const bindPickerChange = (e) => {
  console.log('picker发送选择改变，携带值为', e.detail.value);
  setData({
    index: e.detail.value
  });
}

const handleButtonTap = () => {
  wxSafe.showToast({
    title: '点击了ui-button'
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
          <view>按钮</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
          
        </ui-col>
      </ui-row>
    </ui-nav-bar>
    <view style="height:{{NAV_HEIGHT}}"></view>
 
    <view class="sample_title">自定义样式</view>
    <view class="win">
      <button class="button-style-demo1">立即预订</button>
      <button type="primary" loading="{{isLoading}}" bindtap="submitHandler" disabled="{{isDisable}}">{{buttonText}}</button>
    </view>
    
   </view>
</template>

<style lang="scss" scoped>
// button.less
button{
  margin: 6px 0;
}
.mini-button{
  button{
    margin-right:6px;
  }
}
.win{padding:10px;}

.button-style-demo1 {
  background-color: #C01920;
  border-radius: 20px;
  border-color: #C01920;
  box-shadow: 3px 3px 8px #E57A7E;
  color: #fff;
}
.button-style-demo1::after{
  border: none;
}
.button-style-demo2 {
  background-color: #4A88DB;
  color: #fff;
}

.button-style-demo3 {
  background-color: #4A88DB;
  color: #fff;
  img{
    width: 16px;
    height: 16px;
    margin-right: 4px;
    vertical-align: middle;
  }
}

.hover-btn{
  background-color:red;
  border-color:red;
  color:#fff
}

.icon-search{
  font-size:14px;
}
</style>
