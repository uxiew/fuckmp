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
  timelineType?: string
  num?: number
  lineColor?: any
  pointColor?: any
  pointStyle?: any
  top?: string | number
  shadow?: boolean
  showLine?: boolean
}>(), {
  timelineType: 'column',
  shadow: true,
  showLine: true
})


function setData(_patch: Record<string, any>) {}

onMounted(() => {
  console.log(shadowStyle.value);
})

</script>

<template>
<view class="{{timelineType === 'row' ? 'ui-timeline-item-row' : 'ui-timeline-item'}}">
    <view 
    class="ui-timeline-line" 
    wx:if="{{showLine}}"
    style="background: {{lineColor}};top: {{top}}px"> </view>
    <view
    class="ui-timeline-circle {{pointStyle === 'circle' ? 'circle' : ''}}"
    style="background: {{pointStyle === 'circle' ? '' : pointColor}};border-color: {{pointStyle === 'circle' ? pointColor : ''}};z-index: 99;"> </view>

    <view
    wx:if="{{shadow}}"
    class="ui-timeline-circle-shadow"
    style="background: {{pointColor}};z-index: 99;"> </view>

  <slot></slot>
  </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
.ui-timeline-item {
  list-style: none;
  margin: 0;
  padding: 0 0 0 10px;
  position: relative;
  .ui-timeline-circle {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #8a8a8a;
    position: absolute;
    left: 26px;
  }
  .ui-timeline-circle-shadow {
    width: 20px;
    height: 20px;
    opacity: 0.5;
    border-radius: 50%;
    position: absolute;
    left: 21px;
    top: -5px;
  }


  .ui-timeline-circle.circle {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border-color: #8a8a8a;
    border-width: 1px;
    border-style: solid;
    position: absolute;
    left: 26px;
    background: #FFF;
  }
  .ui-timeline-line {
    position: absolute;
    top: 0;
    left: 30px;
    width: 2px;
    height: 100%;
    background: #8a8a8a;
  }
}

.ui-timeline-item-row {
  float: left;
  position: relative;
  list-style: none;
  margin: 0;
  text-align: center;
  height: 60px;
  .ui-timeline-circle {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #8a8a8a;
    position: absolute;
    left: 50%;
    top: 26px;
  }

  .ui-timeline-circle-shadow {
    width: 20px;
    height: 20px;
    opacity: .5;
    border-radius: 50%;
    position: absolute;
    left: calc(50% - 7px);
    top: 21px;
  }



  .ui-timeline-line {
    position: absolute;
    top: 30px;
    left: 50%;
    height: 2px;
    width: 100%;
    background: #8a8a8a;
  }
}
</style>
