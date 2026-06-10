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

const props = defineProps<Record<string, never>>()

const monthsArray = ref([])
const oldItem = ref(null)
const scrollTop = ref(0)
const oldRangeLeftItem = ref(null)
const oldRangeRightItem = ref(null)
const heightCount = ref(50)
const myItem = ref(null)
const rangeRightItem = ref(null)
const rangeLeftItem = ref(null)
const inRangeArray = ref([])

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'monthsArray')) monthsArray.value = patch['monthsArray']
  if (Object.prototype.hasOwnProperty.call(patch, 'oldItem')) oldItem.value = patch['oldItem']
  if (Object.prototype.hasOwnProperty.call(patch, 'scrollTop')) scrollTop.value = patch['scrollTop']
  if (Object.prototype.hasOwnProperty.call(patch, 'oldRangeLeftItem')) oldRangeLeftItem.value = patch['oldRangeLeftItem']
  if (Object.prototype.hasOwnProperty.call(patch, 'oldRangeRightItem')) oldRangeRightItem.value = patch['oldRangeRightItem']
  if (Object.prototype.hasOwnProperty.call(patch, 'heightCount')) heightCount.value = patch['heightCount']
  if (Object.prototype.hasOwnProperty.call(patch, 'myItem')) myItem.value = patch['myItem']
  if (Object.prototype.hasOwnProperty.call(patch, 'rangeRightItem')) rangeRightItem.value = patch['rangeRightItem']
  if (Object.prototype.hasOwnProperty.call(patch, 'rangeLeftItem')) rangeLeftItem.value = patch['rangeLeftItem']
  if (Object.prototype.hasOwnProperty.call(patch, 'inRangeArray')) inRangeArray.value = patch['inRangeArray']
}

onMounted(() => {
  monthsArray.value.splice(0, monthsArray.value.length);
  let startMonthAnchor;
  let endMonthAnchor;
  if (isNaN(Number(dateRange.value[0]))) {
    // 字符串
    startMonthAnchor = dateRange.value[0] + '/01';
    endMonthAnchor = dateRange.value[1] + '/01';
  } else {
    startMonthAnchor = moment().subtract(dateRange.value[0], 'months').format('YYYY/MM/DD');
    endMonthAnchor = moment().add(dateRange.value[1], 'months').format('YYYY/MM/DD');
  }
  for (let i = 0;; i++) {
    let year = moment(startMonthAnchor).year();
    let month = moment(startMonthAnchor).month() + 1;
    let day = moment(startMonthAnchor).date();
    let startMonthDater = new Dater(year, month, day).monthDays; // Dater使用的是正常月份
    let monthArray = getMonthArray(startMonthDater, i);
    monthArray.monthIndex = i;
    monthsArray.value.push(monthArray);
    if (moment(startMonthAnchor).isSame(endMonthAnchor, 'month')) {
      // 相同
      break;
    }
    startMonthAnchor = moment(startMonthAnchor).add(1, 'month');
  }
  if (value.value) {
    if (typeof value.value === 'string') {
      let dIndex = momentTransToItem(moment(value.value)).dayIndex;
      let mIndex = momentTransToItem(moment(value.value)).monthIndex;
      selectSingle(mIndex, dIndex, false);
    } else {
      // 
      let dIndex = momentTransToItem(moment(value.value[0])).dayIndex;
      let mIndex = momentTransToItem(moment(value.value[0])).monthIndex;
      selectRange(mIndex, dIndex, false);
      mIndex = momentTransToItem(moment(value.value[1])).monthIndex;
      dIndex = momentTransToItem(moment(value.value[1])).dayIndex;
      selectRange(mIndex, dIndex, false);
    }
  }

  // }, 3000);
  // }, 3000);

  setData({
    monthsArray: monthsArray.value,
    monthTitleStyle: objectToStyle(monthTitleStyle.value),
    calendarWrapStyle: objectToStyle(calendarWrapStyleObj())
  });
  let startMoment;
  if (startShow.value === 'today') {
    startMoment = moment();
  } else {
    startMoment = moment(startShow.value);
  }
  for (let i = 0; i < monthsArray.value.length; i++) {
    if (itemTransToMoment(monthsArray.value[i]).isSame(startMoment, 'month')) {
      setData({
        scrollTop: monthsArray.value[i].positionY
      });
    }
  }
})

const calendarWrapStyleObj = () => {
  let style = {};
  style.height = height.value + 'px';
  return style;
}

const itemTransToMoment = (item) => {
  if (item.day) {
    return moment(`${item.year}/${item.month}/${item.day}`);
  } else {
    return moment(`${item.year}/${item.month}`);
  }
}

