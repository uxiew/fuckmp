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
  position?: string | number
  height?: string | number
  animate?: boolean
}>(), {
  height: 0
})

const index = ref(0)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'index')) index.value = patch['index']
}

onMounted(() => {

})

const itemStyleObj = () => {
  let style = {};
  style.height = props.height + 'px';
  return style;
}

const positionStyleObj = () => {
  let style = {};
  style['z-index'] = props.position === 0 ? 5 : 0;
  if (direction.value === 'up') {
    style.transform = `translate3d(0, ${props.position * props.height}px, 0)`;
  } else {
    style.transform = `translate3d(0, ${-props.position * props.height}px, 0)`;
  }
  if (props.animate) {
    style.transition = `transform ${speed.value / 1000}s`;
  } else {
    style.transition = null;
  }
  return style;
}

</script>

<template>
<view class="ui-roller-item" style="{{itemStyle}};{{positionStyle}}">
    <slot></slot>
  </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
ui-roller-item {
  position: absolute;
  left: 0;
  top: 0;
  height: 30px;
  width: 300px;
}
.ui-roller-item {
  background-color: #fff;
  /* -webkit-backface-visibility: hidden; */
}
</style>
