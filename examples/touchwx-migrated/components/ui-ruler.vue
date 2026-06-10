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

const padding = ref(0)
const currentTimeStamp = ref(0)
const leftForSure = ref(0)
const canMove = ref(false)
const canEnd = ref(false)
const selfValue = ref(0)
const oldValue = ref(0)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'padding')) padding.value = patch['padding']
  if (Object.prototype.hasOwnProperty.call(patch, 'currentTimeStamp')) currentTimeStamp.value = patch['currentTimeStamp']
  if (Object.prototype.hasOwnProperty.call(patch, 'leftForSure')) leftForSure.value = patch['leftForSure']
  if (Object.prototype.hasOwnProperty.call(patch, 'canMove')) canMove.value = patch['canMove']
  if (Object.prototype.hasOwnProperty.call(patch, 'canEnd')) canEnd.value = patch['canEnd']
  if (Object.prototype.hasOwnProperty.call(patch, 'selfValue')) selfValue.value = patch['selfValue']
  if (Object.prototype.hasOwnProperty.call(patch, 'oldValue')) oldValue.value = patch['oldValue']
}

onMounted(() => {

})

onMounted(() => {
  if (value.value) {
    selfValue.value = Number(value.value) - selfMin.value;
  } else {
    selfValue.value = 0;
  }
  leftForSure.value = selfValue.value * (selfLineWidth.value + selfStepWidth.value);
  setData({
    selfValue: selfValue.value,
    leftForSure: leftForSure.value
  });
})

onMounted(() => {
  lineHeight.value = lineHeight.value || Number(height.value) / 4;
  keyLineHeight.value = keyLineHeight.value || Number(lineHeight.value) * 2;
  selfValueStyle.value = StyleHelper.getPlainStyle(valueStyle.value);
  selfStepWidth.value = Number(stepWidth.value);
  selfLineWidth.value = Number(lineWidth.value);
  selfMin.value = Number(min.value);
  selfMax.value = Number(max.value);
  value.value = Number(value.value);
  step.value = Number(step.value);
  keyStep.value = Number(keyStep.value);
  pointerWidth.value = Number(pointerWidth.value);
  selfWidth.value = Number(width.value);
  if (width.value) {
    selfWidth.value = Number(width.value);
  } else {
    selfWidth.value = wxSafe.getSystemInfoSync().windowWidth;
  }
  padding.value = selfWidth.value / 2;
  if (!numberPadding.value) {
    setData({
      numberPadding: numberSize.value / 2
    });
  } else {
    setData({
      numberPadding: numberPadding.value
    });
  }
  console.log(numberPadding.value);
  setData({
    lineHeight: lineHeight.value,
    keyLineHeight: keyLineHeight.value,
    selfValueStyle: selfValueStyle.value,
    selfStepWidth: selfStepWidth.value,
    selfLineWidth: selfLineWidth.value,
    selfMin: selfMin.value,
    selfMax: selfMax.value,
    value: value.value,
    step: step.value,
    keyStep: keyStep.value,
    pointerWidth: pointerWidth.value
  });
  setData({
    padding: padding.value,
    rulerWrapStyle: objectToStyle(rulerWrapStyleObj()),
    rulerStyle: objectToStyle(rulerStyleObj()),
    rulerPointerStyle: objectToStyle(rulerPointerStyleObj()),
    scrollViewStyle: objectToStyle(scrollViewStyleObj()),
    rulerPaddingStyle: objectToStyle(rulerPaddingStyleObj()),
    numberPaddingStyle: objectToStyle(numberPaddingStyleObj())
  });
})

const touchStartHandler = (e) => {
  canMove.value = false;
}

const touchEndHandler = () => {
  canMove.value = true;
  if (canEnd.value) {
    selfValue.value = Math.round(offsetValue.value / (selfStepWidth.value + selfLineWidth.value) * step.value);
    leftForSure.value = Math.round(offsetValue.value / (selfStepWidth.value + selfLineWidth.value) * step.value / step.value) * step.value / step.value * (selfStepWidth.value + selfLineWidth.value);
    setData({
      selfValue: selfValue.value,
      leftForSure: leftForSure.value
    });
  }
}

const scrollHandler = (e) => {
  offsetValue.value = e.detail.scrollLeft;
  selfValue.value = Math.round(offsetValue.value / (selfStepWidth.value + selfLineWidth.value) * step.value);
  if (oldValue.value !== selfValue.value) {
    setData({
      selfValue: selfValue.value
    });
  }
  oldValue.value = selfValue.value;
  setTimeout(() => {
    if (offsetValue.value === e.detail.scrollLeft && canMove.value) {
      leftForSure.value = Math.round(offsetValue.value / (selfStepWidth.value + selfLineWidth.value) * step.value / step.value) * step.value / step.value * (selfStepWidth.value + selfLineWidth.value);
      setData({
        selfValue: selfValue.value,
        leftForSure: leftForSure.value
      });
      canEnd.value = true;
    }
  }, 100);
  triggerEvent('change', selfValue.value);
}