const momentTransToItem = (moment) => {
  for (let i = 0; i < monthsArray.value.length; i++) {
    for (let j = 0; j < monthsArray.value[i].data.length; j++) {
      if (moment.isSame(itemTransToMoment(monthsArray.value[i].data[j]), 'day')) {
        return monthsArray.value[i].data[j];
      }
    }
  }
}

const inRangeSelect = (rightItem, startI, endI, select) => {
  if (!select) {
    inRangeArray.value.length = 0;
    return;
  }
  for (let i = startI; i <= endI; i++) {
    for (let j = 0; j < monthsArray.value[startI].data.length; j++) {
      // 
      if (monthsArray.value[i].data[j].isThisMonth && itemTransToMoment(monthsArray.value[i].data[j]).isAfter(itemTransToMoment(oldRangeLeftItem.value), 'day') && itemTransToMoment(monthsArray.value[i].data[j]).isBefore(itemTransToMoment(rightItem), 'day')) {
        inRangeArray.value.push(monthsArray.value[i].data[j]);
      }
      if (itemTransToMoment(monthsArray.value[i].data[j]).isSame(itemTransToMoment(rightItem), 'day')) {
        break;
      }
    }
  }
  setData({
    inRangeArray: inRangeArray.value
  });
}

const selectRange = (mIndex, dIndex, manual) => {
  inRangeArray.value.length = 0;
  setData({
    inRangeArray: inRangeArray.value
  });
  let selectItem = monthsArray.value[mIndex].data[dIndex];
  let selectMoment = itemTransToMoment(selectItem);
  if (selectItem.isPastDay && disablePastDays.value) {
    triggerEvent('failed');
    return;
  }
  if (selectItem.isForeDay && disableForeDays.value) {
    triggerEvent('failed');
    return;
  }
  if (selectItem.isToday && !canSelectToday.value) {
    triggerEvent('failed');
    return;
  }
  if (!oldRangeLeftItem.value && !oldRangeRightItem.value) {
    // 两边都没有
    selectItem.isRangeLeft = true; // 变颜色
    oldRangeLeftItem.value = selectItem; // 第一支选
    if (manual) {
      triggerEvent('selectedstart', selectItem.value);
    }
    setData({
      rangeLeftItem: selectItem
    });
  } else if (oldRangeLeftItem.value, !oldRangeRightItem.value) {
    //左有右没有
    // maxRange选取
    if (maxRange.value) {
      if (itemTransToMoment(oldRangeLeftItem.value).add(maxRange.value, 'day').isBefore(selectMoment, 'day')) {
        triggerEvent('failed');
        return;
      }
    }
    if (itemTransToMoment(oldRangeLeftItem.value).isAfter(selectMoment, 'day')) {
      // 如果选择在之前
      // oldRangeLeftItem.value = this.
      oldRangeLeftItem.value.isRangeLeft = false;
      selectItem.isRangeLeft = true; // 变颜色
      oldRangeLeftItem.value = selectItem;
      if (manual) {
        triggerEvent('selectedstart', selectItem.value);
      }
      setData({
        rangeLeftItem: selectItem
      });
    } else if (itemTransToMoment(oldRangeLeftItem.value).isBefore(selectMoment, 'day')) {
      // 如果选择在之后
      selectItem.isRangeRight = true; // 变颜色
      oldRangeRightItem.value = selectItem; // 老东西
      let startI = oldRangeLeftItem.value.monthIndex;
      let endI = selectItem.monthIndex;
      inRangeSelect(selectItem, startI, endI, true);
      if (manual) {
        triggerEvent('selectedend', [oldRangeLeftItem.value.value, selectItem.value]);
      }
      setData({
        rangeRightItem: selectItem
      });
    } else {
      selectItem.isRangeLeft = false; // 变颜色
      oldRangeLeftItem.value = undefined;
    }
  } else {
    //如果都有
    let startI = oldRangeLeftItem.value.monthIndex;
    let endI = oldRangeRightItem.value.monthIndex;
    inRangeSelect(oldRangeRightItem.value, startI, endI, false);
    oldRangeLeftItem.value.isRangeLeft = false;
    oldRangeRightItem.value.isRangeRight = false;
    oldRangeRightItem.value = undefined;
    selectItem.isRangeLeft = true; // 变颜色
    oldRangeLeftItem.value = selectItem; // 老东西
    if (manual) {
      triggerEvent('selectedstart', selectItem.value);
    }
    setData({
      rangeLeftItem: selectItem,
      rangeRightItem: {
        value: ''
      }
    });
  }
}

