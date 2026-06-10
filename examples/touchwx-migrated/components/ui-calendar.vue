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

const selectItem = ref({})
const dayMap = ref({})
const monthsArray = ref([])
const oldItem = ref(null)
const scrollTop = ref(0)
const oldRangeLeftItem = ref(null)
const oldRangeRightItem = ref(null)
const heightCount = ref(50)
const monthSwiperIndex = ref(0)
const myItem = ref(null)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'selectItem')) selectItem.value = patch['selectItem']
  if (Object.prototype.hasOwnProperty.call(patch, 'dayMap')) dayMap.value = patch['dayMap']
  if (Object.prototype.hasOwnProperty.call(patch, 'monthsArray')) monthsArray.value = patch['monthsArray']
  if (Object.prototype.hasOwnProperty.call(patch, 'oldItem')) oldItem.value = patch['oldItem']
  if (Object.prototype.hasOwnProperty.call(patch, 'scrollTop')) scrollTop.value = patch['scrollTop']
  if (Object.prototype.hasOwnProperty.call(patch, 'oldRangeLeftItem')) oldRangeLeftItem.value = patch['oldRangeLeftItem']
  if (Object.prototype.hasOwnProperty.call(patch, 'oldRangeRightItem')) oldRangeRightItem.value = patch['oldRangeRightItem']
  if (Object.prototype.hasOwnProperty.call(patch, 'heightCount')) heightCount.value = patch['heightCount']
  if (Object.prototype.hasOwnProperty.call(patch, 'monthSwiperIndex')) monthSwiperIndex.value = patch['monthSwiperIndex']
  if (Object.prototype.hasOwnProperty.call(patch, 'myItem')) myItem.value = patch['myItem']
}

onMounted(() => {
  console.log('attached');
})

onMounted(() => {
  reAttached();
  console.log(dayMap.value);
})

const reAttached = () => {
  monthsArray.value.splice(0, monthsArray.value.length);
  let startMonthAnchor;
  let endMonthAnchor;
  if (isNaN(Number(dateRange.value[0]))) {
    // 字符串
    startMonthAnchor = dateRange.value[0] + '/01';
    endMonthAnchor = dateRange.value[1] + '/01';
  } else {
    startMonthAnchor = moment().subtract(dateRange.value[0], 'months').format('YYYY/MM') + '/01';
    endMonthAnchor = moment().add(dateRange.value[1], 'months').format('YYYY/MM') + '/01';
  }
  console.log(startMonthAnchor, endMonthAnchor);
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
      selectSingle(mIndex, dIndex);
    } else {
      let dIndex = momentTransToItem(moment(value.value[0])).dayIndex;
      let mIndex = momentTransToItem(moment(value.value[0])).monthIndex;
      selectRange(mIndex, dIndex, true);
      mIndex = momentTransToItem(moment(value.value[1])).monthIndex;
      dIndex = momentTransToItem(moment(value.value[1])).dayIndex;
      selectRange(mIndex, dIndex);
    }
  }
  setData({
    monthsArray: monthsArray.value,
    monthTitleStyle: objectToStyle(monthTitleStyle.value),
    calendarWrapStyle: objectToStyle(calendarWrapStyleObj())
  });
  // }, 3000);
}

const changeHandler = (e) => {
  let index = e.detail.current;
  // console.log()
  // console.log()
  triggerEvent('monthchange', `${monthsArray.value[index].year}/${monthsArray.value[index].month >= 10 ? '' : '0'}${monthsArray.value[index].month}`);
}

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
      if (monthsArray.value[i].data[j].isThisMonth && moment.isSame(itemTransToMoment(monthsArray.value[i].data[j]))) {
        return monthsArray.value[i].data[j];
      }
    }
  }
}

const inRangeSelect = (rightItem, startI, endI, select) => {
  for (let i = startI; i <= endI; i++) {
    for (let j = 0; j < monthsArray.value[startI].data.length; j++) {
      if (monthsArray.value[i].data[j].isThisMonth && itemTransToMoment(monthsArray.value[i].data[j]).isAfter(itemTransToMoment(oldRangeLeftItem.value), 'day') && itemTransToMoment(monthsArray.value[i].data[j]).isBefore(itemTransToMoment(rightItem), 'day')) {
        if (select) {
          monthsArray.value[i].data[j].isInRange = true;
        } else {
          monthsArray.value[i].data[j].isInRange = false;
        }
      }
      if (itemTransToMoment(monthsArray.value[i].data[j]).isSame(itemTransToMoment(rightItem), 'day')) {
        break;
      }
    }
  }
}

const selectRange = (mIndex, dIndex, trans) => {
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
    oldRangeLeftItem.value = selectItem; // 老东西
    triggerEvent('selectedstart', selectItem.value);
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
      triggerEvent('selectedstart', selectItem.value);
    } else if (itemTransToMoment(oldRangeLeftItem.value).isBefore(selectMoment, 'day')) {
      // 如果选择在之后

      selectItem.isRangeRight = true; // 变颜色
      oldRangeRightItem.value = selectItem; // 老东西
      let startI = oldRangeLeftItem.value.monthIndex;
      let endI = selectItem.monthIndex;
      inRangeSelect(selectItem, startI, endI, true);
      triggerEvent('selectedend', selectItem.value);
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
    triggerEvent('selectedstart', selectItem.value);
  }
  if (trans) {
    setData({
      monthSwiperIndex: mIndex
    });
  }
}

