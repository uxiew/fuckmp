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
<ui-nav-bar slot="nav-bar" custom-style="{{ {borderBottom:'1px solid rgba(231, 231, 231, 0.6)',backgroundColor:'#fff'} }}">
      <ui-row height="46">
        <ui-col vertical-align="middle" align="center" width="60" bindtap="navigateBack">
            <ui-icon type="arrow-left" size="16" color="#333"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="center">
          <view>静态列表组件</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
        </ui-col>
      </ui-row>
    </ui-nav-bar>
      <view style="height:{{NAV_HEIGHT}}"></view>
      <view class="sample_title">无缩进</view>
      <ui-row-list>
        <ui-row height="50">
          <ui-col width="40" vertical-align="middle" align="center">
              <ui-icon type="comment" size="20" color="#545454"></ui-icon>
          </ui-col>
          <ui-col class="text" >
            飞行模式
          </ui-col>
          <ui-col width="40" vertical-align="middle">
            <ui-icon type="arrow-right"></ui-icon>
          </ui-col>
        </ui-row>
        <ui-row height="50">
          <ui-col width="40" vertical-align="middle" align="center">
            <ui-icon type="comment" size="20" color="#545454"></ui-icon>
          </ui-col>
          <ui-col class="text">
            Wi-Fi
          </ui-col>
          <ui-col width="40" vertical-align="middle">
            <ui-icon type="arrow-right"></ui-icon>
          </ui-col>
        </ui-row>
        <ui-row height="50">
          <ui-col width="40" vertical-align="middle" align="center">
            <ui-icon type="comment" size="20" color="#545454"></ui-icon>
          </ui-col>
          <ui-col class="text">
            蓝牙
          </ui-col>
          <ui-col width="40" vertical-align="middle">
            <ui-icon type="arrow-right"></ui-icon>
          </ui-col>
        </ui-row>
        <ui-row height="50">
          <ui-col width="40" vertical-align="middle" align="center">
            <ui-icon type="comment" size="20" color="#545454"></ui-icon>
          </ui-col>
          <ui-col class="text">
            蜂窝移动网络
          </ui-col>
          <ui-col width="40" vertical-align="middle">
            <ui-icon type="arrow-right"></ui-icon>
          </ui-col>
        </ui-row>
        <ui-row height="50">
          <ui-col width="40" vertical-align="middle" align="center">
            <ui-icon type="comment" size="20" color="#545454"></ui-icon>
          </ui-col>
          <ui-col class="text">
            个人热点
          </ui-col>
          <ui-col width="40" vertical-align="middle">
            <ui-icon type="arrow-right"></ui-icon>
          </ui-col>
        </ui-row>
        <ui-row height="50">
          <ui-col width="40" vertical-align="middle" align="center">
            <ui-icon type="comment" size="20" color="#545454"></ui-icon>
          </ui-col>
          <ui-col class="text">
            VPN
          </ui-col>
          <ui-col width="40" vertical-align="middle">
            <ui-icon type="arrow-right"></ui-icon>
          </ui-col>
        </ui-row>
        <ui-row height="50">
          <ui-col width="40" vertical-align="middle" align="center">
            <ui-icon type="comment" size="20" color="#545454"></ui-icon>
          </ui-col>
          <ui-col class="text">
            运营商
          </ui-col>
          <ui-col width="40" vertical-align="middle">
            <ui-icon type="arrow-right"></ui-icon>
          </ui-col>
        </ui-row>
      </ui-row-list>

      <view class="sample_title">底部边线左侧缩进</view>
      <ui-row-list border-left-indent>
        <ui-row height="50">
          <ui-col width="40" vertical-align="middle" align="center">
            <ui-icon type="comment" size="20" color="#545454"></ui-icon>
          </ui-col>
          <ui-col class="text">
            飞行模式
          </ui-col>
          <ui-col width="40" vertical-align="middle">
            <ui-icon type="arrow-right"></ui-icon>
          </ui-col>
        </ui-row>
        <ui-row height="50">
          <ui-col width="40" vertical-align="middle" align="center">
            <ui-icon type="comment" size="20" color="#545454"></ui-icon>
          </ui-col>
          <ui-col class="text">
            Wi-Fi
          </ui-col>
          <ui-col width="40" vertical-align="middle">
            <ui-icon type="arrow-right"></ui-icon>
          </ui-col>
        </ui-row>
        <ui-row height="50">
          <ui-col width="40" vertical-align="middle" align="center">
            <ui-icon type="comment" size="20" color="#545454"></ui-icon>
          </ui-col>
          <ui-col class="text">
            蓝牙
          </ui-col>
          <ui-col width="40" vertical-align="middle">
            <ui-icon type="arrow-right"></ui-icon>
          </ui-col>
        </ui-row>
        <ui-row height="50">
          <ui-col width="40" vertical-align="middle" align="center">
            <ui-icon type="comment" size="20" color="#545454"></ui-icon>
          </ui-col>
          <ui-col class="text">
            蜂窝移动网络
          </ui-col>
          <ui-col width="40" vertical-align="middle">
            <ui-icon type="arrow-right"></ui-icon>
          </ui-col>
        </ui-row>
        <ui-row height="50">
          <ui-col width="40" vertical-align="middle" align="center">
            <ui-icon type="comment" size="20" color="#545454"></ui-icon>
          </ui-col>
          <ui-col class="text">
            个人热点
          </ui-col>
          <ui-col width="40" vertical-align="middle">
            <ui-icon type="arrow-right"></ui-icon>
          </ui-col>
        </ui-row>
        <ui-row height="50">
          <ui-col width="40" vertical-align="middle" align="center">
            <ui-icon type="comment" size="20" color="#545454"></ui-icon>
          </ui-col>
          <ui-col class="text">
            VPN
          </ui-col>
          <ui-col width="40" vertical-align="middle">
            <ui-icon type="arrow-right"></ui-icon>
          </ui-col>
        </ui-row>
        <ui-row height="50">
          <ui-col width="40" vertical-align="middle" align="center">
            <ui-icon type="comment" size="20" color="#545454"></ui-icon>
          </ui-col>
          <ui-col class="text">
            运营商
          </ui-col>
          <ui-col width="40" vertical-align="middle">
            <ui-icon type="arrow-right"></ui-icon>
          </ui-col>
        </ui-row>
      </ui-row-list>

      <view class="sample_title">底部边线两侧缩进</view>
      <ui-row-list border-indent>
        <ui-row height="50">
          <ui-col width="40" vertical-align="middle" align="center">
            <ui-icon type="comment" size="20" color="#545454"></ui-icon>
          </ui-col>
          <ui-col class="text">
            飞行模式
          </ui-col>
          <ui-col width="25" vertical-align="middle">
            <ui-icon type="arrow-right"></ui-icon>
          </ui-col>
        </ui-row>
        <ui-row height="50">
          <ui-col width="40" vertical-align="middle" align="center">
            <ui-icon type="comment" size="20" color="#545454"></ui-icon>
          </ui-col>
          <ui-col class="text">
            Wi-Fi
          </ui-col>
          <ui-col width="25" vertical-align="middle">
            <ui-icon type="arrow-right"></ui-icon>
          </ui-col>
        </ui-row>
        <ui-row height="50">
          <ui-col width="40" vertical-align="middle" align="center">
            <ui-icon type="comment" size="20" color="#545454"></ui-icon>
          </ui-col>
          <ui-col class="text">
            蓝牙
          </ui-col>
          <ui-col width="25" vertical-align="middle">
            <ui-icon type="arrow-right"></ui-icon>
          </ui-col>
        </ui-row>
        <ui-row height="50">
          <ui-col width="40" vertical-align="middle" align="center">
            <ui-icon type="comment" size="20" color="#545454"></ui-icon>
          </ui-col>
          <ui-col class="text">
            蜂窝移动网络
          </ui-col>
          <ui-col width="25" vertical-align="middle">
            <ui-icon type="arrow-right"></ui-icon>
          </ui-col>
        </ui-row>
        <ui-row height="50">
          <ui-col width="40" vertical-align="middle" align="center">
            <ui-icon type="comment" size="20" color="#545454"></ui-icon>
          </ui-col>
          <ui-col class="text">
            个人热点
          </ui-col>
          <ui-col width="25" vertical-align="middle">
            <ui-icon type="arrow-right"></ui-icon>
          </ui-col>
        </ui-row>
        <ui-row height="50">
          <ui-col width="40" vertical-align="middle" align="center">
            <ui-icon type="comment" size="20" color="#545454"></ui-icon>
          </ui-col>
          <ui-col class="text">
            VPN
          </ui-col>
          <ui-col width="25" vertical-align="middle">
            <ui-icon type="arrow-right"></ui-icon>
          </ui-col>
        </ui-row>
        <ui-row height="50">
          <ui-col width="40" vertical-align="middle" align="center">
            <ui-icon type="comment" size="20" color="#545454"></ui-icon>
          </ui-col>
          <ui-col class="text">
            运营商
          </ui-col>
          <ui-col width="25" vertical-align="middle">
            <ui-icon type="arrow-right"></ui-icon>
          </ui-col>
        </ui-row>
      </ui-row-list>
</template>

<style lang="scss" scoped>
// rowList.less

view.title{
  background-color: #f5f5f5;
  font-size: 14px;
  font-weight: bold;
  line-height: 50px;
  padding-left: 20px;
  // view{
  //   font-weight: bold;
  // }
}


.text {
  line-height: 50px;
}
</style>