const selectSingle = (mIndex, dIndex, manual) => {
  let selectItem = monthsArray.value[mIndex].data[dIndex];
  if (selectItem.isPastDay && disablePastDays.value) {
    triggerEvent('failed');
    return;
  }
  if (selectItem.isForeDay && disableForeDays.value) {
    triggerEvent('failed');
    return;
  }
  if (selectItem.isToday && !canSelectToday.value) {
    triggerEvent('failed');
    return;
  }
  if (oldItem.value) {
    oldItem.value.isClicked = false;
  }
  monthsArray.value[mIndex].data[dIndex].isClicked = true;
  oldItem.value = monthsArray.value[mIndex].data[dIndex];
  if (manual) {
    triggerEvent('change', selectItem.value);
  }
  setData({
    myItem: monthsArray.value[mIndex].data[dIndex]
  });

  // $emit('change', AnchorToDayString(timeAnchor))
}

const touchStartHandler = (e) => {
  let mIndex = e.currentTarget.dataset.monthIndex;
  let dIndex = e.currentTarget.dataset.dayIndex;
  let selectItem = monthsArray.value[mIndex].data[dIndex];
  if (selectRangeMode.value) {
    selectRange(mIndex, dIndex, true);
  } else {
    selectSingle(mIndex, dIndex, true);
  }

  // setData({
  //   monthsArray: monthsArray.value
  // })
  // monthsArray.value['monthIndex'].
  // e.currentTarget.dataset.item.isThisMonth = false
  //
}

const getMonthArray = (date, monthIndex) => {
  let monthArray = {};
  let lineCount = 0;
  var count = 0;
  monthArray.data = [];
  monthArray.year = date.year;
  monthArray.month = date.month;
  if (date.preMonthDays.length >= 7) {
    date.preMonthDays.splice(date.preMonthDays.length - 7, 7);
    lineCount++;
  }
  for (let i = 0; i < date.preMonthDays.length; i++) {
    let obj = {};
    obj.day = date.preMonthDays[i];
    obj.month = date.month;
    obj.year = date.year;
    obj.value = `${obj.year}/${obj.month < 10 ? '0' : ''}${obj.month}/${obj.day < 10 ? '0' : ''}${obj.day}`;
    obj.isThisMonth = false;
    obj.isClicked = false;
    obj.isRangeLeft = false;
    obj.isRangeRight = false;
    obj.isInRange = false;
    obj.monthIndex = monthIndex;
    obj.dayIndex = count;
    if ([0, 6].indexOf(moment(obj.value).weekday()) !== -1) {
      obj.isHoliday = true;
    }
    monthArray.data.push(obj);
    count++;
  }
  for (let i = 0; i < date.thisMonthDays.length; i++) {
    let obj = {};
    obj.day = date.thisMonthDays[i];
    obj.month = date.month;
    obj.year = date.year;
    obj.isThisMonth = true;
    obj.isClicked = false;
    obj.isRangeLeft = false;
    obj.isRangeRight = false;
    obj.isInRange = false;
    obj.monthIndex = monthIndex;
    obj.dayIndex = count;
    obj.value = `${obj.year}/${obj.month < 10 ? '0' : ''}${obj.month}/${obj.day < 10 ? '0' : ''}${obj.day}`;
    if ([0, 6].indexOf(moment(obj.value).weekday()) !== -1) {
      obj.isHoliday = true;
    }
    if (moment(`${obj.year}/${obj.month}/${obj.day}`).isBefore(moment(), 'day')) {
      obj.isPastDay = true;
      obj.isForeDay = true;
      obj.isToday = false;
    } else if (moment(`${obj.year}/${obj.month}/${obj.day}`).isAfter(moment(), 'day')) {
      obj.isPastDay = false;
      obj.isForeDay = true;
      obj.isToday = false;
    } else {
      obj.isPastDay = false;
      obj.isForeDay = false;
      obj.isToday = true;
    }
    monthArray.data.push(obj);
    count++;
  }
  if (date.nextMonthDays.length >= 7) {
    date.nextMonthDays.splice(date.nextMonthDays.length - 7, 7);
    lineCount++;
  }
  for (let i = 0; i < date.nextMonthDays.length; i++) {
    let obj = {};
    obj.day = date.nextMonthDays[i];
    obj.month = date.month;
    obj.year = date.year;
    obj.isThisMonth = false;
    obj.isClicked = false;
    obj.isRangeLeft = false;
    obj.isRangeRight = false;
    obj.isInRange = false;
    obj.monthIndex = monthIndex;
    obj.dayIndex = count;
    obj.value = `${obj.year}/${obj.month < 10 ? '0' : ''}${obj.month}/${obj.day < 10 ? '0' : ''}${obj.day}`;
    if ([0, 6].indexOf(moment(obj.value).weekday()) !== -1) {
      obj.isHoliday = true;
    }
    monthArray.data.push(obj);
    count++;
  }
  monthArray.positionY = heightCount.value - 50;
  if (lineCount === 0) {
    monthArray.monthHeight = 350;
  } else if (lineCount === 1) {
    monthArray.monthHeight = 300;
  } else {
    monthArray.monthHeight = 250;
  }
  heightCount.value += monthArray.monthHeight;
  return monthArray;
}

