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
  customStyle?: string
  title?: string
}>()

function setData(_patch: Record<string, any>) {}

onMounted(() => {
  let height = wxSafe.STATUS_BAR_HEIGHT + wxSafe.DEFAULT_HEADER_HEIGHT;
  let style = props.customStyle || {};
  style.height = height;
  style.paddingTop = wxSafe.STATUS_BAR_HEIGHT;
  setData({
    statusBarHeight: wxSafe.STATUS_BAR_HEIGHT,
    selfCustomStyle: StyleHelper.getPlainStyle(style)
  });
})

</script>

<template>
<view class="ui-nav-bar" style="{{ selfCustomStyle }}">
    <view class="ui-nav-bar-content">
      <slot></slot>
    </view>
  </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
.ui-nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  font-size: 14px;

  z-index: 490;
  user-select: none;
  box-sizing: border-box;
}
.ui-nav-bar-content {
  display: flex;

  .nav-bar-left {
    position: relative;
    padding: 0 30px;
  }

  .nav-bar-center {
    position: relative;
    flex: 1;
    text-align: center;
    overflow: hidden;
    text-overflow:ellipsis;
    white-space: nowrap;
    box-sizing: border-box;
  }

  .nav-bar-right {
    text-align: right;
  }
}



.ui-nav-bar-more:after {
  content: "\2022\0020\2022\0020\2022\0020";
  font-size: 16px;
}
</style>
