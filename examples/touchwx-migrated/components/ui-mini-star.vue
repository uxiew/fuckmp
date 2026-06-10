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
  width?: string | number
  height?: string | number
  value?: string | number
  data?: { [key: string]: any }
}>(), {
  width: 73,
  height: 13,
  value: 0
})

const imgSrc = ref('./images/sku_star10.png')
const selfImg = ref(false)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'imgSrc')) imgSrc.value = patch['imgSrc']
  if (Object.prototype.hasOwnProperty.call(patch, 'selfImg')) selfImg.value = patch['selfImg']
}

onMounted(() => {
  reRender();
})

const reRender = () => {
  if (props.data) {
    selfImg.value = true;
  }
  var num = Number(props.value);
  if (num <= 0.9) {
    imgSrc.value = selfImg.value ? props.data.imgSrc1 : './images/sku_star0.png';
  } else if (num >= 1 && num < 2) {
    imgSrc.value = selfImg.value ? props.data.imgSrc2 : './images/sku_star10.png';
  } else if (num >= 2 && num < 3) {
    imgSrc.value = selfImg.value ? props.data.imgSrc3 : './images/sku_star20.png';
  } else if (num === 3) {
    imgSrc.value = selfImg.value ? props.data.imgSrc4 : './images/sku_star30.png';
  } else if (num > 3 && num < 4) {
    imgSrc.value = selfImg.value ? props.data.imgSrc5 : './images/sku_star35.png';
  } else if (num === 4) {
    imgSrc.value = selfImg.value ? props.data.imgSrc6 : './images/sku_star40.png';
  } else if (num > 4 && num < 5) {
    imgSrc.value = selfImg.value ? props.data.imgSrc7 : './images/sku_star45.png';
  } else if (num === 5) {
    imgSrc.value = selfImg.value ? props.data.imgSrc8 : './images/sku_star50.png';
  }
  setData({
    imgSrc: imgSrc.value
  });
}

</script>

<template>
<view class="ui-mini-star">
    <image class="star-img"
    src="{{imgSrc}}"
    style="width:{{width}}px;height:{{height}}px"
    alt=""></image>
  </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
.ui-mini-star{
  .star-img {
    display: block;
    width: 100%;
    height: 100%;
    vertical-align: top;
  }
}
</style>
