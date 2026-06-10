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

const width = ref(0)
const NAV_HEIGHT = ref(0)
const showMask1 = ref(false)
const showMask2 = ref(false)
const showMask3 = ref(false)
const imgSrc1 = ref('http://images.uileader.com/20180315/da626bbd-4a86-4d5d-9690-00350528d91f.png')
const imgSrc2 = ref('http://images.uileader.com/20180315/da626bbd-4a86-4d5d-9690-00350528d91f.png')
const imgSrc3 = ref('http://images.uileader.com/20180315/f52acb66-d0b2-41fc-be57-30da518e15ec.png')
const customStyle = ref({
  'background': 'rgba(51, 51, 51, 0.9)'
})

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'width')) width.value = patch['width']
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'showMask1')) showMask1.value = patch['showMask1']
  if (Object.prototype.hasOwnProperty.call(patch, 'showMask2')) showMask2.value = patch['showMask2']
  if (Object.prototype.hasOwnProperty.call(patch, 'showMask3')) showMask3.value = patch['showMask3']
  if (Object.prototype.hasOwnProperty.call(patch, 'imgSrc1')) imgSrc1.value = patch['imgSrc1']
  if (Object.prototype.hasOwnProperty.call(patch, 'imgSrc2')) imgSrc2.value = patch['imgSrc2']
  if (Object.prototype.hasOwnProperty.call(patch, 'imgSrc3')) imgSrc3.value = patch['imgSrc3']
  if (Object.prototype.hasOwnProperty.call(patch, 'customStyle')) customStyle.value = patch['customStyle']
}

const navigateBack = () => {
  wxSafe.navigateBack();
}

const handleShowMask1 = (e) => {
  let show = e.currentTarget.dataset.show;
  setData({
    showMask1: show
  });
}

const handleShowMask2 = (e) => {
  let show = e.currentTarget.dataset.show;
  setData({
    showMask2: show
  });
}

const handleShowMask3 = (e) => {
  let show = e.currentTarget.dataset.show;
  setData({
    showMask3: show
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
          <view>弹出式提示</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
          
        </ui-col>
      </ui-row>
    </ui-nav-bar>
      <view style="height:{{NAV_HEIGHT}}"></view>
    <view class="sample_content">
      <button type="primary" data-show="{{ true }}"  bindtap="handleShowMask1">关闭按钮在下方</button>
      <button type="primary" data-show="{{ true }}"  bindtap="handleShowMask2">关闭按钮在右上方</button>
      <button type="primary" data-show="{{ true }}"  bindtap="handleShowMask3">关闭按钮在右上方，有线</button>
    </view>


    <ui-mask show="{{showMask1}}" hide-on-tap="{{false}}" class="mask_wrap" custom-style="{{customStyle}}">
      <view class="photo" style="width:{{width-50}}">
        <image style="width:{{width-50}};height:340px" src="{{imgSrc1}}" ></image>
        <ui-icon type="cancel" data-show="{{ false }}" size="48" bindtap="handleShowMask1"></ui-icon>
      </view>
    </ui-mask>

    <ui-mask show="{{showMask2}}" hide-on-tap="{{false}}" class="mask_wrap" custom-style="{{customStyle}}">
      <view class="photo" style="width:{{width-50}}">
        <ui-icon type="cancel" data-show="{{ false }}" bindtap="handleShowMask2" size="48" class="icon_top"></ui-icon>
        <image style="width:{{width-50}};height:340px" src="{{imgSrc2}}" ></image>
        
      </view>
    </ui-mask>

    <ui-mask show="{{showMask3}}" hide-on-tap="{{false}}" class="mask_wrap" custom-style="{{customStyle}}">
      <view class="photo" style="width:{{width-50}}">
        <view class="top_view">
          <ui-icon type="cancel" data-show="{{ false }}" bindtap="handleShowMask3" size="48" class="icon_top"></ui-icon>
          <view class="top_line"></view>
        </view>
        <image style="width:{{width-50}};height:340px" src="{{imgSrc3}}" ></image>
      </view>
    </ui-mask>
  </view>
</template>

<style lang="scss" scoped>
// maskTip.less

button {
    margin: 10px;
    height: 36px;
    line-height: 36px;
    color: #fff;
  }
.mask_wrap {
  .photo {
    padding: 0;
    position: absolute;
    left: 10%;
    right: 10%;
    top: 50%;
    transform: translateY(-50%);
    image {
      display: block;
      width: 100%;
    }
    .ui-icon {
      display: block;
      text-align: center;
      // transform: translateY(10px);
      font-size: 96rpx;
      color: #fff;
    }
    .icon_top{
      text-align: right;
    }
    .top_view{
      position: relative;
      // border: 1px solid red;
      .top_line{
        position: absolute;
        bottom:0px;
        right: 24px;
        width: 2px;
        height: 15px;
        background-color: #fff;
      }
    }
  }
}
</style>