const rulerWrapStyleObj = () => {
  let style = {};
  style.height = height.value + 'px';
  style.width = padding.value * 2 + (selfStepWidth.value + selfLineWidth.value) * (selfMax.value - selfMin.value) / step.value + 'px';
  if (mode.value === 'bottom') {
    style['border-bottom'] = `1px solid ${color.value}`;
  } else {
    style['border-top'] = `1px solid ${color.value}`;
  }
  // style.width = selfWidth.value + 'px' // 待定
  // style.width = selfWidth.value + 'px' // 待定
  return style;
}

const numberPaddingStyleObj = () => {
  let style = {};
  if (mode.value === 'top') {
    style.top = Number(keyLineHeight.value) + Number(numberPadding.value) + 'px';
  } else {
    style.top = Number(height.value) - Number(keyLineHeight.value) - Number(numberPadding.value) - Number(numberSize.value) + 'px';
  }
  return style;
}

const rulerStyleObj = () => {
  let style = {};
  style.height = height.value + 'px';
  style.width = selfWidth.value + 'px';
  return style;
}

const scrollViewStyleObj = () => {
  let style = {};
  style.height = height.value + 'px';
  style.width = selfWidth.value + 'px';
  return style;
}

const rulerPaddingStyleObj = () => {
  let style = {};
  style.width = padding.value;
  return style;
}

const rulerPointerStyleObj = () => {
  let style = {};
  style.width = pointerWidth.value + 'px';
  style['background-color'] = pointerColor.value;
  style.height = height.value + 'px';
  style.left = padding.value + 'px';
  return style;
}

</script>

<template>
<view class="ui-ruler" style="{{rulerStyle}}">
    <view class="ui-ruler-pointer" style="z-index:999;{{rulerPointerStyle}}"></view>
    
    <view class="value-wrap">
    <view class="value" style="position:absolute;{{selfValueStyle}}">{{(selfValue < 0 ? 0 : selfValue) + selfMin}}</view>
    </view>

    <scroll-view scroll-left="{{leftForSure}}"
    bindtouchstart="touchStartHandler"
    bindtouchend="touchEndHandler"
      bindscroll="scrollHandler"
      class="ui-ruler-scroll-view"
      style="{{scrollViewStyle}}"
      scroll-x>

      <!-- <canvas class="ui-ruler-wrap" style="{{rulerWrapStyle}}" canvas-id="firstCanvas"></canvas> -->


      <view class="ui-ruler-wrap" style="{{rulerWrapStyle}}">
        <view class="ui-ruler-scale-line"
          wx:for="{{(selfMax - selfMin) / step  + 1}}"
          style="left:{{index * (selfStepWidth + selfLineWidth) + padding}}px;height:{{lineHeight}}px; top: {{mode === 'bottom' ? height - lineHeight : 0}}px;background-color:{{color}}"
        ></view>
        <view class="ui-ruler-key-scale-line"
          wx:for="{{(selfMax - selfMin) / step / (keyStep / step) + 1}}"
          style="left:{{index * (selfStepWidth + selfLineWidth) * (keyStep / step) + padding}}px;height:{{keyLineHeight}}px;top: {{mode === 'bottom' ? height - keyLineHeight : 0}}px;background-color:{{color}}"
        ></view>
        <view class="ui-ruler-key-scale-line-number"
          wx:if="{{showNumber}}"
          wx:for="{{(selfMax - selfMin) / step / (keyStep / step) + 1}}"
          style="left:{{index * (selfStepWidth + selfLineWidth) * (keyStep / step) - 50 + padding}}px;{{numberPaddingStyle}};font-size:{{numberSize}}px;color:{{numberColor}}"
        >{{selfMin + index * keyStep}}</view>
        <view class="ui-ruler-padding" style="{{rulerPaddingStyle}}"></view>
      </view>

    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
.ui-ruler {
  position: relative;
  .value {
    z-index: 9999;
  }
}



.ui-ruler .ruler-wrap {
}

.ui-ruler .ui-ruler-scale-line {
  position: absolute;
  width: 1px;
  background-color: gray;
  height: 4px;
}

.ui-ruler .ui-ruler-key-scale-line {
  position: absolute;
  width: 1px;
  background-color: gray;
  height: 8px;
}

.ui-ruler .ui-ruler-key-scale-line-number {
  position: absolute;
  width: 100px;
  text-align: center;
  height: 8px;
  line-height: 100%;
}

.ui-ruler-padding {
  position: absolute;
}

.ui-ruler-borderline{
  position: absolute;
  width: 300px;
  height: 1px;
}

.ui-ruler-pointer {
  position: absolute;

}
</style>
