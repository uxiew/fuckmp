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
  operateWidth?: number
  value?: string
  canSwipe?: boolean
  height?: number
}>(), {
  operateWidth: 160,
  value: 'off',
  canSwipe: true,
  height: 50
})

const state = ref(null)
const startX = ref(0)
const startY = ref(0)
const offsetX = ref(0)
const tScript = ref('transform .2s')
const selfValue = ref(null)
const active = ref(true)
const radio = ref(0)
const canChange = ref(true)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'state')) state.value = patch['state']
  if (Object.prototype.hasOwnProperty.call(patch, 'startX')) startX.value = patch['startX']
  if (Object.prototype.hasOwnProperty.call(patch, 'startY')) startY.value = patch['startY']
  if (Object.prototype.hasOwnProperty.call(patch, 'offsetX')) offsetX.value = patch['offsetX']
  if (Object.prototype.hasOwnProperty.call(patch, 'tScript')) tScript.value = patch['tScript']
  if (Object.prototype.hasOwnProperty.call(patch, 'selfValue')) selfValue.value = patch['selfValue']
  if (Object.prototype.hasOwnProperty.call(patch, 'active')) active.value = patch['active']
  if (Object.prototype.hasOwnProperty.call(patch, 'radio')) radio.value = patch['radio']
  if (Object.prototype.hasOwnProperty.call(patch, 'canChange')) canChange.value = patch['canChange']
}

onMounted(() => {
  selfValue.value = getSymbolFromState(props.value);
  updateOffset(selfValue.value);
  setData({
    operateStyle: objectToStyle(operateStyleObj())
  });
})

const operateStyleObj = () => {
  let style = {};
  style.width = props.operateWidth + 'px';
  return style;
}

const on = () => {
  selfValue.value = getSymbolFromState('on');
  updateOffset(selfValue.value);
}

const off = () => {
  selfValue.value = getSymbolFromState('off');
  updateOffset(selfValue.value);
}

const touchStartHandler = (e) => {
  // offsetX.value = e
  if (!active.value) {
    return;
  }
  setData({
    startX: e.touches[0].pageX - offsetX.value,
    fingerStartX: e.touches[0].pageX,
    fingerStartY: e.touches[0].pageY
  });
  setData({
    tScript: ''
  });
}

const touchMoveHandler = (e) => {
  if (!canChange.value) {
    return;
  }
  if (Math.abs(fingerStartY.value - e.touches[0].pageY) / Math.abs(fingerStartX.value - e.touches[0].pageX) > 1) {
    console.log('????');
    canChange.value = false;
  }
  if (!active.value) {
    return;
  }
  console.log(123123);
  let offsetX = e.touches[0].pageX - startX.value;
  if (offsetX < -props.operateWidth) {
    setData({
      offsetX: -props.operateWidth
    });
  } else if (offsetX > -20) {
    setData({
      offsetX: 0
    });
  } else {
    setData({
      offsetX: e.touches[0].pageX - startX.value
    });
  }
}

const bounceAnimate = () => {
  active.value = false;
  setData({
    offsetX: 10
  });
  setTimeout(() => {
    setData({
      offsetX: -10
    });
  }, 200);
  setTimeout(() => {
    setData({
      offsetX: 0
    });
    active.value = true;
  }, 400);
}

const getStateFromSymbol = (sbl) => {
  return sbl.toString().split('(')[1].split(')')[0];
}

const getSymbolFromState = (str) => {
  return str === 'on' ? onSTATE : offSTATE;
}

const updateOffset = (sbl) => {
  setData({
    offsetX: getStateFromSymbol(sbl) === 'on' ? -props.operateWidth : 0
  });
}

const touchEndHandler = (e) => {
  if (!canChange.value) {
    canChange.value = true;
    return;
  }
  if (!active.value) {
    return;
  }
  setData({
    tScript: 'transform .2s'
  });
  if (e.changedTouches[0].pageX - startX.value > 0) {
    if (selfValue.value === onSTATE) {
      selfValue.value = offSTATE;
    } else {
      bounceAnimate();
      return;
    }
  } else if (Math.abs(e.changedTouches[0].pageX - startX.value) < 10) {
    updateOffset(selfValue.value);
  } else {
    if (selfValue.value === onSTATE) {
      selfValue.value = offSTATE;
    } else {
      selfValue.value = onSTATE;
    }
    updateOffset(selfValue.value);
  }
  triggerEvent('change', getStateFromSymbol(selfValue.value));
}

</script>

<template>
<view class="ui-swipe-out" style="height:{{height}}px">
    <view class="content"
      style="transform: translate3d({{offsetX}}px, 0px, 0px);transition:{{tScript}}"
      bindtouchstart="touchStartHandler" 
      bindtouchmove="touchMoveHandler" 
      bindtouchend="touchEndHandler">
      <slot name="content"></slot>
    </view>
    <view style="{{operateStyle}}" class="operate">
      <slot name="operate"></slot>
    </view>
  </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
.ui-swipe-out {
  position: relative; 
  height: 50px;
  width: 100%;
}


.ui-swipe-out .content{
 position: absolute;
 background: white;
 width: 100%;
 height: 50px;
 z-index: 2;
}


.operate{
 position: absolute;
 right: 0;
 height: 50px;
 width: 100%;
}
</style>