</script>

<template>
<view class="ui-v-calendar">
      <view class="calendar-title">
          <view wx:for="{{['日', '一', '二', '三', '四', '五', '六']}}" class="calendar-weekday">
            {{item}}
          </view>
        </view>
        <view class="calendar-fixed"></view>
    <!-- <scroll-view scroll-top="{{scrollTop}}" scroll-y style="{{calendarWrapStyle}}" class="calendar-wrap"> -->

      <view class="calendar-body">
        <view class="calendar-month-body"
          wx:for="{{monthsArray}}"
          wx:for-index="monthIndex"
          wx:key="monthIndex"
          wx:for-item="monthItem"
          style="height:{{monthItem.monthHeight}}px"
        >
          <view class="calendar-month-title"
          style="{{monthTitleStyle}}"
          >{{monthItem.year}}年{{monthItem.month}}月</view>

          <view class="calendar-day-wrap"
            bindtap="touchStartHandler"
            wx:for="{{monthItem.data}}"
            wx:for-index="dayIndex"
            wx:key="dayIndex"
            data-month-index="{{monthIndex}}"
            data-day-index="{{dayIndex}}"
            data-item="{{dayItem}}"
            wx:for-item="dayItem"
          >
            <view 
            class="calendar-day-cell {{disablePastDays && dayItem.isPastDay ? 'is-past-days' : ''}} {{dayItem.isHoliday && dayItem.isThisMonth ? 'is-holiday' : ''}} {{dayItem.isThisMonth ? 'is-this-month' : 'not-this-month'}}  {{myItem.value === dayItem.value ? 'is-selected' : ''}} {{dayItem.value === rangeLeftItem.value ? 'is-selected-left' : ''}} {{dayItem.value === rangeRightItem.value  ? 'is-selected-right' : ''}} {{range.isInRange(inRangeArray, dayItem) ? 'is-selected-in-range' : ''}}"    
            style="background-color: {{range.isInRange(inRangeArray, dayItem) ? rangeColor : (dayItem.value === rangeLeftItem.value  ? startRangeColor : (dayItem.value === rangeRightItem.value ? endRangeColor : (myItem === dayItem  ? themeColor: '')))}}"
            >
              {{dayItem.isThisMonth ? dayItem.day : ''}}
            </view>
          </view>
        </view>
      </view>
    <!-- </scroll-view> -->
  </view>
  <wxs module="range">
    module.exports = {
      isInRange: function (array, item) {
        var arrayText = [];
        for (var i = 0; i < array.length; i++) {
          arrayText.push(array[i].value);
        }
        return arrayText.indexOf(item.value) > -1;
      },
    }
  </wxs>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
.ui-v-calendar {
  background-color: white;
  .calendar-title {
    height:50px;
    position: fixed;
    width: 100%;
    background-color: white;
    height: 50px;
    .calendar-weekday {
      height:50px;
      width:14.2857%;
      float: left;
      line-height: 50px;
      text-align: center;
    }
  }
  .calendar-fixed {
    height:50px;
    width: 100%;
    height: 50px;
  }
  .calendar-wrap {
    height: 200px;
  }
  .calendar-body{
    .calendar-month-body{
      .calendar-month-title{
        height: 50px;
        text-align: center;
        line-height: 50px;
      }
      .calendar-day-wrap {
        height:50px;
        width:14.2857%;
        float: left;
        text-align: center;
        vertical-align: middle;
        line-height: 50px;
        .calendar-day-cell {
          width: 32px;
          height: 32px;
          line-height: 32px;
          margin: 9px auto;
          border-radius: 16px;
        }
        .not-this-month {
          display: none;
        }
        .is-this-month {
          color: black
        }
        .is-holiday {
          color: red;
          background-color: white;
        }
        .is-today {
          background-color: #808080;
          color: white;       
        }
        .is-selected {
          background-color: $theme-color;
          color: white;
        }
        .is-selected-left {
          background-color: $theme-color;
          color: white;
        }
        .is-selected-right {
          background-color: red;
          color: white;
        }
        .is-selected-in-range {
          background-color: pink;
          color: white;
        }
        .is-past-days {
          color: gray;
        }
        .is-fore-days {
          color: gray;
        }
      }
    }
  }
}
</style>
