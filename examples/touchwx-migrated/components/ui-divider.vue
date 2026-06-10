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

const props = defineProps<{
  color?: string
  padding?: string | number
}>()


function setData(_patch: Record<string, any>) {}

onMounted(() => {
  setData({
    lineStyle: StyleHelper.getPlainStyle({
      backgroundColor: props.color
    }),
    contentStyle: StyleHelper.getPlainStyle({
      paddingLeft: props.padding,
      paddingRight: props.padding
    })
  });
})

</script>

<template>
<view class="ui-divider">
    <view class="holder">
      <view class="line" style="{{ lineStyle }}"></view>
    </view>
    <view class="ui-divider-content" style="{{ contentStyle }}">
      <slot></slot>
    </view>
    <view class="holder">
      <view class="line" style="{{ lineStyle }}"></view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
.ui-divider {
  display: table;
  white-space: nowrap;
  height: auto;
  overflow: hidden;
  line-height: 1;
  text-align: center;
  padding: 10px 0;
  color: #999;

  .ui-divider-content {
    padding: 0 5px;
  }

  .holder {
    content: "";
    display: table-cell;
    position: relative;
    transform: translateY(50%);
    width: 50%;

    .line {
      position: absolute;
      top: 0;
      left: 0;
      background: #ccc;
      width: 100%;
      height: 1px;
      transform: scaleY(0.33);
      transform-origin: 0 0;
    }
  }
}
</style>
