<script setup lang="ts">
import { onMounted, ref } from 'vue'

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
      createSelectorQuery() {
        return {
          in() { return this },
          select() { return this },
          boundingClientRect(callback?: (rect: { height: number, width: number }) => void) {
            callback?.({ height: 0, width: 0 })
            return this
          },
          exec() {}
        }
      },
      createMapContext() {
        return { moveToLocation() {} }
      },
      openSysMap() {}
    }

const objectToStyle = (value: Record<string, unknown> = {}) => Object.entries(value)
  .map(([key, item]) => key.replace(/[A-Z]/g, match => '-' + match.toLowerCase()) + ':' + String(item))
  .join(';')

const props = defineProps<Record<string, never>>()

const valuePos = ref('')
const valueAlignLeft = ref(0)
const showDoubleBarWrap = ref(false)
const valueAlignWidth = ref(0)
const valueStyle = ref('')
const maxValueStyle = ref('')
const zIndex = ref(0)
const zIndex2 = ref(0)
const startX = ref(0)
const offsetX = ref(0)
const start2X = ref(0)
const offset2X = ref(0)
const presentValue = ref(0)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'valuePos')) valuePos.value = patch['valuePos']
  if (Object.prototype.hasOwnProperty.call(patch, 'valueAlignLeft')) valueAlignLeft.value = patch['valueAlignLeft']
  if (Object.prototype.hasOwnProperty.call(patch, 'showDoubleBarWrap')) showDoubleBarWrap.value = patch['showDoubleBarWrap']
  if (Object.prototype.hasOwnProperty.call(patch, 'valueAlignWidth')) valueAlignWidth.value = patch['valueAlignWidth']
  if (Object.prototype.hasOwnProperty.call(patch, 'valueStyle')) valueStyle.value = patch['valueStyle']
  if (Object.prototype.hasOwnProperty.call(patch, 'maxValueStyle')) maxValueStyle.value = patch['maxValueStyle']
  if (Object.prototype.hasOwnProperty.call(patch, 'zIndex')) zIndex.value = patch['zIndex']
  if (Object.prototype.hasOwnProperty.call(patch, 'zIndex2')) zIndex2.value = patch['zIndex2']
  if (Object.prototype.hasOwnProperty.call(patch, 'startX')) startX.value = patch['startX']
  if (Object.prototype.hasOwnProperty.call(patch, 'offsetX')) offsetX.value = patch['offsetX']
  if (Object.prototype.hasOwnProperty.call(patch, 'start2X')) start2X.value = patch['start2X']
  if (Object.prototype.hasOwnProperty.call(patch, 'offset2X')) offset2X.value = patch['offset2X']
  if (Object.prototype.hasOwnProperty.call(patch, 'presentValue')) presentValue.value = patch['presentValue']
}

onMounted(() => {

})

