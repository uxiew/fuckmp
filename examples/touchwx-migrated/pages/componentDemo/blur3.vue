<script setup lang="ts">
import { onReady, ref } from 'vue'

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
const STATUS_BAR_HEIGHT = ref(0)
const url = ref('http://images.uileader.com/20180321/9e5ff8b2-d6a1-4a56-ab63-88bcd00560b0.png')
const items = ref([])
const alpha = ref(0)
const className = ref('')

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'STATUS_BAR_HEIGHT')) STATUS_BAR_HEIGHT.value = patch['STATUS_BAR_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'url')) url.value = patch['url']
  if (Object.prototype.hasOwnProperty.call(patch, 'items')) items.value = patch['items']
  if (Object.prototype.hasOwnProperty.call(patch, 'alpha')) alpha.value = patch['alpha']
  if (Object.prototype.hasOwnProperty.call(patch, 'className')) className.value = patch['className']
}

const navigateBack = () => {
  wxSafe.navigateBack();
}

onReady(() => {
  let arr = [];
  for (let i = 1; i <= 5; i++) {
    arr.push(`列表项目${i}`);
  }
  setData({
    items: arr
  });
  console.log(items.value);
})

</script>

<template>
<view>
    <ui-nav-bar slot="nav-bar"  custom-style="{{ {backgroundColor:'rgba(255,255,255,0)',color:'#fff'} }}">
      <ui-row height="46">
        <ui-col vertical-align="middle" align="left" space-left="10"  width="50" bindtap="navigateBack">
          <ui-icon type="arrow-left" size="16" color="#fff"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="center">
          <view class="title">个人中心</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="50" >
        </ui-col>
      </ui-row>
    </ui-nav-bar>

    <view class="content_wrap">
      <ui-blur height="300" url="{{ url }}">
        <view class="top_content">
          <view>
            <image
            src="{{ url }}"
            mode='aspectFill'
            style="width:60px;height:60px"
          ></image>
          </view>
          <view class="name">
            TOUCH UI <ui-icon type="write" size="16" color="#fff"></ui-icon>
          </view>
          <view class="card">
            <view>
              美好生活PASS卡
            </view>
          </view>
        </view>
      </ui-blur>
      <view class="content_list">
        <view wx:for="{{ items }}" class="{{index % 2 == 0 ? 'grey-bg':''}}">
          {{ item }}
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.content_wrap{
  .top_content{
    width: 100%;
    // height: 100%;
    position: absolute;
    bottom:20px;
    view{
      display: flex; align-items: center; justify-content: center;
      color: #fff;
      font-size: 16px;
      image{
        border-radius: 50%;
        border: 2px solid #fff;
      }
      .ui-icon{
        margin-left: 10px;
      }
      &.name{
        padding: 20px 0;
      }
      .ui-view{
        display: inline-block;
        padding: 5px;
        border-radius: 25px;
        border: 1px solid #fff;
      }
      &.card{
        .ui-view{
          font-size: 14px;
        }
      }
    }
  }
}
</style>
