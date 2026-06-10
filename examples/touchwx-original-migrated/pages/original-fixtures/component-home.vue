<script setup lang="ts">
import { ref } from 'vue'

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

const menus = ref(null)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'menus')) menus.value = patch['menus']
}

</script>

<template>
<view>
    <view class="index-hd">
      <image class="index-logo" src="https://s10.mogucdn.com/mlcdn/c45406/171122_5jgf1lb185bj893c95lc92b7gkk42_200x200.png"></image>
      <view class="index-desc">TouchWXOriginal</view>
    </view>

    <view class="index-bd">
      <wxc-example-menu menus="{{menus}}"></wxc-example-menu>
    </view>

    <view class="index-ft">
      <view class="provider">Created by Min</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
.index-hd {
  padding: 70rpx;
  text-align: center;
}
.index-bd {
  padding: 0 30rpx 40rpx;
}
.index-ft {
  padding-bottom: 20rpx;
  text-align: center;
}
.index-logo {
  width: 100rpx;
  height: 100rpx;
}
.index-desc {
  margin-top: 20rpx;
  color: #888888;
  font-size: 28rpx;
}
.provider {
  position: fixed;
  width: 100%;
  bottom: 120rpx;
  color: #a9a9a9;
  text-align: center;
}
</style>