onMounted(() => {
  if (unlimited.value) {
    setData({
      max: max.value + step.value
    });
  }
  value.value;
  scaleMargin.value = scalePosition.value === 'under' ? scaleMargin.value : -scaleMargin.value;
  fixed.value = step.value.toString().split('.')[1];
  if (!fixed.value) {
    fixed.value = '';
  }
  if (showValue.value && !showMaxValue.value) {
    valuePos.value = 'right';
  }
  scale.value;
  if (showValue.value && showMaxValue.value) {
    valuePos.value = 'left';
  }
  if (typeof props.value === 'object') {
    value.value[0] = value.value[0] < min.value ? min.value : value.value[0];
    value.value[1] = value.value[1] < min.value ? min.value : value.value[1];
    value.value[0] = value.value[0] > max.value ? max.value : value.value[0];
    value.value[1] = value.value[1] > max.value ? max.value : value.value[1];
    value.value[0] = value.value[0] > value.value[1] ? value.value[1] : value.value[0];
    offsetX.value = value2Offset(value.value[0]);
    offset2X.value = value2Offset(value.value[1]);
    showDoubleBarWrap.value = true;
    presentValue.value = [...props.value];
    // presentValue.value[0] = props.valueFormat.cb(props.value[0])
    // console.log(presentValue.value[0])
    console.log(value.value, offsetX.value, offser2X.value);
  } else {
    value.value = value.value < min.value ? min.value : value.value;
    value.value = value.value > max.value ? max.value : value.value;
    offset2X.value = value2Offset(value.value);
    showDoubleBarWrap.value = false;
    persentValue.value = value.value;
  }
  console.log(value.value);
  setData({
    showDoubleBarWrap: showDoubleBarWrap.value,
    minNum: min.value
  });
  // let func = new Function('res', 'return res')
  // console.log(func(100))
  // 计算value的位置
  // let func = new Function('res', 'return res')
  // console.log(func(100))
  // 计算value的位置
  if (valuePos.value === '') {
    if (showMaxValue.value && showValue.value) {
      valuePos.value = 'left';
    } else {
      valuePos.value = 'right';
    }
  } else {
    valuePos.value = valuePos.value;
  }
  // 计算对齐值
  // 计算对齐值

  if (showValue.value && showMaxValue.value) {
    valueAlignLeft.value = 40;
    valueAlignWidth.value = 80;
  } else if (!showValue.value && !showMaxValue.value) {
    valueAlignLeft.value = 20;
    valueAlignWidth.value = 40;
  } else {
    if (valuePos.value === 'left') {
      valueAlignLeft.value = 40;
      valueAlignWidth.value = 60;
    } else {
      valueAlignLeft.value = 20;
      valueAlignWidth.value = 60;
    }
  }
  // value 转 offsetX
  // value 转 offsetX

  if (showDoubleBarWrap.value) {
    offsetX.value = value2Offset(value.value[0]);
    offset2X.value = value2Offset(value.value[1]);
  } else {
    offset2X.value = value2Offset(value.value);
  }
  // 更新页面
  // 更新页面
  setData({
    value: value.value,
    offsetX: offsetX.value,
    offset2X: offset2X.value,
    scaleMargin: scaleMargin.value,
    sliderStyle: objectToStyle(sliderStyleObj()),
    sliderLineTouchStyle: objectToStyle(sliderLineTouchStyleObj()),
    sliderLineBackgroundStyle: objectToStyle(sliderLineBackgroundStyleObj()),
    sliderLineStyle: objectToStyle(sliderLineStyleObj()),
    sliderLineScaleWrapStyle: objectToStyle(sliderLineScaleWrapStyleObj()),
    sliderBarWrapStyle: objectToStyle(sliderBarWrapStyleObj()),
    valueStyle: objectToStyle(valueStyleObj()),
    maxValueStyle: objectToStyle(maxValueStyleObj()),
    sliderLineDynamicStyle: objectToStyle(sliderLineDynamicStyleObj()),
    sliderBarStyle: objectToStyle(sliderBarStyleObj()),
    tooltipStyle: objectToStyle(tooltipStyleObj()),
    sliderBarWrapDynamicStyle: objectToStyle(sliderBarWrapDynamicStyleObj()),
    sliderBarWrap2DynamicStyle: objectToStyle(sliderBarWrap2DynamicStyleObj()),
    sliderBufferLineStyle: objectToStyle(sliderBufferLineStyleObj()),
    tooltipCustomStyle: objectToStyle(tooltipStyle.value),
    thumbCustomStyle: objectToStyle(thumbStyle.value)
  });
  triggerEvent('change', {
    'value': value.value
  });
  setData({
    valueAlignWidth: valueAlignWidth.value
  });
})

onMounted(() => {
  wxSafe.createSelectorQuery().in(this).select('.slider-line-touch').boundingClientRect(res => {
    offsetLeft.value = res.left;
    reMathWrapLeft();

    // console.log(offsetLeft.value)
  }).exec();
})

const reMathWrapLeft = () => {
  if (showDoubleBarWrap.value) {
    wxSafe.createSelectorQuery().in(this).select('.slider-bar-wrap1').boundingClientRect(res => {
      wrap1Left.value = res.left;
    }).exec();
  }
  wxSafe.createSelectorQuery().in(this).select('.slider-bar-wrap2').boundingClientRect(res => {
    wrap2Left.value = res.left;
  }).exec();
}

