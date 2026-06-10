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
  show?: boolean
  width?: string | number
  height?: string | number
  top?: string | number
  showMask?: boolean
  maskStyle?: string
  hideOnBlur?: boolean
  position?: string
  maxHeight?: any
  background?: string
  cropout?: boolean
}>(), {
  top: 0,
  showMask: true,
  hideOnBlur: true,
  position: 'bottom'
})

const isInit = ref(false)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'isInit')) isInit.value = patch['isInit']
}

onMounted(() => {
  let style = StyleHelper.getPlainStyle({
    top: props.top,
    height: props.height,
    width: props.width,
    background: props.background
  });
  let selfStyle = '';
  let selfContentStyle = '';
  if (props.cropout) {
    selfStyle = style;
  } else {
    selfContentStyle = style;
  }
  setData({
    selfStyle: selfStyle,
    selfContentStyle: selfContentStyle,
    selfMaskStyle: StyleHelper.getPlainStyle(props.maskStyle)
  });
})

const handleTouchMove = (e) => {

}

const handleMaskTap = (e) => {
  if (props.hideOnBlur) {
    setData({
      show: false
    });
  }
}

</script>

<template>
<view style="{{ selfStyle }}" class="ui-popup {{ show ? 'show' : '' }}" catchtouchmove="handleTouchMove" >
    <view style="{{ selfContentStyle }}" class="ui-popup-content {{ show ? 'show' : '' }} {{ position }}">
      <slot></slot>
    </view>
    <view style="{{ selfMaskStyle }}" class="ui-popup-mask {{ show ? 'show' : '' }}" bindtap="handleMaskTap"></view>
  </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
.ui-popup {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 501;
  transition-property: transform, visibility;
  transition-duration: 300ms;
  max-height: 100%;
  overflow-y: scroll;
  -webkit-backface-visibility: hidden;
  visibility: hidden;

  &.show {
    visibility: visible;
  }
}

.ui-popup-content {
  position: absolute;
  background-color: #fff;
  /* pointer-events: none; */

  &.bottom {
    bottom: 0;
    left: 0;
    width: 100%;
    transition: transform 300ms;
    transform: translate3d(0, 100%, 0);

    &.show {
      transform: translate3d(0, 0, 0);      
    }
  }

  &.top {
    top: 0;
    left: 0;
    width: 100%;
    animation: slideOut both .3s;
    transform-origin: 50% 0;

    &.show {
      animation: slideIn both .3s;
      transform-origin: 50% 0;
    }
  }

  &.left {
    width: auto;
    height: 100%;
    top: 0;
    right: auto;
    bottom: auto;
    left: 0;
    transition: transform 300ms;
    transform: translate3d(-100%, 0, 0);

    &.show {
      transform: translate3d(0, 0, 0);      
    }
  }

  &.right {
    height: 100%;
    top: 0;
    right: 0;
    bottom: auto;
    left: auto;
    transition: transform 300ms;
    transform: translate3d(100%, 0, 0);

    &.show {
      transform: translate3d(0, 0, 0); 
    }
  }
}

.ui-popup-mask {
  display: block;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  -webkit-tap-highlight-color: rgba(0,0,0,0);
  z-index: -1;
  transition: opacity 400ms;
}

.ui-popup-mask.show {
  opacity: 1;
}

.ui-popup-animate-top-enter-active {
  animation: slideIn both .3s;
  transform-origin: 50% 0;
}

.ui-popup-animate-top-leave-active {
  animation: slideOut both .3s;
  transform-origin: 50% 0;
}
@keyframes slideIn {
  0% {
    opacity: 0;
    transform: scaleY(0);
  }

  100% {
    opacity: 1;
    transform: scaleY(1);
  }
}
@keyframes slideOut {
  0% {
    opacity: 1;
    -webkit-transform: scaleY(1);
    transform: scaleY(1);
  }

  100% {
    opacity: 0;
    -webkit-transform: scaleY(0);
    transform: scaleY(0);
  }
}
</style>
