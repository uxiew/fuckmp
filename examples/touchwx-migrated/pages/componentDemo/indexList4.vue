<script setup lang="ts">
import { onLoad, ref } from 'vue'

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

const conHeight = ref(0)
const NAV_HEIGHT = ref(0)
const list = ref([])

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'conHeight')) conHeight.value = patch['conHeight']
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'list')) list.value = patch['list']
}

onLoad(() => {
  let obj = JSON.parse(mydata.result);
  console.log(obj);
  let objIndex = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  objIndex.forEach((item, index) => {
    if (obj[item].length > 0) {
      let content = {
        index: item,
        items: obj[item]
      };
      list.value.push(content);
    }
  });
  console.log(list.value, '123');
  setData({
    list: list.value
  });
})

const tapHandler = (msg) => {
  var pages = getCurrentPages();
  var currPage = pages[pages.length - 1]; //当前页面
  //当前页面
  var prevPage = pages[pages.length - 2];
  prevPage.setData({
    currency: msg.detail.name
  });
  wxSafe.navigateBack();
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
          <view>自定义数据格式</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
          
        </ui-col>
      </ui-row>
    </ui-nav-bar>
    <view style="height:{{NAV_HEIGHT}}"></view>
    <ui-index-list bindcustomtap="tapHandler" data="{{list}}" height="{{conHeight}}">
    </ui-index-list>
  </view>
</template>

<style lang="css" scoped>

</style>
