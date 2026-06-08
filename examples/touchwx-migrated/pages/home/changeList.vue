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
const groups = ref([{
  title: '轮播 swiper(官方)',
  items: [{
    title: '自定义样式',
    link: '/pages/componentDemo/swiper'
  }]
}, {
  title: '横向选项卡 tabs',
  items: [{
    title: '自定义样式',
    link: '/pages/componentDemo/tabs'
  }, {
    title: '全局tabs',
    link: '/pages/componentDemo/tabs2'
  }, {
    title: '内容共用一个容器',
    link: '/pages/componentDemo/tabs3'
  }]
}, {
  title: '纵向选项卡 v-tabs',
  items: [{
    title: '内容共用一个容器(商品分类)',
    link: '/pages/componentDemo/vtabs'
  }]
}, {
  title: '分段式选项卡 segment',
  items: [{
    title: '基本使用',
    link: '/pages/componentDemo/segment'
  }, {
    title: '全局segment',
    link: '/pages/componentDemo/segment2'
  }]
}])

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'groups')) groups.value = patch['groups']
}

const navigator = (e) => {
  console.log(e);
  var link = e.currentTarget.dataset.link;
  wxSafe.navigateTo({
    url: link
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
          <view>切换容器类</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
        </ui-col>
      </ui-row>
    </ui-nav-bar>
      <view style="height:{{NAV_HEIGHT}}"></view>
    <view wx:for="{{ groups }}" wx:for-item="group" wx:for-index="groupIndex" class="sample_list">
      <view class="group-title">
        <ui-row >
          <ui-col width="5" align="center" vertical-align="middle">
            <view class="sign"></view>
          </ui-col>
          <ui-col align="left" vertical-align="middle" space-left="10">
            <view >{{ group.title }}</view>
          </ui-col>
        </ui-row>
      </view>

      <ui-row-list border-left-indent bordered>
          <ui-row height="50"  bindtap="navigator" data-link="{{ item.link  }}" wx:for="{{ group.items }}" tap-effect>
            <ui-col>{{ item.title }}</ui-col>
            <ui-col align="right" width="30">
                <ui-icon type="arrow-right" size="18" color="#C5C5C5"></ui-icon>
            </ui-col>
          </ui-row>
      </ui-row-list>
    </view>
  </view>
</template>

<style lang="css" scoped>
.title{
  background-color: #f5f5f5;
  font-size: 14px;
  font-weight: bold;
  line-height: 50px;
  padding-left: 20px;
}

.text {
  line-height: 50px;
}
</style>
