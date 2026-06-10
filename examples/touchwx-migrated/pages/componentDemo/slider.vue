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

const width = ref(0)
const NAV_HEIGHT = ref(0)
const show = ref(false)
const value1 = ref(0)
const value2 = ref([3, 12])
const value3 = ref(0)
const bufferValue = ref(0)
const interval = ref(null)
const formatval = ref(null)
const value4 = ref(0)
const max4 = ref(100)
const formatvalue4 = ref(null)
const formatmax4 = ref(null)
const value5 = ref(1)
const max5 = ref(202)
const formatvalue5 = ref(null)
const formatmax5 = ref(null)
const value6 = ref([100, 500])
const value7 = ref(0)
const tooltipStyle = ref({
  'top': '-27px'
})
const tbObj1 = ref({
  'position': 'absolute',
  'width': '10px',
  'height': '10px',
  'background-color': '#3399FF',
  'border': '0',
  'border-radius': '5px',
  'top': '9px',
  'left': '15px',
  'z-index': '2',
  'box-shadow': '0px 0px 0px'
})
const tbdObj2 = ref({
  'width': '20px',
  'height': '20px',
  'background-color': '#3399FF',
  'border-radius': '10px',
  'top': '4px',
  'left': '10px'
})
const tbObj2 = ref({
  'top': '15px',
  'left': '7px',
  'border': '0',
  'width': '15px',
  'height': '20px',
  'border-radius': '0',
  'background-size': '100%',
  'box-shadow': '0px 0px 0px',
  'transform': 'rotate(180deg)',
  'background': 'url(http://images.uileader.com/20180316/e3471aa5-0ca8-413e-a1e7-86bb10dc2533.svg) no-repeat'
})
const tooltipObj = ref({
  'font-size': '10px',
  'background-color': '#3399FF',
  'color': 'white',
  'text-align': 'center',
  'width': '28px',
  'height': '16px',
  'line-height': '16px',
  'border-radius': '4px',
  'top': '-7px',
  'left': '0'
})
const tooltipObj2 = ref({
  'font-size': '10px',
  'background-color': '#ed5565',
  'color': 'white',
  'text-align': 'center',
  'white-space': 'nowrap',
  'width': '50px',
  'height': '18px',
  'line-height': '18px',
  'border-radius': '4px',
  'top': '-15px',
  'left': '-10px'
})
const tbObj3 = ref({
  'position': 'absolute!important',
  'width': '4px',
  'height': '18px',
  'left': '12.5px',
  'top': '6px',
  'background-color': '#ed5565',
  'border-radius': '2px',
  'border': '0',
  'box-shadow': '0px 0px 0px',
  'z-index': '2'
})
const tbObj4 = ref({
  'background-image': 'url(http://images.uileader.com/20180417/7bec98d5-4efa-424a-b294-e416da6159bd.png)',
  'background-position': '50% 50%',
  'background-repeat': 'no-repeat',
  'background-color': '#fff',
  'border': '1px solid #ececec',
  'width': '38px',
  'height': '38px',
  'left': '-5px',
  "top": '-6px'
})
const tbdObj3 = ref({
  'box-shadow': '0px 0px 0px 10px rgba(255,112,0, 0.5)'
})
const tbObj5 = ref({
  'box-sizing': 'unset',
  'width': '10px',
  'height': '10px',
  'top': '10px!important',
  'left': '15px!important',
  'box-shadow': '0px 0px 0px 5px rgba(255,112,0, 0.5)',
  'background-color': 'rgba(255,112,0, 1)'
})
const tbObj6 = ref({
  'background-image': 'url(http://images.uileader.com/20180417/7bec98d5-4efa-424a-b294-e416da6159bd.png)',
  'background-position': '50% 50%',
  'background-repeat': 'no-repeat',
  'background-color': '#fff',
  'border': '1px solid #ececec',
  'width': '38px',
  'height': '26px',
  'top': '4px',
  'left': '-6px',
  'border-radius': '5px'
})

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'width')) width.value = patch['width']
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'show')) show.value = patch['show']
  if (Object.prototype.hasOwnProperty.call(patch, 'value1')) value1.value = patch['value1']
  if (Object.prototype.hasOwnProperty.call(patch, 'value2')) value2.value = patch['value2']
  if (Object.prototype.hasOwnProperty.call(patch, 'value3')) value3.value = patch['value3']
  if (Object.prototype.hasOwnProperty.call(patch, 'bufferValue')) bufferValue.value = patch['bufferValue']
  if (Object.prototype.hasOwnProperty.call(patch, 'interval')) interval.value = patch['interval']
  if (Object.prototype.hasOwnProperty.call(patch, 'formatval')) formatval.value = patch['formatval']
  if (Object.prototype.hasOwnProperty.call(patch, 'value4')) value4.value = patch['value4']
  if (Object.prototype.hasOwnProperty.call(patch, 'max4')) max4.value = patch['max4']
  if (Object.prototype.hasOwnProperty.call(patch, 'formatvalue4')) formatvalue4.value = patch['formatvalue4']
  if (Object.prototype.hasOwnProperty.call(patch, 'formatmax4')) formatmax4.value = patch['formatmax4']
  if (Object.prototype.hasOwnProperty.call(patch, 'value5')) value5.value = patch['value5']
  if (Object.prototype.hasOwnProperty.call(patch, 'max5')) max5.value = patch['max5']
  if (Object.prototype.hasOwnProperty.call(patch, 'formatvalue5')) formatvalue5.value = patch['formatvalue5']
  if (Object.prototype.hasOwnProperty.call(patch, 'formatmax5')) formatmax5.value = patch['formatmax5']
  if (Object.prototype.hasOwnProperty.call(patch, 'value6')) value6.value = patch['value6']
  if (Object.prototype.hasOwnProperty.call(patch, 'value7')) value7.value = patch['value7']
  if (Object.prototype.hasOwnProperty.call(patch, 'tooltipStyle')) tooltipStyle.value = patch['tooltipStyle']
  if (Object.prototype.hasOwnProperty.call(patch, 'tbObj1')) tbObj1.value = patch['tbObj1']
  if (Object.prototype.hasOwnProperty.call(patch, 'tbdObj2')) tbdObj2.value = patch['tbdObj2']
  if (Object.prototype.hasOwnProperty.call(patch, 'tbObj2')) tbObj2.value = patch['tbObj2']
  if (Object.prototype.hasOwnProperty.call(patch, 'tooltipObj')) tooltipObj.value = patch['tooltipObj']
  if (Object.prototype.hasOwnProperty.call(patch, 'tooltipObj2')) tooltipObj2.value = patch['tooltipObj2']
  if (Object.prototype.hasOwnProperty.call(patch, 'tbObj3')) tbObj3.value = patch['tbObj3']
  if (Object.prototype.hasOwnProperty.call(patch, 'tbObj4')) tbObj4.value = patch['tbObj4']
  if (Object.prototype.hasOwnProperty.call(patch, 'tbdObj3')) tbdObj3.value = patch['tbdObj3']
  if (Object.prototype.hasOwnProperty.call(patch, 'tbObj5')) tbObj5.value = patch['tbObj5']
  if (Object.prototype.hasOwnProperty.call(patch, 'tbObj6')) tbObj6.value = patch['tbObj6']
}

