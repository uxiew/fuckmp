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
const list = ref([{
  pos: '上海市',
  content: '已发货'
}, {
  content: '运输中'
}, {
  content: '派件中'
}, {
  pos: '北京市',
  content: '已签收'
}])
const left = ref(0)
const winWidth = ref(0)
const color = ref('')
const thisIndex = ref(0)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'list')) list.value = patch['list']
  if (Object.prototype.hasOwnProperty.call(patch, 'left')) left.value = patch['left']
  if (Object.prototype.hasOwnProperty.call(patch, 'winWidth')) winWidth.value = patch['winWidth']
  if (Object.prototype.hasOwnProperty.call(patch, 'color')) color.value = patch['color']
  if (Object.prototype.hasOwnProperty.call(patch, 'thisIndex')) thisIndex.value = patch['thisIndex']
}

const Next = () => {
  console.log('next');
  if (thisIndex.value !== list.value.length - 1) {
    thisIndex.value++;
    setData({
      thisIndex: thisIndex.value++
    });
  } else {
    thisIndex.value = 0;
    setData({
      thisIndex: 0
    });
  }
}

const Previous = () => {
  if (thisIndex.value !== 0) {
    thisIndex.value--;
    setData({
      thisIndex: thisIndex.value--
    });
  } else {
    thisIndex.value = list.value.length - 1;
    setData({
      thisIndex: list.value.length - 1
    });
  }
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
          <view>横向时间轴</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
        </ui-col>
      </ui-row>
    </ui-nav-bar>
    <view style="height:{{NAV_HEIGHT}}"></view>
    <view class="timeline-demo2">
    <view style="padding: 60px 20px">
        <ui-timeline mode="row">
          <ui-timeline-item wx:for="{{list}}" 
            point-color="{{index <= thisIndex ? '#3399ff' : '#8a8a8a'}}" 
            line-color="{{index<thisIndex?'#3399ff':''}}"
            shadow="{{index === thisIndex ? true : false}}"
            show-line="{{index === list.length-1 ? false : true}}">
            <view class="continer">  
              <!-- <view class="gary" style="{{'color': index === thisIndex ? '#3399ff' : '#8a8a8a'}}">{{item.content}}</view> -->
              <view class="gary" style="color: {{index === thisIndex ? '#3399ff' : '#8a8a8a'}}">{{item.content}}</view>
              <view class="pos">{{item.pos}}</view>
            </view>
          </ui-timeline-item>
        </ui-timeline>
      </view>
    </view>
    <view style="padding: 0 50px; ">
      <button bindtap="Previous">上一步</button>
      <button bindtap="Next">下一步</button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
// timeline2.less
.timeline-demo2 {
  .continer {
    width: 72px;
    position: relative;
    top: 4px;
    height: 60px;
    .pos {
      margin-top: 20px;
      color: #333;
      font-size: 10px;
    }
    .gary {
      color: #8a8a8a;
      font-size: 10px;
    }
  }
}
button{
  margin:10px;
}
</style>
