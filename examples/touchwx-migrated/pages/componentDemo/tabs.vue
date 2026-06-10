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
const activeTabStyle = ref({
  'color': '#e60012'
})
const activeTabStyle2 = ref({
  'color': '#e60012',
  'border-bottom': '1px solid #e60012'
})
const inkBarStyle = ref({
  'border-bottom': '1px solid red',
  'width': '60%',
  'color': 'red'
})
const tabStyle = ref({
  'flex': '0 0 40px'
})
const current1 = ref(0)
const current2 = ref(0)
const current3 = ref(0)
const current4 = ref(0)
const current5 = ref(0)
const current6 = ref(0)
const current7 = ref(0)
const current8 = ref(0)
const current9 = ref(0)
const current11 = ref(0)
const current12 = ref(0)
const showBadge3 = ref(true)
const show8_1 = ref(true)
const show8_2 = ref(false)
const customStyle = ref({
  'background-color': 'red'
})

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'activeTabStyle')) activeTabStyle.value = patch['activeTabStyle']
  if (Object.prototype.hasOwnProperty.call(patch, 'activeTabStyle2')) activeTabStyle2.value = patch['activeTabStyle2']
  if (Object.prototype.hasOwnProperty.call(patch, 'inkBarStyle')) inkBarStyle.value = patch['inkBarStyle']
  if (Object.prototype.hasOwnProperty.call(patch, 'tabStyle')) tabStyle.value = patch['tabStyle']
  if (Object.prototype.hasOwnProperty.call(patch, 'current1')) current1.value = patch['current1']
  if (Object.prototype.hasOwnProperty.call(patch, 'current2')) current2.value = patch['current2']
  if (Object.prototype.hasOwnProperty.call(patch, 'current3')) current3.value = patch['current3']
  if (Object.prototype.hasOwnProperty.call(patch, 'current4')) current4.value = patch['current4']
  if (Object.prototype.hasOwnProperty.call(patch, 'current5')) current5.value = patch['current5']
  if (Object.prototype.hasOwnProperty.call(patch, 'current6')) current6.value = patch['current6']
  if (Object.prototype.hasOwnProperty.call(patch, 'current7')) current7.value = patch['current7']
  if (Object.prototype.hasOwnProperty.call(patch, 'current8')) current8.value = patch['current8']
  if (Object.prototype.hasOwnProperty.call(patch, 'current9')) current9.value = patch['current9']
  if (Object.prototype.hasOwnProperty.call(patch, 'current11')) current11.value = patch['current11']
  if (Object.prototype.hasOwnProperty.call(patch, 'current12')) current12.value = patch['current12']
  if (Object.prototype.hasOwnProperty.call(patch, 'showBadge3')) showBadge3.value = patch['showBadge3']
  if (Object.prototype.hasOwnProperty.call(patch, 'show8_1')) show8_1.value = patch['show8_1']
  if (Object.prototype.hasOwnProperty.call(patch, 'show8_2')) show8_2.value = patch['show8_2']
  if (Object.prototype.hasOwnProperty.call(patch, 'customStyle')) customStyle.value = patch['customStyle']
}

const navigateBack = () => {
  wxSafe.navigateBack();
}

const handleChange1 = (e) => {
  console.log(e, 'handleChange1');
  let index = e.detail.index;
  setData({
    current1: index
  });
}

const handleContentChange1 = (e) => {
  let current = e.detail.current;
  setData({
    current1: current
  });
}

const handleChange2 = (e) => {
  let index = e.detail.index;
  setData({
    current2: index
  });
}

const handleContentChange2 = (e) => {
  let current = e.detail.current;
  setData({
    current2: current
  });
}

const handleChange3 = (e) => {
  let index = e.detail.index;
  setData({
    current3: index
  });
}

const handleContentChange3 = (e) => {
  let current = e.detail.current;
  setData({
    current3: current
  });
}

const handleChange4 = (e) => {
  let index = e.detail.index;
  if (index === 1) {
    setData({
      showBadge3: false
    });
  }
  setData({
    current4: index
  });
}

const handleContentChange4 = (e) => {
  let current = e.detail.current;
  setData({
    current4: current
  });
}

const handleChange5 = (e) => {
  let index = e.detail.index;
  setData({
    current5: index
  });
}

const handleContentChange5 = (e) => {
  let current = e.detail.current;
  setData({
    current5: current
  });
}

const handleChange6 = (e) => {
  let index = e.detail.index;
  setData({
    current6: index
  });
}

const handleContentChange6 = (e) => {
  let current = e.detail.current;
  setData({
    current6: current
  });
}

