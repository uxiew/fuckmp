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
  scrollTop?: number
  customStyle?: string
  top?: string | number
}>(), {
  top: 0
})

const fixed = ref(false)
const fakerStyle = ref('')
const selfTop = ref(0)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'fixed')) fixed.value = patch['fixed']
  if (Object.prototype.hasOwnProperty.call(patch, 'fakerStyle')) fakerStyle.value = patch['fakerStyle']
  if (Object.prototype.hasOwnProperty.call(patch, 'selfTop')) selfTop.value = patch['selfTop']
}

onMounted(() => {
  // let viewport = wxSafe.createSelectorQuery().selectViewport()
  // console.log(viewport._selectorQuery._defaultComponent)
  setData({
    selfCustomStyle: StyleHelper.getPlainStyle(props.customStyle),
    fakerStyle: StyleHelper.getMergedPlainStyles([props.customStyle, {
      top: props.top
    }]),
    selfTop: Number(props.top)
  });
})

const setFixed = () => {
  let query = wxSafe.createSelectorQuery().in(this);
  query.select('.ui-sticky').boundingClientRect(res => {
    setData({
      fixed: res.top - selfTop.value < 0
    });
  }).exec();
}

</script>

<template>
<view class="ui-sticky" style="{{ selfCustomStyle }}" bindtap="handleTap">
    <slot></slot>
    <view hidden="{{ !fixed }}" class="ui-sticky-faker" style="{{ fakerStyle }}">
      <slot name="sticky"></slot>
    </view>
  </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
.ui-sticky {
  z-index: 480;
}

.ui-sticky-faker {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 480;
}
</style>