const navigateBack = () => {
  wxSafe.navigateBack();
}

const handletap = () => {
  setData({
    show: true
  });
}

const hidepopup = () => {
  setData({
    show: false
  });
}

const hotelHandler = (e) => {
  setData({
    value7: e.detail.value
  });
}

const changeValue = () => {
  setData({
    value1: 80
  });
}

const sliderchange = (val) => {
  console.log(val);
  setData({
    value3: val.detail.value
  });
}

const changeBufferValue = () => {
  interval.value = setInterval(() => {
    bufferValue.value += 50;
    setData({
      bufferValue: bufferValue.value
    });
    if (bufferValue.value > 202) {
      // bufferValue.value = 202
      setData({
        bufferValue: 202
      });
      clearInterval(interval.value);
    }
  }, 1000);
}

const getformatval = (num) => {
  return parseInt(num / 60) + ':' + parseInt((num % 60 >= 10 ? '' : '0') + num % 60);
}

const slider4 = (val) => {
  let value = val.detail.value;
  let value2 = getformatval(value);
  setData({
    formatvalue4: value2
  });
}

const slider5 = (val) => {
  let value = val.detail.value;
  setData({
    formatvalue5: getformatval(value)
  });
}

onReady(() => {
  setData({
    formatvalue4: getformatval(value4.value)
  });
  setData({
    formatmax4: getformatval(max4.value)
  });
  setData({
    formatvalue5: getformatval(value4.value)
  });
  setData({
    formatmax5: getformatval(max4.value)
  });
})

