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

const props = withDefaults(defineProps<{
  height?: number
  state?: string
  animate?: boolean
  showArrow?: boolean
  detailHeight?: number
}>(), {
  height: 0,
  state: 'summary',
  animate: true,
  showArrow: true
})

const selfState = ref('summary')
const triangleImg = ref('./images/triangle.png')
const buttonImageObj = ref({})
const detailsObj = ref({})

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'selfState')) selfState.value = patch['selfState']
  if (Object.prototype.hasOwnProperty.call(patch, 'triangleImg')) triangleImg.value = patch['triangleImg']
  if (Object.prototype.hasOwnProperty.call(patch, 'buttonImageObj')) buttonImageObj.value = patch['buttonImageObj']
  if (Object.prototype.hasOwnProperty.call(patch, 'detailsObj')) detailsObj.value = patch['detailsObj']
}

onMounted(() => {
  props.detailHeight = 0;
  wxSafe.createSelectorQuery().in(this).select('.details').boundingClientRect(res => {
    console.log('details', res.height);
    props.detailHeight = res.height;
  }).exec();
  selfState.value = props.state;
  console.log(selfState.value);
  setData({
    buttonImageObj: buttonImageObjFunc(),
    detailsObj: detailsObjFunc()
  });
})

const buttonImageObjFunc = () => {
  let style = {};
  console.log(props.animate);
  if (props.animate) {
    console.log('???');
    style.transition = `transform 0.3s`;
  }
  if (selfState.value === 'summary') {
    style.transform = 'rotate(0deg)';
  } else {
    style.transform = 'rotate(180deg)';
  }
  return style;
}

const buttonObjFunc = () => {
  let style = {};
  return style;
}

const detailsObjFunc = () => {
  let style = {};
  // if (props.animate) {
  // }
  // if (props.animate) {
  // }
  style.transition = `height .3s`;
  if (selfState.value === 'summary') {
    style.height = props.height;
  } else {
    style.height = props.detailHeight;
  }
  return style;
}

const touchStartHandler = () => {
  if (selfState.value === 'summary') {
    selfState.value = 'details';
  } else {
    selfState.value = 'summary';
  }
  setData({
    buttonImageObj: buttonImageObjFunc(),
    detailsObj: detailsObjFunc()
  });
}

const touchMoveHandler = () => {

}

const touchEndHandler = () => {

}

</script>

<template>
<view class="ui-summary">
    <view class="details" style="height: {{detailsObj.height}}px; transition: {{animate ? 'height 0.3s' : ''}}">
      <slot></slot>
    </view>
    <view wx:if="{{showArrow}}"
      bindtap="touchStartHandler">
      <view class="button">
        <image class="button-image" style="transition: {{animate ? 'height 0.3s' : ''}};transform: {{buttonImageObj.transform}}" src="{{triangleImg}}"></image>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
.ui-summary .details {
  width: 100%;
  overflow: hidden;
}
.ui-summary .button {
  width: 100%;
  height: 30px;
  background-color: white;
  background-size: 16px;
  text-align: center;
  line-height: 30px;
}

.ui-summary .button  .button-image {
  display: inline-block;
  width: 14px;
  height: 8px;
}
</style>