const selectSingle = (mIndex, dIndex) => {
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
  selectItem.value = oldItem.value;
  setData({
    monthSwiperIndex: mIndex,
    myItem: selectItem.value,
    oldItem: oldItem.value
  });
  triggerEvent('change', selectItem.value);
}

const touchStartHandler = (e) => {
  console.time('a');
  let mIndex = e.currentTarget.dataset.monthIndex;
  let dIndex = e.currentTarget.dataset.dayIndex;
  let selectItem = monthsArray.value[mIndex].data[dIndex];
  if (selectItem.isThisMonth === false) {
    return;
  }
  if (selectRangeMode.value) {
    selectRange(mIndex, dIndex);
  } else {
    selectSingle(mIndex, dIndex);
  }
  // setData({
  //   monthsArray: monthsArray.value
  // })
  // setData({
  //   monthsArray: monthsArray.value
  // })
  console.timeEnd('a');
}

const getMonthArray = (date, monthIndex) => {
  let monthArray = {};
  let lineCount = 0;
  var count = 0;
  monthArray.data = [];
  monthArray.year = date.year;
  monthArray.month = date.month;
  for (let i = 0; i < date.preMonthDays.length; i++) {
    let obj = {};
    obj.day = date.preMonthDays[i];
    if (date.month === 1) {
      obj.month = 12;
      obj.year = date.year - 1;
    } else {
      obj.month = date.month - 1;
      obj.year = date.year;
    }
    obj.value = `${obj.year}/${obj.month < 10 ? '0' : ''}${obj.month}/${obj.day < 10 ? '0' : ''}${obj.day}`;
    obj.isThisMonth = false;
    obj.isClicked = false;
    obj.isRangeLeft = false;
    obj.isRangeRight = false;
    obj.isInRange = false;
    obj.monthIndex = monthIndex;
    obj.dayIndex = count;
    dayMap.value[obj.value] = obj;
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
    dayMap.value[obj.value] = obj;
  }
  // if (date.nextMonthDays.length >= 7) {
  //   date.nextMonthDays.splice(date.nextMonthDays.length - 7, 7)
  //   lineCount++
  // }
  // if (date.nextMonthDays.length >= 7) {
  //   date.nextMonthDays.splice(date.nextMonthDays.length - 7, 7)
  //   lineCount++
  // }

  for (let i = 0; i < date.nextMonthDays.length; i++) {
    let obj = {};
    obj.day = date.nextMonthDays[i];
    if (date.month === 12) {
      obj.month = 1;
      obj.year = date.year + 1;
    } else {
      obj.month = date.month + 1;
      obj.year = date.year;
    }
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
    dayMap.value[obj.value] = obj;
  }
  monthArray.positionY = heightCount.value;
  monthArray.value = `${date.year}/${date.month > 10 ? '' : '0'}${date.month}`;
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
<view class="ui-calendar">
      <view class="calendar-title">
          <view wx:for="{{['日', '一', '二', '三', '四', '五', '六']}}" class="calendar-weekday">
            {{item}}
          </view>
        </view>
    <swiper class="calendar-wrap"
        current="{{monthSwiperIndex}}"
        bindchange="changeHandler"
      >
        <swiper-item class="calendar-month-body"
          wx:for="{{monthsArray}}"
          wx:for-index="monthIndex"
          wx:key="monthIndex"
          wx:for-item="monthItem"
        >
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
            class="calendar-day-cell {{disablePastDays && dayItem.isPastDay ? 'is-past-days' : ''}} {{dayItem.isHoliday && dayItem.isThisMonth ? 'is-holiday' : ''}} {{dayItem.isThisMonth ? 'is-this-month' : 'not-this-month'}} {{myItem.value === dayItem.value ? 'is-selected' : ''}} {{dayItem.isRangeLeft ? 'is-selected-left' : ''}} {{dayItem.isRangeRight ? 'is-selected-right' : ''}} {{dayItem.isInRange? 'is-selected-in-range' : ''}}"
            style="background-color: {{dayItem.isInRange ? rangeColor : dayItem.isRangeLeft ? startRangeColor : dayItem.isRangeRight ? endRangeColor : myItem.value === dayItem.value ? themeColor : ''}}"
            >
              {{dayItem.day}}  
            </view>
          </view>
        </swiper-item>
    </swiper>
  </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
.ui-calendar {
  background-color: white;
  .calendar-title {
    height:50px;

    .calendar-weekday {
      height:50px;
      width:14.2857%;
      float: left;
      line-height: 50px;
      text-align: center;
    }
  }
  .calendar-wrap {
    height: 300px;
  }
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
        horizontal-align: middle;
        line-height: 50px;
        .calendar-day-cell {
          width: 32px;
          height: 32px;
          line-height: 32px;
          margin: 9px auto;
          border-radius: 16px;
        }
        .not-this-month {
          color: gray;
          /* display: none; */
        }
        .is-this-month {
          color: black
        }
        .is-holiday {
          color: red
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
</style>
