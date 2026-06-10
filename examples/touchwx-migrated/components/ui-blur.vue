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
  url?: string
  height?: string | number
}>()

const selfStyle = ref({})

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'selfStyle')) selfStyle.value = patch['selfStyle']
}

onMounted(() => {
  setBlur();
})

const setBlur = () => {
  let style = {
    height: props.height
  };
  let blurStyle = {};
  let blurClass = '';
  if (wxSafe.IS_IOS) {
    style.background = `url('${props.url}') no-repeat center -100px / 210%`;
    blurClass = 'ui-blur-ios';
  } else {
    blurStyle.backgroundImage = `url('${props.url}')`;
    blurClass = 'ui-blur-android';
  }
  setData({
    selfStyle: StyleHelper.getPlainStyle(style),
    blurStyle: StyleHelper.getPlainStyle(blurStyle),
    blurClass: blurClass
  });
}

</script>

<template>
<view class="ui-blur" style="{{ selfStyle }}">
    <view class="{{ blurClass }}" style="{{ blurStyle }}"></view>
    <view class="ui-blur-content">
      <slot></slot>
    </view>
  </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
.ui-blur {
  overflow: hidden;
  position: relative;
}

.ui-blur-android {
  position: absolute;
  width: 120%;
  height: 120%;
  filter:blur(45px);
  margin: -10% 0 0 -10%;
  background-repeat: no-repeat;
  background-position: center -100px;
  background-size: 210%;
}

.ui-blur-ios {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  -webkit-backdrop-filter:blur(35px) saturate(200%);
}

.ui-blur-content {
  filter: blur(0);
}
</style>
