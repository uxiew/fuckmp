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
  title: '地图数据服务SDK',
  items: [{
    title: '周围兴趣点',
    link: '/pages/componentDemo/mapsdk/interestPointAroud'
  }, {
    title: '搜索位置并查看',
    link: '/pages/componentDemo/mapsdk/mapSearchTips'
  }, {
    title: '计算距离',
    link: '/pages/componentDemo/mapsdk/distanceCalculation'
  }, {
    title: '路线选择与规划',
    link: '/pages/componentDemo/mapsdk/routePlanning'
  }, {
    title: '绘制静态图',
    link: '/pages/componentDemo/mapsdk/drawStaticMap'
  }, {
    title: '地址逆解析',
    link: '/pages/componentDemo/mapsdk/mapComprehensive'
  }, {
    title: '获取粗略与精确定位',
    link: '/pages/componentDemo/mapService/mapSearchInput'
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
          <view>地图</view>
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
