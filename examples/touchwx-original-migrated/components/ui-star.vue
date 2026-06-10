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
  data?: any[]
  starWidth?: string | number
  starHeight?: string | number
  half?: boolean
  value?: string | number
  length?: string | number
  readonly?: boolean
}>(), {
  data: {
  normalSrc: './images/starnone.png',
  selectedSrc: './images/starfull.png',
  halfSrc: './images/starhalf.png'
},
  starWidth: 35,
  starHeight: 35,
  half: false,
  value: 0,
  length: 5,
  readonly: false
})

const starArray = ref([])
const selfValue = ref(0)
const selfLength = ref(0)
const selfStarWidth = ref(0)
const selfStarHeight = ref(0)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'starArray')) starArray.value = patch['starArray']
  if (Object.prototype.hasOwnProperty.call(patch, 'selfValue')) selfValue.value = patch['selfValue']
  if (Object.prototype.hasOwnProperty.call(patch, 'selfLength')) selfLength.value = patch['selfLength']
  if (Object.prototype.hasOwnProperty.call(patch, 'selfStarWidth')) selfStarWidth.value = patch['selfStarWidth']
  if (Object.prototype.hasOwnProperty.call(patch, 'selfStarHeight')) selfStarHeight.value = patch['selfStarHeight']
}

onMounted(() => {
  selfLength.value = Number(props.length);
  selfValue.value = Number(props.value);
  console.log(selfLength.value);
  selfStarWidth.value = Number(props.starWidth);
  selfStarHeight.value = Number(props.starHeight);
  setData({
    selfLength: selfLength.value,
    selfValue: selfValue.value,
    selfStarWidth: selfStarWidth.value,
    selfStarHeight: selfStarWidth.value,
    starsWrapStyle: objectToStyle(starsWrapStyleObj()),
    starWrapStyle: objectToStyle(starWrapStyleObj())
  });
  selectStar(selfValue.value);
})

const tapHandler = (e) => {
  if (props.readonly) {
    return;
  }
  // let offsetX = (e.detail.x - e.currentTarget.offsetLeft)
  // let offsetX = (e.detail.x - e.currentTarget.offsetLeft)
  wxSafe.createSelectorQuery().in(this).select('.stars-wrap').boundingClientRect(res => {
    let offsetX = e.detail.x - res.left;
    let percent = offsetX / (selfStarWidth.value * selfLength.value);
    let value;
    if (props.half) {
      value = Number(percent * selfLength.value).toFixed(1);
      if (Number(value.split('.')[1]) < 5) {
        // 是否小于5
        value = selectStar(Math.floor(value.split('.')[0]) + 0.5);
      } else {
        value = selectStar(Math.floor(value.split('.')[0]) + 1);
      }
    } else {
      value = selectStar(Math.floor(percent * selfLength.value) + 1);
    }
    triggerEvent('change', value);
  }).exec();
}

const selectStar = (value) => {
  value = Number(value);
  starArray.value.length = 0;
  let starNum = Math.floor(value);
  let fixNum = Number(('' + value).split('.')[1]);
  let count = 0;
  for (let i = 0; i < starNum; i++) {
    starArray.value.push('selected');
    count++;
  }
  if (fixNum) {
    starArray.value.push('half');
    count++;
  }
  for (let i = count; i < props.length; i++) {
    starArray.value.push('normal');
  }
  setData({
    starArray: starArray.value,
    value: value
  });
  return value;
}

const starsWrapStyleObj = () => {
  let style = {};
  style.height = selfStarHeight.value + 'px';
  style.width = selfStarWidth.value * selfLength.value + 'px';
  return style;
}

const starWrapStyleObj = () => {
  let style = {};
  style.height = selfStarHeight.value + 'px';
  style.width = selfStarWidth.value + 'px';
  return style;
}

</script>

<template>
<view class="ui-star" style="{{starsWrapStyle}}">
    <view class="stars-wrap" 
      style="{{starsWrapStyle}}"
      bindtap="tapHandler"
      >
      <view class="star-wrap" 
        wx:for="{{starArray}}"
        wx:key="{{index}}"
        style="{{starWrapStyle}}">
        <image src="{{data[item + 'Src']}}"></image>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
.ui-star {


    .stars-wrap {

      .star-wrap {
        float: left;
      } 

    }
    image{
      width: 100%;
      height: 100%;
      display:block;
    }
  }
</style>
