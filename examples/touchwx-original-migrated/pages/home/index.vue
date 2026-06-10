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

const isShow = ref(false)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'isShow')) isShow.value = patch['isShow']
}

const starShow = () => {
  setData({
    isShow: true
  });
}

</script>

<template>
<view>
    <view class="starContent" wx:if="{{ isShow }}">
      <ui-star></ui-star>
    </view>

    <view class="buttonContent">
      <button type="primary" bindtap="starShow">创建评分控件</button>
    </view> 
  </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
.content{
  display: flex; align-items: center; justify-content: center;
}
.starContent{
  padding:50px 50px 0px 50px;
}
.buttonContent{
  padding:50px;
}
</style>