const touchStartLineHandler = (e) => {
  animate.value = 'all .3s';
  if (showDoubleBarWrap.value) {
    console.log(e.touches[0].clientX, wrap1Left.value + thumbSize.value / 2, wrap2Left.value + thumbSize.value / 2);
    if (Math.abs(e.touches[0].clientX - wrap1Left.value - thumbSize.value / 2) < Math.abs(e.touches[0].clientX - wrap2Left.value - thumbSize.value / 2)) {
      offsetX.value = e.touches[0].clientX - offsetLeft.value;
      value.value[0] = offset2Value(offsetX.value);
      offsetX.value = value2Offset(value.value[0]);
    } else {
      offset2X.value = e.touches[0].clientX - offsetLeft.value;
      value.value[1] = offset2Value(offset2X.value);
      offset2X.value = value2Offset(value.value[1]);
    }
    value.value = [parseInt(offset2Value(offsetX.value)), parseInt(offset2Value(offset2X.value))];
  } else {
    offset2X.value = e.touches[0].clientX - offsetLeft.value;
    value.value = offset2Value(offset2X.value);
    value.value = min.value + Math.round((value.value - min.value) / step.value) * step.value;
    offset2X.value = Number(value.value - min.value) / (max.value - min.value) * (width.value - valueAlignWidth.value);
    value.value = Number(offset2Value(offset2X.value).toFixed(fixed.value.length));
  }
  setData({
    offset2X: offset2X.value,
    offsetX: offsetX.value,
    value: value.value,
    sliderBarAnimateStyle: objectToStyle(sliderBarAnimateStyleObj()),
    sliderBarWrapStyle: objectToStyle(sliderBarWrapStyleObj()),
    sliderBarWrapDynamicStyle: objectToStyle(sliderBarWrapDynamicStyleObj()),
    sliderBarWrap2DynamicStyle: objectToStyle(sliderBarWrap2DynamicStyleObj()),
    sliderLineDynamicStyle: objectToStyle(sliderLineDynamicStyleObj()),
    thumbDownCustomStyle: ''
  });
  emitValue();
}

const value2Offset = (value) => {
  return Number(value - min.value) / (max.value - min.value) * (width.value - valueAlignWidth.value);
}

const offset2Value = (offset) => {
  return offset / (width.value - valueAlignWidth.value) * (max.value - min.value) + min.value;
}

const touchStartHandler = (e) => {
  startX.value = e.touches[0].clientX - offsetX.value;
  zIndex.value = 1;
  zIndex2.value = 0;
  animate.value = '';
  firstIn.value = true;
  setData({
    sliderBarWrapDynamicStyle: objectToStyle(sliderBarWrapDynamicStyleObj()),
    sliderBarWrap2DynamicStyle: objectToStyle(sliderBarWrap2DynamicStyleObj()),
    sliderBarAnimateStyle: objectToStyle(sliderBarAnimateStyleObj())
  });
}

const touchMoveHandler = (e) => {
  if (firstIn.value) {
    firstIn.value = false;
    setData({
      thumbDownCustomStyle: objectToStyle(thumbDownStyle.value)
    });
  }
  // 判断offsetX的距离
  // 判断offsetX的距离
  offsetX.value = e.touches[0].clientX - startX.value;
  if (offsetX.value > offset2X.value) {
    offsetX.value = offset2X.value;
  } else if (offsetX.value < 0) {
    offsetX.value = 0;
  } else if (offsetX.value > width.value - valueAlignWidth.value) {
    offsetX.value = width.value - valueAlignWidth.value;
  }
  // 赋值data并更新
  // 赋值data并更新
  if (showDoubleBarWrap.value) {
    value.value = [Number(offset2Value(offsetX.value).toFixed(fixed.value.length)), Number(offset2Value(offset2X.value).toFixed(fixed.value.length))];
  } else {
    value.value = Number(offset2Value(offsetX.value).toFixed(fixed.value.length));
  }
  setData({
    value: value.value,
    sliderBarWrapDynamicStyle: objectToStyle(sliderBarWrapDynamicStyleObj()),
    sliderBarWrapStyle: objectToStyle(sliderBarWrapStyleObj()),
    sliderLineDynamicStyle: objectToStyle(sliderLineDynamicStyleObj())
  });
  // triggerEvent('change', { 'value': value.value})
  // triggerEvent('change', { 'value': value.value})
  emitValue();
}

