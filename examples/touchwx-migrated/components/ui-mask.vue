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
  customStyle?: string
  show?: boolean
  top?: string | number
  effect?: string
  hideDelay?: number
  hideOnTap?: boolean
  blur?: string
}>(), {
  top: 0,
  hideOnTap: true
})

const selfShow = ref(false)
const isInTimeout = ref(false)
const blurClass = ref('')

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'selfShow')) selfShow.value = patch['selfShow']
  if (Object.prototype.hasOwnProperty.call(patch, 'isInTimeout')) isInTimeout.value = patch['isInTimeout']
  if (Object.prototype.hasOwnProperty.call(patch, 'blurClass')) blurClass.value = patch['blurClass']
}

onMounted(() => {
  let selfCustomStyle = StyleHelper.getMergedPlainStyles([{
    top: props.top
  }, props.customStyle]);
  let blurClass = '';
  let platform = SystemHelper.isIos();
  if (props.blur) {
    let platform = SystemHelper.isIos() ? 'ios' : 'android';
    blurClass = `blur-${props.blur}-${platform}`;
  }
  setData({
    selfCustomStyle: selfCustomStyle,
    blurClass: blurClass
  });
})

const handleMaskTap = () => {
  if (props.hideOnTap) {
    setData({
      show: false
    });
  }
}

</script>

<template>
<view class="ui-mask {{ effect }} {{ blurClass }} {{ selfShow ? 'show' : ''}}" style="{{ selfCustomStyle }}" bindtap="handleMaskTap">
    <view>
      <slot></slot>
    </view>
  </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
.ui-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.5);
  width: 100%;
  visibility: hidden;
  opacity: 0;
  transition: opacity .25s ease-in;
  -webkit-backface-visibility: hidden;
  z-index: 700;

  &.scale-out {
    transition: all .25s ease-in;
    transform: scale(0);

    &.show {
      transform: scale(1);
    }
  }

  &.scale-in {
    transition: all .25s ease-in;
    transform: scale(1.5);
    &.show {
      transform: scale(1);
    }
  }

  &.blur-dark-android {
    background: rgba(0, 0, 0, 0.85); /*安卓 */
  }

  &.blur-dark-ios {
    background: rgba(0, 0, 0, 0.5); /* IOS */
    -webkit-backdrop-filter: blur(30px) saturate(180%);
  }

  &.blur-light-android {
    background: rgba(255, 255, 255, 0.96); /*安卓 */
  }

  &.blur-light-ios {
    background: rgba(255, 255, 255, 0.8); /* IOS */
    -webkit-backdrop-filter: blur(30px) saturate(300%);
  }

  &.show {
    opacity: 1;
    visibility: visible;
  }
}
</style>
