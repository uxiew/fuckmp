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
  time?: string | number
  timetype?: string
  format?: string
  doneText?: string
  numStyle?: string
  splitStyle?: string
  numberStyle?: string
  doneText2?: string
}>(), {
  time: null,
  timetype: 'datetime',
  format: '{%d}天{%h}时{%m}分{%s}秒',
  doneText: '',
  numStyle: '',
  splitStyle: '',
  numberStyle: '',
  doneText2: '已结束'
})

const futureTimeStamp = ref(null)
const itemArray = ref([])
const mode = ref(0)
const day = ref(null)
const hour = ref(null)
const minute = ref(null)
const second = ref(null)
const selfSplitStyle = ref('')
const selfNumberStyle = ref('')

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'futureTimeStamp')) futureTimeStamp.value = patch['futureTimeStamp']
  if (Object.prototype.hasOwnProperty.call(patch, 'itemArray')) itemArray.value = patch['itemArray']
  if (Object.prototype.hasOwnProperty.call(patch, 'mode')) mode.value = patch['mode']
  if (Object.prototype.hasOwnProperty.call(patch, 'day')) day.value = patch['day']
  if (Object.prototype.hasOwnProperty.call(patch, 'hour')) hour.value = patch['hour']
  if (Object.prototype.hasOwnProperty.call(patch, 'minute')) minute.value = patch['minute']
  if (Object.prototype.hasOwnProperty.call(patch, 'second')) second.value = patch['second']
  if (Object.prototype.hasOwnProperty.call(patch, 'selfSplitStyle')) selfSplitStyle.value = patch['selfSplitStyle']
  if (Object.prototype.hasOwnProperty.call(patch, 'selfNumberStyle')) selfNumberStyle.value = patch['selfNumberStyle']
}

onMounted(() => {
  setData({
    selfSplitStyle: StyleHelper.getPlainStyle(props.splitStyle),
    selfNumberStyle: StyleHelper.getPlainStyle(props.numberStyle)
  });
  console.log(selfNumberStyle.value);
  onPageShow();
})

onMounted(() => {

})

const detached = () => {
  onPageHide();
}

const onPageHide = () => {
  if (interval.value) {
    clearInterval(interval.value);
  }
}

const onPageShow = () => {
  if (props.timetype === 'second') {
    futureTimeStamp.value = Math.floor(moment().add(props.time, 'seconds').format('x') / 1000);
  } else {
    futureTimeStamp.value = Math.floor(moment(props.time).format('x') / 1000);
  }
  let tempArray = props.format.split(/(\{.*?\})/);
  tempArray.forEach(item => {
    let obj = {};
    if (item === '{%d}') {
      obj.type = 'day';
      obj.value = '';
      day.value = obj;
    } else if (item === '{%h}') {
      obj.type = 'hour';
      obj.value = '';
      hour.value = obj;
    } else if (item === '{%m}') {
      obj.type = 'minute';
      obj.value = '';
      minute.value = obj;
    } else if (item === '{%s}') {
      obj.type = 'second';
      obj.value = '';
      second.value = obj;
    } else {
      obj.type = 'split';
      obj.value = item;
    }
    itemArray.value.push(obj);
  });
  startCountDown();
}

const startCountDown = () => {
  interval.value = setInterval(() => {
    let diffSecond = Math.floor(moment(futureTimeStamp.value * 1000).diff(moment()) / 1000);
    timeUp.value = diffSecond < 0 ? true : false;
    if (timeUp.value) {
      setData({
        timeUp: timeUp.value
      });
      triggerEvent('timeup');
      clearInterval(interval.value);
    } else {
      if (day.value) {
        day.value.value = Math.floor(diffSecond / (60 * 60 * 24));
        diffSecond = diffSecond % (60 * 60 * 24);
      }
      if (hour.value) {
        hour.value.value = Math.floor(diffSecond / (60 * 60));
        diffSecond = diffSecond % (60 * 60);
      }
      if (minute.value) {
        minute.value.value = Math.floor(diffSecond / 60);
        diffSecond = diffSecond % 60;
      }
      if (second.value) {
        second.value.value = Math.floor(diffSecond);
      }
      setData({
        itemArray: itemArray.value
      });
    }
  }, 1000);
}

</script>

<template>
<view class="ui-count-down">


    <view
      wx:if="{{timeUp}}"
      class="time-up"
    >
    {{doneText}}
    </view>


    <view class="count-down-wrap" wx:if="{{!timeUp}}">
      <view class="count-down-item" 
        style="{{item.type === 'split' ? selfSplitStyle : selfNumberStyle}}" 
        wx:for="{{itemArray}}" wx:key="" >{{item.value}}</view>
      </view>
    </view>

  <view
  
  
  ></view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
.ui-count-down {
    .count-down-item {
      display: inline;
    }
  }
</style>