const touchEndHandler = (e) => {
  animate.value = 'all 0.3s';
  if (fixed.value) {
    value.value[0] = Number(value.value[0].toFixed(fixed.value.length));
  } else {
    value.value[0] = min.value + Math.round((value.value[0] - min.value) / step.value) * step.value;
  }
  offsetX.value = value2Offset(value.value[0]);
  animate.value = 'all 0.3s';
  setData({
    thumbDownCustomStyle: '',
    offsetX: offsetX.value,
    value: value.value,
    sliderBarAnimateStyle: objectToStyle(sliderBarAnimateStyleObj()),
    sliderBarWrapStyle: objectToStyle(sliderBarWrapStyleObj()),
    sliderBarWrapDynamicStyle: objectToStyle(sliderBarWrapDynamicStyleObj()),
    sliderLineDynamicStyle: objectToStyle(sliderLineDynamicStyleObj())
  });
  reMathWrapLeft();

  // if(value.value)
  // if(value.value)
  emitValue();

  // triggerEvent('change', { 'value': value.value })
}

const touchEnd2Handler = (e) => {
  animate.value = 'all 0.3s';
  if (showDoubleBarWrap.value) {
    if (fixed.value) {
      value.value[1] = Number(value.value[1].toFixed(fixed.value.length));
    } else {
      value.value[1] = min.value + Math.round((value.value[1] - min.value) / step.value) * step.value;
    }
    offset2X.value = value2Offset(value.value[1]);
  } else {
    if (fixed.value) {
      value.value = Number(value.value.toFixed(fixed.value.length));
    } else {
      value.value = Number(min.value) + Math.round((value.value - min.value) / step.value) * step.value;
    }
    offset2X.value = value2Offset(value.value);
  }
  setData({
    offset2X: offset2X.value,
    value: value.value,
    sliderBarAnimateStyle: objectToStyle(sliderBarAnimateStyleObj()),
    sliderBarWrap2DynamicStyle: objectToStyle(sliderBarWrap2DynamicStyleObj()),
    sliderLineDynamicStyle: objectToStyle(sliderLineDynamicStyleObj()),
    thumbDownCustomStyle: ''
  });
  reMathWrapLeft();
  emitValue();
  // triggerEvent('change', { 'value': value.value })
}

const touchStart2Handler = (e) => {
  start2X.value = e.touches[0].clientX - offset2X.value;
  zIndex.value = 0;
  zIndex2.value = 1;
  animate.value = '';
  firstIn.value = true;
  setData({
    sliderBarWrapDynamicStyle: objectToStyle(sliderBarWrapDynamicStyleObj()),
    sliderBarWrap2DynamicStyle: objectToStyle(sliderBarWrap2DynamicStyleObj()),
    sliderBarAnimateStyle: objectToStyle(sliderBarAnimateStyleObj())
  });
}

const touchMove2Handler = (e) => {
  if (firstIn.value) {
    firstIn.value = false;
    setData({
      thumbDownCustomStyle: objectToStyle(thumbDownStyle.value)
    });
  }
  // 判断offsetX的距离
  // 判断offsetX的距离
  offset2X.value = e.touches[0].clientX - start2X.value;
  if (offset2X.value < offsetX.value) {
    offset2X.value = offsetX.value;
  } else if (offset2X.value > width.value - valueAlignWidth.value) {
    offset2X.value = width.value - valueAlignWidth.value;
  } else if (offset2X.value < 0) {
    offset2X.value = 0;
  }
  if (showDoubleBarWrap.value) {
    value.value = [Number(offset2Value(offsetX.value).toFixed(fixed.value.length)), Number(offset2Value(offset2X.value).toFixed(fixed.value.length))];
  } else {
    value.value = Number(offset2Value(offset2X.value).toFixed(fixed.value.length));
  }
  setData({
    value: value.value,
    sliderBarWrapStyle: objectToStyle(sliderBarWrapStyleObj()),
    sliderBarWrap2DynamicStyle: objectToStyle(sliderBarWrap2DynamicStyleObj()),
    sliderLineDynamicStyle: objectToStyle(sliderLineDynamicStyleObj())
  });
  emitValue();
}