const handleChange7 = (e) => {
  let btnIndex = e.target.dataset.index;
  let index = e.detail.index;
  current7.value = index;
  setData({
    current7: current7.value
  });
  setData({
    current7: current7.value
  });
}

const handleChangeBtn7 = (e) => {
  let btnIndex = e.target.dataset.index;
  current7.value = btnIndex;
  setData({
    current7: current7.value
  });
}

const handleContentChange7 = (e) => {
  let current = e.detail.current;
  setData({
    current7: current
  });
}

const handleChange8 = (e) => {
  let index = e.detail.index;
  if (index) {
    setData({
      show8_1: false,
      show8_2: true
    });
  } else {
    setData({
      show8_1: true,
      show8_2: false
    });
  }
}

const handleChange9 = (e) => {
  let index = e.detail.index;
  setData({
    current9: index
  });
}

const handleContentChange9 = (e) => {
  let current = e.detail.current;
  current9.value = current;
  setData({
    current9: current9.value
  });
}

const handleChange11 = (e) => {
  let index = e.detail.index;
  setData({
    current11: index
  });
}

const handleContentChange11 = (e) => {
  let current = e.detail.current;
  setData({
    current11: current
  });
}

const hideBadge3 = () => {
  setData({
    showBadge3: false
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
            <view>自定义tabs样式</view>
          </ui-col>
          <ui-col vertical-align="middle" align="center" width="60"></ui-col>
        </ui-row>
      </ui-nav-bar>
    <view style="height:{{NAV_HEIGHT}}"></view>
    <ui-divider>基本使用</ui-divider>
    <ui-tabs index="{{ current1 }}" probe="1" bindchange="handleChange1">
      <ui-tab>选项卡一</ui-tab>
      <ui-tab>选项卡二</ui-tab>
    </ui-tabs>
    <swiper class="content" current="{{ current1 }}"  bindchange="handleContentChange1">
      <swiper-item>
        <view>内容 1</view>
      </swiper-item>
      <swiper-item>
        <view>内容 2</view>
      </swiper-item>
    </swiper>


    <ui-divider>ink-bar</ui-divider>
    <ui-tabs index="{{ current2 }}" probe="1" bindchange="handleChange2" ink-bar active-tab-style="{{activeTabStyle}}" ink-bar-style="{{inkBarStyle}}">
      <ui-tab>选项卡一</ui-tab>
      <ui-tab>选项卡二</ui-tab>
      <ui-tab>选项卡三</ui-tab>
      <ui-tab>选项卡四</ui-tab>
    </ui-tabs>

    <swiper class="content"  current="{{ current2 }}" bindchange="handleContentChange2">
      <swiper-item>
        内容一
      </swiper-item>
      <swiper-item>
        内容二
      </swiper-item>
      <swiper-item>
        内容三
      </swiper-item>
      <swiper-item>
        内容四
      </swiper-item>
    </swiper>



    <ui-divider>居中显示</ui-divider>
    <view style="background-color:#f5f5f5">
      <view style="width:120px;margin:0 auto">
        <ui-tabs  width="120" probe="1" tab-style="{{tabStyle}}" auto-width="{{false}}" index="{{ current3 }}"  bindchange="handleChange3">
          <ui-tab>
            <view class="item item-right">精选</view>
          </ui-tab>
          <ui-tab>
            <view class="item item-left">订阅</view>
          </ui-tab>
        </ui-tabs>
      </view>
    </view>
    <swiper class="content" current="{{ current3 }}" bindchange="handleContentChange3">
      <swiper-item>
        内容一
      </swiper-item>
      <swiper-item>
        内容二
      </swiper-item>
    </swiper>

    <ui-divider>结合角标使用</ui-divider>
    <view style="background-color:#f5f5f5">
    <view style="width:120px;margin:0 auto">
      <ui-tabs width="120" probe="1" tab-style="{{tabStyle}}" auto-width="{{false}}" index="{{ current4 }}"  bindchange="handleChange4">
      <ui-tab>
        <view class="item item-right">精选</view>
      </ui-tab>
      <ui-tab>
        <view class="item item-left">
          订阅
          <ui-badge custom-style="padding: 3px;top:-5px" wx:if="{{showBadge3}}"></ui-badge>
        </view>
        </ui-tab>
      </ui-tabs>
    </view>
    </view>
    

    <swiper class="content" current="{{ current4 }}" bindchange="handleContentChange4">
      <swiper-item>
        内容一
      </swiper-item>
      <swiper-item>
        内容二
      </swiper-item>
    </swiper>

    <ui-divider>与图标结合使用：图标在左</ui-divider>
    <ui-tabs class="type-icon" probe="1" index="{{ current5 }}"  bindchange="handleChange5">
      <ui-tab>
        <view>
          <ui-icon type="mail"></ui-icon>邮件
        </view>
      </ui-tab>
      <ui-tab>
        <view>
          <ui-icon type="api-data"></ui-icon>存储
        </view>
      </ui-tab>
      <ui-tab>
        <view>
          <ui-icon type="api-network"></ui-icon>网络
        </view>
      </ui-tab>
    </ui-tabs>

    <swiper class="content" current="{{ current5 }}" bindchange="handleContentChange5">
      <swiper-item>
        内容一
      </swiper-item>
      <swiper-item>
        内容二
      </swiper-item>
      <swiper-item>
        内容三
      </swiper-item>
    </swiper>

    <ui-divider>与图标结合使用：图标在右</ui-divider>
    <ui-tabs class="type-icon" probe="1" index="{{ current6 }}"  bindchange="handleChange6">
      <ui-tab>
        <view>
          邮件<ui-icon type="mail"></ui-icon>
        </view>
      </ui-tab>
      <ui-tab>
        <view>
          存储<ui-icon type="api-data"></ui-icon>
        </view>
      </ui-tab>
      <ui-tab>
        <view>
          网络<ui-icon type="api-network"></ui-icon>
        </view>
      </ui-tab>
    </ui-tabs>

    <swiper class="content" current="{{ current6 }}" bindchange="handleContentChange6">
      <swiper-item>
        内容一
      </swiper-item>
      <swiper-item>
        内容二
      </swiper-item>
      <swiper-item>
        内容三
      </swiper-item>
    </swiper>

    <ui-divider>外部触发切换</ui-divider>
    <ui-tabs index="{{ current7 }}"  bindchange="handleChange7">
      <ui-tab>选项卡一</ui-tab>
      <ui-tab>选项卡二</ui-tab>
    </ui-tabs>

    <swiper class="content" current="{{ current7 }}" bindchange="handleContentChange7">
      <swiper-item>
        <button type="primary" data-index="1" bindtap="handleChangeBtn7">切换到第二项</button>
      </swiper-item>
      <swiper-item>
        内容二
      </swiper-item>
    </swiper>

    <ui-divider>只支持点击标签切换</ui-divider>
    <ui-tabs index="{{ current8 }}" probe="1"  bindchange="handleChange8">
      <ui-tab>选项卡一</ui-tab>
      <ui-tab>选项卡二</ui-tab>
    </ui-tabs>
    <view class="swiper_content" wx:if="{{ show8_1 }}">选项卡一</view>
    <view class="swiper_content" wx:if="{{ show8_2 }}">选项卡二</view>


    <ui-divider>自定义颜色</ui-divider>
    <ui-tabs class="type-color" index="{{ current9 }}" probe="1"  bindchange="handleChange9" active-tab-style="{{activeTabStyle2}}">
      <ui-tab>选项卡一</ui-tab>
      <ui-tab>选项卡二</ui-tab>
    </ui-tabs>

    <swiper class="content" current="{{ current9 }}" bindchange="handleContentChange9">
      <swiper-item>
        内容一
      </swiper-item>
      <swiper-item>
        内容二
      </swiper-item>
    </swiper>



    <ui-divider>超出屏幕宽度</ui-divider>
    <ui-tabs index="{{ current11 }}" probe="1" bounce="{{false}}"  bindchange="handleChange11">
      <ui-tab>选项卡一</ui-tab>
      <ui-tab>选项卡二</ui-tab>
      <ui-tab>选项卡三</ui-tab>
      <ui-tab>选项卡四</ui-tab>
      <ui-tab>选项卡五</ui-tab>
      <ui-tab>选项卡六</ui-tab>
      <ui-tab>选项卡七</ui-tab>
      <ui-tab>选项卡八</ui-tab>
    </ui-tabs>

    <swiper class="content" current="{{ current11 }}" bindchange="handleContentChange11">
      <swiper-item>
        内容一
      </swiper-item>
      <swiper-item>
        内容二
      </swiper-item>
      <swiper-item>
        内容三
      </swiper-item>
      <swiper-item>
        内容四
      </swiper-item>
      <swiper-item>
        内容五
      </swiper-item>
      <swiper-item>
        内容六
      </swiper-item>
      <swiper-item>
        内容七
      </swiper-item>
      <swiper-item>
        内容八
      </swiper-item>
    </swiper>
  </view>
</template>

<style lang="scss" scoped>
ui-tabs{
  background-color: #f5f5f5;
  padding-bottom: 1px;
}
.content {
  height: 60px;
  line-height: 60px;
  margin:0 10px
}
</style>
