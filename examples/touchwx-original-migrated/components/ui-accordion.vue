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
  headerHeight?: string | number
  state?: string
  animate?: string | boolean
  animateDuration?: string | number
  showArrow?: string | boolean
}>(), {
  headerHeight: 50,
  state: 'hide',
  animate: true,
  animateDuration: 0.3,
  showArrow: true
})

const selfState = ref('hide')
const triangleImg = ref('./images/triangle.png')
const selfAnimateDuration = ref(0.3)
const buttonImageObj = ref({})
const contentObj = ref({})

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'selfState')) selfState.value = patch['selfState']
  if (Object.prototype.hasOwnProperty.call(patch, 'triangleImg')) triangleImg.value = patch['triangleImg']
  if (Object.prototype.hasOwnProperty.call(patch, 'selfAnimateDuration')) selfAnimateDuration.value = patch['selfAnimateDuration']
  if (Object.prototype.hasOwnProperty.call(patch, 'buttonImageObj')) buttonImageObj.value = patch['buttonImageObj']
  if (Object.prototype.hasOwnProperty.call(patch, 'contentObj')) contentObj.value = patch['contentObj']
}

onMounted(() => {
  selfAnimateDuration.value = props.animateDuration;
  selfState.value = props.state;
  slotHeight.value = props.headerHeight;
  setData({});
  wxSafe.createSelectorQuery().in(this).select('.content').boundingClientRect(res => {
    contentHeight.value = res.height;
  }).exec();
  setData({
    buttonImageObj: buttonImageObjFunc(),
    contentObj: contentObjFunc(),
    buttonImageStyle: objectToStyle(buttonImageStyleObj())
  });
})

const touchStartHandler = () => {
  if (selfState.value === 'show') {
    selfState.value = 'hide';
  } else {
    selfState.value = 'show';
  }
  setData({
    buttonImageObj: buttonImageObjFunc(),
    contentObj: contentObjFunc()
  });
}

const touchMoveHandler = () => {

}

const touchEndHandler = () => {

}

const buttonImageStyleObj = () => {
  let style = {};
  style.top = slotHeight.value / 2 - 4 + 'px';
  return style;
}

const buttonImageObjFunc = () => {
  let style = {};
  style.top = 18 + 'px';
  if (props.animate) {
    style.transition = `transform ${selfAnimateDuration.value}s`;
  }
  if (selfState.value === 'hide') {
    style.transform = 'rotate(0deg)';
  } else {
    style.transform = 'rotate(180deg)';
  }
  return style;
}

const contentObjFunc = () => {
  let style = {};
  if (props.animate) {
    style.transition = `height ${selfAnimateDuration.value}s`;
  }
  if (selfState.value === 'hide') {
    style.height = 0;
  } else {
    style.height = contentHeight.value;
  }
  return style;
}

</script>

<template>
<view class="ui-accordion">
    <view
    class="header"
    bindtap="touchStartHandler"  
    >
      <view wx:if="{{showArrow}}" class="arrow" style="{{buttonImageStyle}}"> 
        <image class="arrow-image" style="transform: {{buttonImageObj.transform}}" src="{{triangleImg}}"></image>
      </view>
      <view class="accordion-header">
        <slot name="header"></slot>
      </view>
    </view>
    <view class="content" style="height: {{contentObj.height}}px;transition: {{contentObj.transition}}" src="{{triangleImg}}">
        <slot name="content"></slot>
    </view>
  </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
.ui-accordion {
  display: relative;
  width: 100%;
}

.content {
  width: 100%;
  overflow: hidden;
  /* transition: height .3s; */
}

.header {
  width: 100%;
  min-height: 30px;
  background-size: 16px;
  text-align: center;
  line-height: 30px;
  position: relative;
}

.arrow {
  position: absolute;
  z-index: 9999;
  right: 8px;
}

.arrow-image {
  transition: transform .3s;
  width: 14px;
  height: 8px;
}
</style>