const emitValue = () => {
  if (unlimited.value) {
    let value;
    if (showDoubleBarWrap.value) {
      value = [...value.value];
      value[0] = value[0] > max.value - step.value ? 'unlimited' : value[0];
      value[1] = value[1] > max.value - step.value ? 'unlimited' : value[1];
    } else {
      value = value.value;
      value = value > max.value - step.value ? 'unlimited' : value;
    }
    triggerEvent('change', {
      'value': value
    });
  } else {
    triggerEvent('change', {
      'value': value.value
    });
  }
}

const sliderStyleObj = () => {
  let style = {};
  style.left = 0;
  style.width = width.value + 'px';
  style.height = height.value + 'px';
  return style;
}

const valueStyleObj = () => {
  let style = {};
  if (valuePos.value === 'left') {
    style.left = '6px';
  } else {
    style.right = '6px';
  }
  return style;
}

const tooltipStyleObj = () => {
  let style = {};
  style.color = activeColor.value;
  return style;
}

const maxValueStyleObj = () => {
  let style = {};
  if (valuePos.value === 'left') {
    style.right = '6px';
  } else {
    style.left = '6px';
  }
  return style;
}

</script>

<template>
<view class="ui-slider"  style="position: relative;{{sliderStyle}}">
    <!-- 值的列表  -->
    <view 
      wx:if="{{showValue}}"
      style="{{valueStyle}}"
      class="value">
      {{unlimited ? value > max - step ? '不限' : value : value}}</view>
    <view 
      wx:if="{{showMaxValue}}" 
      style="{{maxValueStyle}}"
      class="value">
      {{unlimited ? '不限' : max}}</view>
      <!-- slider的外部 -->
      
    <view
      class="slider-line-touch" 
      bindtap="touchStartLineHandler"
      style="{{sliderLineTouchStyle}}">
      <view class="slider-line-background" style="{{sliderLineBackgroundStyle}}"></view>
      <view class="slider-buffer-line" style="{{sliderBufferLineStyle}}"></view>

      <view class="slider-line" style="{{sliderLineStyle}};{{sliderLineDynamicStyle}};{{sliderBarAnimateStyle}}"></view>
      <view class="slider-scale-line-wrap" style="{{sliderLineScaleWrapStyle}}">  
        <view
          wx:if="{{scaleLine}}"
          class="slider-scale-line"
          wx:for="{{scaleLine ? (max - min) / scaleLine + 1 : 0}}"
          style="{{sliderLineScaleStyle}};transform: translate({{index * (width - valueAlignWidth) / ((max - min) / scaleLine)}}px, {{scaleMargin}}px) rotate({{scalePosition === 'under' ? 0 : 180}}deg); transform-origin:0 {{-sliderWeight / 2}}px">
        </view>
        <view
          wx:if="{{keyScaleLine}}"
          class="slider-key-line-scale"
          wx:for="{{keyScaleLine ? (max - min) / keyScaleLine + 1 : 0}}"
          style="{{sliderLineScaleStyle}};transform: translate({{index * (width - valueAlignWidth) / ((max - min) / keyScaleLine)}}px, {{scaleMargin}}px) rotate({{scalePosition === 'under' ? 0 : 180}}deg); transform-origin:0 {{-sliderWeight / 2}}px">
        </view>


        <view
          wx:if="{{keyScaleLine}}"
          class="slider-key-line-scale-number"
          wx:for="{{keyScaleLine ? (max - min) / keyScaleLine + 1 : 0}}"
          style="{{sliderLineScaleStyle}};transform: translate({{index * (width - valueAlignWidth) / ((max - min) / keyScaleLine) - 50}}px, {{scalePosition === 'under' ? scaleMargin : scaleMargin - sliderWeight - 18 - 18 - 10}}px)">
          {{unlimited ? (index + 1 !== (keyScaleLine ? (max - min) / keyScaleLine + 1 : 0))? minNum + index * keyScaleLine : '不限' : minNum + index * keyScaleLine}}
        </view>
      </view>
    </view>


    <!-- <view class="slider-line-key-scale"></view> -->


    <view class="slider-bar-wrap1"
      id="wrap1"
      wx:if="{{showDoubleBarWrap}}"
      catchtouchmove="touchMoveHandler"
      catchtouchend="touchEndHandler"
      catchtouchstart="touchStartHandler"
      style="{{sliderBarWrapStyle}};{{sliderBarWrapDynamicStyle}};{{sliderBarAnimateStyle}}">
        <view class="tooltip"
        style="{{tooltipStyle}};{{tooltipCustomStyle}};"
        wx:if="{{showTooltip}}"
        >{{unlimited ? (showDoubleBarWrap ? value[0] : value) > max - step ? '不限' : (showDoubleBarWrap ? value[0] : value) : (showDoubleBarWrap ? value[0] : value)}}</view>
        <view class="slider"
        style="{{sliderBarStyle}};{{thumbCustomStyle}};{{sliderBarAnimateStyle}};{{thumbDownCustomStyle}}"></view>
    </view>

 
    <view 
      class="slider-bar-wrap2"
      id="wrap2"
      catchtouchmove="touchMove2Handler"
      catchtouchstart="touchStart2Handler"
      catchtouchend="touchEnd2Handler"
      style="{{sliderBarWrapStyle}};{{sliderBarWrap2DynamicStyle}};{{sliderBarAnimateStyle}}">
       <view class="tooltip"
       style="{{tooltipStyle}};{{tooltipCustomStyle}};"
       wx:if="{{showTooltip}}"
       >{{unlimited ? (showDoubleBarWrap ? value[1] : value) > max - step ? '不限' : (showDoubleBarWrap ? value[1] : value) : (showDoubleBarWrap ? value[1] : value)}}</view> 
       <view class="slider"
       style="{{sliderBarStyle}};{{thumbCustomStyle}};{{sliderBarAnimateStyle}};{{thumbDownCustomStyle}}">
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
.ui-slider {
    font-size: 14px;
    position: relative;
    width: 100%;
    height: 30px;  
  }

  .ui-slider .value {
    position: absolute;
    font-size: 12px;
    top: 28px;
  }

  .ui-slider .slider-line-touch {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 30px;
    background-color: transparent;
  }

  .ui-slider .slider-buffer-line {
    position: absolute;
    left: 0;
    width: 0;
    height: 4px;
    background-color: #BBB
  }



  .ui-slider .slider-line-background {
    position: absolute;
    left: 0;
    width: 100%;
    height: 4px;
    background-color: #BBB
  }

  .ui-slider .slider-line {
    position: absolute;
    left: 0;
    width: 0;
    height: 4px;
    background-color: $theme-color;
  }
  .ui-slider .slider-bar-wrap1 {
    position: absolute
  }

  .ui-slider .slider-bar-wrap2 {
    position: absolute
  }

  .ui-slider .slider {
    position: absolute;
    width: 30px;
    height: 30px;
    background-color: white; 
    box-shadow: 0px 3px 13px 0px #ccc;
    border-radius: 50%;
    z-index: 2;
  }

  .ui-slider .tooltip{
    position: absolute;  
    top: -20px;
    left: 0px;
    width: 30px;
    height: 30px;
    text-align: center;
  } 

  .ui-slider .slider-scale-line {
    position: absolute;
    width: 1px;
    background-color: gray;
    height: 4px;
  }

  .ui-slider .slider-key-line-scale {
    position: absolute;
    width: 1px;
    background-color: gray;
    height: 8px;
  }

  .ui-slider .slider-key-line-scale-number {
    position: absolute;
    width: 100px;
    top: 18px;
    text-align: center;
    height: 10px;
  }

  .ui-slider .slider-scale-line-wrap{
    position: absolute;
  }
</style>
