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

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
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
          <view>less函数库</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
        </ui-col>
      </ui-row>
    </ui-nav-bar>
    <view style="height:{{NAV_HEIGHT}}"></view>
    <view class="sample_title">上边1像素细线</view>
    <view class="sample_content">
        <view class="title title1"></view>
    </view>

    <view class="sample_title">右边1像素细线</view>
    <view class="sample_content">
        <view class="title title2"></view>
    </view>     

    <view class="sample_title">下边1像素细线</view>
    <view class="sample_content">
        <view class="title title3"></view>
    </view>

    <view class="sample_title">左边1像素细线</view>
    <view class="sample_content">
        <view class="title title4"></view>
    </view>

    <view class="sample_title">上下1像素细线</view>
    <view class="sample_content">
        <view class="title title5"></view>
    </view>

    <view class="sample_title">左右1像素细线</view>
    <view class="sample_content">
        <view class="title title6"></view>
    </view>

    <view class="sample_title">上下左右1像素细线</view>
    <view class="sample_content">
        <view class="title title7"></view>
    </view>

    <view class="sample_title">水平居中</view>
    <view class="sample_content">
        <view class="box box1">TOUCH UI</view>
    </view>

    <view class="sample_title">垂直居中</view>
    <view class="sample_content">
        <view class="box box2">TOUCH UI</view>
    </view>

    <view class="sample_title">水平垂直居中</view>
    <view class="sample_content">
        <view class="box box3">TOUCH UI</view>
    </view>

    <view class="sample_title">文字超出部分出省略号</view>
    <view class="sample_content">
        <view class="over over1">TOUCH UI Platform是移动应用一站式快速开发平台，由移动基础框架、UI组件库、场景模板、IDE集成开发环境、移动端API接口、前后端交互技术等组成。</view>
    </view>

    <!-- <view class="sample_title">多行文本超出显示省略号</view>
    <view class="sample_content">
        <view class="over over2">TOUCH UI Platform是移动应用一站式快速开发平台，由移动基础框架、UI组件库、场景模板、IDE集成开发环境、移动端API接口、前后端交互技术等组成。使用它，你可以完全不需要学习繁杂深奥的移动开发技术，只要会基本的前端知识就能最快2-3天做出精美流畅的APP来。</view>
    </view> -->
  </view>
</template>

<style lang="scss" scoped>
// styleLib.less
.title{
  width: 50px;
  height: 50px;
  background: #F6FAFE;
} 
.title1{
  /* migrated less mixin: .mix-1px(1, 0, 0, 0, #ccc); */
}
.title2{
  /* migrated less mixin: .mix-1px(0, 1, 0, 0, #ccc); */
}
.title3{
  /* migrated less mixin: .mix-1px(0, 0, 1, 0, #ccc); */
}
.title4{
  /* migrated less mixin: .mix-1px(0, 0, 0, 1, #ccc); */
}
.title5{
  /* migrated less mixin: .mix-1px(1, 0, 1, 0, #ccc); */
}
.title6{
  /* migrated less mixin: .mix-1px(0, 1, 0, 1, #ccc); */
}
.title7{
  /* migrated less mixin: .mix-1px(1, 1, 1, 1, #ccc); */
}
.box{
  height: 50px;
  /* migrated less mixin: .mix-1px(1, 1, 1, 1, #ccc); */
}
.box1{
  display: flex; justify-content: center;
}
.box2{
  display: flex; align-items: center;}
.box3{
  display: flex; align-items: center; justify-content: center;}
.over{
  /* migrated less mixin: .mix-1px(1, 1, 1, 1, #ccc); */
  height: 30px;
  &.over1{
    /* migrated less mixin: .mix-text-overflow(); */
  }
  &.over2{
    height: 90px;
    // display: -webkit-box;
    // -webkit-box-orient: vertical;
    // -webkit-line-clamp: 3;
    // overflow: hidden;
    /* migrated less mixin: .ellipsis-line(3); */
  }
}
</style>
