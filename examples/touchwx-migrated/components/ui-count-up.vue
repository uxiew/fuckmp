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
  from?: string | number
  to?: string | number
  duration?: string | number
  fromColor?: string
  toColor?: string
  numberStyle?: string
  fixed?: string | number
  digit?: string | number
}>(), {
  duration: 1000,
  fromColor: '#000000',
  toColor: '#000000',
  numberStyle: '',
  fixed: 0,
  digit: 0
})

const showNum = ref('')
const num = ref(0)
const time = ref(0)
const color = ref('')
const selfNumberStyle = ref('')
const tick = ref(0)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'showNum')) showNum.value = patch['showNum']
  if (Object.prototype.hasOwnProperty.call(patch, 'num')) num.value = patch['num']
  if (Object.prototype.hasOwnProperty.call(patch, 'time')) time.value = patch['time']
  if (Object.prototype.hasOwnProperty.call(patch, 'color')) color.value = patch['color']
  if (Object.prototype.hasOwnProperty.call(patch, 'selfNumberStyle')) selfNumberStyle.value = patch['selfNumberStyle']
  if (Object.prototype.hasOwnProperty.call(patch, 'tick')) tick.value = patch['tick']
}

onMounted(() => {

})

const detached = () => {
  if (interval.value) {
    clearInterval(interval.value);
  }
}

onMounted(() => {
  selfDigit.value = Number(props.digit);
  selfNumberStyle.value = StyleHelper.getPlainStyle(props.numberStyle);
  selfFrom.value = Number(props.from);
  selfTo.value = Number(props.to);
  tick.value = props.duration / (selfTo.value - selfFrom.value);
  if (tick.value < 20) {
    multi.value = 20 / tick.value;
    tick.value = 20;
  } else {
    multi.value = 1 + 0.01;
  }
  tick.value = Math.floor(tick.value);
  gradientArray.value = RGBHelper.gradient(props.fromColor, props.toColor, Math.floor((selfTo.value - selfFrom.value) / multi.value));
  num.value = Math.floor(selfFrom.value);
  setData({
    num: num.value,
    selfNumberStyle: selfNumberStyle.value
  });
})

onMounted(() => {
  let i = 0;
  interval.value = setInterval(() => {
    num.value = multi.value + num.value;
    if (num.value >= selfTo.value) {
      clearInterval(interval.value);
      num.value = selfTo.value;
      showNum.value = Number(num.value).toFixed(props.fixed);
      zeroAlign();
      setData({
        showNum: showNum.value
      });
      setData({
        num: num.value,
        color: gradientArray.value[gradientArray.value.length - 1]
      });
      return;
    }
    if (gradientArray.value[i]) {
      setData({
        color: gradientArray.value[i]
      });
    }
    showNum.value = Number(num.value).toFixed(props.fixed);
    zeroAlign();
    setData({
      showNum: showNum.value
    });
    i++;
  }, tick.value);
})

const zeroAlign = () => {
  let digit = showNum.value.split('.')[0].length;
  if (selfDigit.value && selfDigit.value > digit) {
    let zeroNumber = selfDigit.value - digit;
    showNum.value = Math.pow(10, zeroNumber).toString().split('1')[1] + showNum.value;
  }
}

</script>

<template>
<view class="ui-count-up" style="color:{{color}};{{selfNumberStyle}}">{{showNum}}</view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;

</style>
