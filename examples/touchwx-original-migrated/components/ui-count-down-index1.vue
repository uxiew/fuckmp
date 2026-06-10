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
  countdown?: number
  format?: string
  numStyle?: string
  symbolStyle?: string
}>(), {
  countdown: 0,
  format: 'dd天hh时mm分ss秒',
  numStyle: '',
  symbolStyle: ''
})

const computeTime = ref(0)
const endTimeMs = ref(0)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'computeTime')) computeTime.value = patch['computeTime']
  if (Object.prototype.hasOwnProperty.call(patch, 'endTimeMs')) endTimeMs.value = patch['endTimeMs']
}

onMounted(() => {
  onPageShow();
})

const detached = () => {
  onPageHide();
}

const init = () => {
  let {
    countdown,
    format
  } = data;
  // countdown seconds
  // countdown seconds
  computeTime.value = countdown;
  // time format
  // time format
  props.format = format;
  const now = Date.now();
  // end timestamp (millisecond)
  // end timestamp (millisecond)
  endTimeMs.value = now + computeTime.value * 1000;
  initCountdown();
}

const initCountdown = () => {
  clearInterval(_timer);
  const now = Date.now();
  // countdown milliseconds
  // countdown milliseconds
  let computeTimeMs = endTimeMs.value - now;
  // countdown interval
  // countdown interval
  let timeout = computeTimeMs % 1000 || 0;
  _timer = setTimeout(() => {
    initCountdown();
  }, timeout);
  setCountdownTimeItems(computeTimeMs);
}

const setCountdownTimeItems = (computeTimeMs) => {
  computeTime.value = parseInt(Math.ceil(computeTimeMs / 1000));
  emitRunCount(computeTime.value);
  if (computeTime.value <= 0) {
    clearInterval(_timer);
    emitEndCount();
  }
  let timeItems = getTimeItems(computeTime.value, props.format);
  setData({
    timeItems
  });
  console.log(timeItems);
}

const getTimeItems = (computeTime, format) => {
  if (computeTime < 0) {
    computeTime = 0;
  }
  let arr = format.match(/[a-zA-Z]{1,3}/g) || [];
  let symbolArr = format.match(/[\u4e00-\u9fa5]+|[^a-zA-Z]/g) || [];
  let time = getTime(computeTime, format);
  return arr.map((item, i) => {
    return {
      num: time[item],
      symbol: symbolArr[i]
    };
  });
}

const getTime = (leftseconds, format) => {
  let d = leftseconds;
  let [s, m, h] = [60, 60, 24].map(unit => {
    let num = d % unit;
    d = Math.floor(d / unit);
    return num;
  });
  if (leftseconds > 86400 && format.indexOf('d') === -1) {
    h += d * 24;
  }
  if (leftseconds > 3600 && format.indexOf('h') === -1) {
    m += h * 60;
  }
  if (leftseconds > 60 && format.indexOf('m') === -1) {
    s += m * 60;
  }
  return {
    dd: formatTime(d),
    hh: formatTime(h),
    mm: formatTime(m),
    ss: formatTime(s),
    d,
    h,
    m,
    s
  };
}

const formatTime = (val) => {
  return val < 10 ? `0${val}` : val;
}

const emitRunCount = () => {
  triggerEvent('runcount', {
    computeTime: computeTime.value
  });
}

const emitEndCount = () => {
  triggerEvent('endcount');
}

const onPageShow = () => {
  const now = Date.now();
  if (props.format && endTimeMs.value) {
    computeTime.value = parseInt((endTimeMs.value - now) / 1000);
    initCountdown();
  }
}

const onPageHide = () => {
  clearInterval(_timer);
}

</script>

<template>
<view class="countdown">
      <view class="countdown__item" wx:for="{{timeItems}}" wx:key="" >
          <view class="countdown__item--num" style="{{numStyle}}">{{item.num}}</view>
          <view class="countdown__item--symbol" style="{{symbolStyle}}">{{item.symbol}}</view>
      </view>
    </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
.countdown {
      display: flex;
      flex-flow: row nowrap;
      &__item {
        display: flex;
        flex-flow: row nowrap;
        align-items: center;
      }
    }
</style>