</script>

<template>
<view>
    <ui-nav-bar slot="nav-bar" custom-style="{{ {borderBottom:'1px solid rgba(231, 231, 231, 0.6)',backgroundColor:'#fff'} }}">
      <ui-row height="46">
        <ui-col vertical-align="middle" align="center" width="60" bindtap="navigateBack">
            <ui-icon type="arrow-left" size="16" color="#333"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="center">
          <view>slider</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
        </ui-col>
      </ui-row>
    </ui-nav-bar>
    <view style="height:{{NAV_HEIGHT}}"></view>
    <view class="sample_title">基本使用</view>
    <view class="sliderbox">
      <ui-slider width="{{width-50}}" show-value></ui-slider>
    </view>

    <view class="sample_title">设置初始值</view>
    <view class="sliderbox">
      <ui-slider width="{{width-50}}" value="20" show-value></ui-slider>
    </view>

    <view class="sample_title">外部改变值</view>
    <view class="sliderbox">
      <ui-slider
      width="{{width-50}}"
      show-value
      value="{{value1}}"></ui-slider>
      <button bindtap="changeValue">设为80</button>
    </view>

    <view class="sample_title">change事件</view>
    <view class="sliderbox">
      <ui-slider
      show-value
      width="{{width-50}}"
      value="{{value3}}"
      bindchange="sliderchange"></ui-slider>
      <text style="color:red;font-size:18px;font-weight:bold;">{{value3}}</text>
    </view>

    <view class="sample_title">显示当前值和总值</view>
    <view class="sliderbox">
      <ui-slider width="{{width-50}}" show-max-value show-value></ui-slider>
    </view>
    <view class="sample_title">设置上下限</view>
    <view class="sliderbox">
      <ui-slider
      show-max-value
      show-value
      width="{{width-50}}"
       min="100" max="300"></ui-slider>
    </view>

    <view class="sample_title">自定义线的粗细</view>
    <view class="sliderbox">
      <ui-slider  width="{{width-50}}" show-value slider-weight="5"></ui-slider>
    </view>

    <view class="sample_title">自定义线的颜色</view>
    <view class="sliderbox">
      <ui-slider  width="{{width-50}}" show-value value="30"  background-color="#666666" active-color="#7dd43c"></ui-slider>
    </view>

    <view class="sample_title">设置步长</view>
    <view class="sliderbox">
      <ui-slider width="{{width-50}}" show-value  max="1" step="0.1"></ui-slider>
    </view>

    <view class="sample_title">设置刻度</view>
    <view class="sliderbox">
      <ui-slider width="{{width-50}}" scale-line="20" max="100" show-value show-max-value></ui-slider>
    </view>

    <view class="sample_title">双刻度和设置步长</view>
    <view class="sliderbox" style="padding-bottom:35px;">
      <ui-slider
      width="{{width-50}}"
      step="10"
      max="100"
      scale-line="10"
      key-scale-line="20"
      show-max-value show-value
      ></ui-slider>
    </view>

    <view class="sample_title">最大值无上限</view>
    <view class="sliderbox" style="padding-bottom:35px;">
      <ui-slider
      width="{{width-50}}"
      unlimited
      step="100"
      max="500"
      bindchange="hotelHandler"
      key-scale-line="100"
      show-value
      ></ui-slider>
      <view style="margin-top:10px;">当前选择的值为：{{value7}}</view>
    </view>


    <view class="sample_title">显示tooltip</view>
    <view class="sliderbox" style="padding-top:40px;">
      <ui-slider width="{{width-50}}"  show-tooltip></ui-slider>
    </view>

     <view class="sample_title">双滑块</view>
    <view class="sliderbox">
      <ui-slider width="{{width-50}}" value="{{value2}}" show-tooltip min="1" max="15"></ui-slider>
    </view>

    <view class="sample_title">自定义滑块样式</view>
    <view class="sliderbox">
      <ui-slider
      width="{{width-50}}"
      show-max-value
      show-value
      thumb-style="{{ tbObj1 }}" 
      thumb-down-style="{{ tbdObj2 }}"
      ></ui-slider>
    </view>

    <view class="sample_title">自定义滑块图片和自定义Tooltip</view>
    <view class="sliderbox" style="padding-bottom:40px;">
      <ui-slider width="{{width-50}}"  tooltip-style="{{tooltipObj}}" thumb-style="{{tbObj2}}" step="10" show-tooltip  scale-line="10" key-scale-line="20"></ui-slider>
    </view>

    <view class="sample_title">个性样式</view>
    <view class="sliderbox" style="padding-bottom:40px;">
      <ui-slider
        width="{{width-50}}"
        slider-weight="12"
        active-color="#ed5565"
        show-tooltip
        tooltip-style="{{tooltipObj2}}"
        thumb-style="{{tbObj3}}"
        max="5000"
        scale-line="625"
        key-scale-line="1250"
        bar-border-radius='2'>
      </ui-slider>
    </view>

    <view class="sample_title">双滑块自定义样式</view>
    <view style="padding:20px;">
      <ui-row>
        <ui-col width="45">
          <text>公里数</text>
        </ui-col>
        <ui-col>
          <text style="color:#666">单位:（万公里）</text>
        </ui-col>
      </ui-row>
    </view>
    <view class="sliderbox">
      <ui-slider width="{{width-50}}" bar-radius="38" value="{{value2}}" tooltip-style="{{tooltipStyle}}" thumb-style="{{tbObj4}}" active-color="#f85426"  key-scale-line="5" slider-weight="4" show-tooltip min="0" max="15"></ui-slider>
    </view>

    <view class="sample_title">显示值自定义格式</view>
    <view class="sliderbox">
        <ui-row height="60">
          <ui-col width="50" vertical-align="middle" align="right">
            <text>{{formatvalue4}}</text>
          </ui-col>
          <ui-col width="{{width-100}}" vertical-align="middle" >
            <ui-slider thumb-style="{{ tbObj1 }}" 
      thumb-down-style="{{ tbdObj2 }}" value-pos="left" width="{{width-100}}" value="{{value4}}" max="{{max4}}" bindchange="slider4"></ui-slider> 
          </ui-col>
          <ui-col width="50" vertical-align="middle" align="left">
            <text>{{formatmax4}}</text>
          </ui-col>
        </ui-row>
    </view>

    <view class="sample_title">仿腾讯视频进度条和缓冲控制</view>
    <view class="sliderbox" style="margin-top:20px;">
      <ui-row height="60">
        <ui-col width="50" vertical-align="middle" align="right">{{formatvalue5}}</ui-col>
        <ui-col width="{{width-110}}" vertical-align="middle">
          <ui-slider width="{{width-100}}"
                bindchange="slider5"
                 buffer-color="#ccc"
                 buffer-value="{{bufferValue}}"
                 thumb-style="{{tbObj5}}"
                 thumb-down-style="{{tbdObj3}}"
                 background-color="#999"
                 active-color="#FF7000"
                 value-pos="left"
                 value="{{value5}}"
                 max="{{max5}}"
                 ></ui-slider>
          </ui-col>
        <ui-col width="50" vertical-align="middle" align="left">
          {{formatmax5}}
        </ui-col>
      </ui-row>
      <button bindtap="changeBufferValue" style="margin-top:10px;">开始缓冲</button>
      <text>实际使用时，由音乐或视频的进度来控制slider的进度</text>
    </view>

    <view class="sample_title">在popup中使用</view>
    <view style="margin:20px;padding-bottom:50px">
      <button bindtap="handletap">在popup中使用</button>
    </view>
    <ui-popup show="{{show}}">
      <view style="margin:25px 10px;">
          <ui-slider 
          scale-position="over"
          scale-margin="15"
          width="{{width-50}}"
          value="{{value6}}"
          unlimited
          max="500"
          key-scale-line="100"
          active-color="#00c8b2"
          slider-weight="4"
          thumb-style="{{tbObj6}}"
          step="100"
        ></ui-slider>
      </view>
      <view style="margin-top:20px;padding:10px;padding-bottom:20px;background-color:#fafafa;border-top:1px solid #eee;">
        <button class="button1" bindtap="hidepopup">完成</button>
      </view>
    </ui-popup> 
  </view>
</template>

<style lang="scss" scoped>
// slider.less
.button1{
  background-color:#00c8b2;
  color:#fff;
}

.sliderbox{
  display: table; 
  padding:20px;
  width:100%;
  height:60px;
  background-color: white;
  text-align: center
}
</style>
