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

const weekPage = ref(0)
const monthsArray = ref([])
const oldItem = ref(null)
const scrollTop = ref(0)
const oldRangeLeftItem = ref(null)
const oldRangeRightItem = ref(null)
const heightCount = ref(50)
const pageCount = ref(0)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'weekPage')) weekPage.value = patch['weekPage']
  if (Object.prototype.hasOwnProperty.call(patch, 'monthsArray')) monthsArray.value = patch['monthsArray']
  if (Object.prototype.hasOwnProperty.call(patch, 'oldItem')) oldItem.value = patch['oldItem']
  if (Object.prototype.hasOwnProperty.call(patch, 'scrollTop')) scrollTop.value = patch['scrollTop']
  if (Object.prototype.hasOwnProperty.call(patch, 'oldRangeLeftItem')) oldRangeLeftItem.value = patch['oldRangeLeftItem']
  if (Object.prototype.hasOwnProperty.call(patch, 'oldRangeRightItem')) oldRangeRightItem.value = patch['oldRangeRightItem']
  if (Object.prototype.hasOwnProperty.call(patch, 'heightCount')) heightCount.value = patch['heightCount']
  if (Object.prototype.hasOwnProperty.call(patch, 'pageCount')) pageCount.value = patch['pageCount']
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
    startMonthAnchor = moment().subtract(dateRange.value[0], 'months').subtract(1, 'weeks').format('YYYY/MM/DD');
    endMonthAnchor = moment().add(dateRange.value[1] + 1, 'months').format('YYYY/MM/DD');
  }
  for (let i = 0;; i++) {
    // console.log(startMonthAnchor)
    let year = moment(startMonthAnchor).year();
    let month = moment(startMonthAnchor).month() + 1;
    let day = moment(startMonthAnchor).date();
    let startMonthDater = new Dater(year, month, day).weekDays; // Dater使用的是正常月
    // console.log(startMonthDater)
    let monthArray = getWeekArray(startMonthDater, i);
    monthArray.monthIndex = i;
    monthsArray.value.push(monthArray);
    if (moment(startMonthAnchor).isSame(endMonthAnchor, 'month')) {
      // 相同
      break;
    }
    startMonthAnchor = moment(startMonthAnchor).add(1, 'weeks').format('YYYY/MM/DD');
    // console.log(startMonthAnchor.format('YYYY-MM-DD'))
  }
  // console.log(weekDays)
  // console.log(weekDays)
  console.log(momentTransToItem(moment(value.value)));
  if (value.value) {
    let wIndex = momentTransToItem(moment(value.value)).weekIndex;
    let iIndex = momentTransToItem(moment(value.value)).itemIndex;
    monthsArray.value[wIndex].data[iIndex].isClicked = true;
    oldItem.value = monthsArray.value[wIndex].data[iIndex];
    setData({
      weekPage: wIndex
    });
  }
  // }, 3000);
  // }, 3000);
  setData({
    monthsArray: monthsArray.value,
    monthTitleStyle: objectToStyle(monthTitleStyle.value),
    calendarWrapStyle: objectToStyle(calendarWrapStyleObj())
  });
  // let startMoment
  // if (startShow.value === 'today') {
  //   startMoment = moment()
  // } else {
  //   startMoment = moment(startShow.value)
  // }

  // selectRange(mIndex, dIndex)
  // }
  // for (let i = 0; i < monthsArray.value.length; i++) {
  //   if (itemTransToMoment(monthsArray.value[i]).isSame(startMoment, 'month')) {
  //     setData({
  //       scrollTop: monthsArray.value[i].positionY
  //     })
  //   }
  // }
})

const changeHandler = (e) => {
  e = e.detail.current;
  triggerEvent('weekchange', `${monthsArray.value[e].data[0].year}/${monthsArray.value[e].data[0].month >= 10 ? '' : '0'}${monthsArray.value[e].data[0].month}/${monthsArray.value[e].data[0].day >= 10 ? '' : '0'}${monthsArray.value[e].data[0].day}`);
}

const calendarWrapStyleObj = () => {
  let style = {};
  style.height = height.value + 'px';
  console.log(style);
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
      if (moment.isSame(itemTransToMoment(monthsArray.value[i].data[j]))) {
        return monthsArray.value[i].data[j];
      }
    }
  }
}

const inRangeSelect = (rightItem, startI, endI, select) => {
  for (let i = startI; i <= endI; i++) {
    for (let j = 0; j < monthsArray.value[startI].data.length; j++) {
      // console.log(monthsArray.value[i].data[j])
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

const selectSingle = (mIndex, dIndex, selectItem) => {
  if (oldItem.value) {
    oldItem.value.isClicked = false;
  }
  monthsArray.value[mIndex].data[dIndex].isClicked = true;
  oldItem.value = monthsArray.value[mIndex].data[dIndex];
  triggerEvent('changed', selectItem.value);
  // $emit('change', AnchorToDayString(timeAnchor))
}

const touchStartHandler = (e) => {
  // console.log(e)
  let mIndex = e.currentTarget.dataset.monthIndex;
  let dIndex = e.currentTarget.dataset.dayIndex;
  let selectItem = monthsArray.value[mIndex].data[dIndex];
  selectSingle(mIndex, dIndex, selectItem);
  setData({
    monthsArray: monthsArray.value
  });
  // monthsArray.value['monthIndex'].
  // e.currentTarget.dataset.item.isThisMonth = false
  // console.log(monthsArray.value)

  // console.log(monthsArray.value)
}

const getWeekArray = (date, monthIndex) => {
  var weekArray = {};
  weekArray.data = [];
  for (let i = 0; i < date.data.length; i++) {
    let obj = {};
    obj.itemIndex = i;
    obj.day = date.data[i].day - 1;
    obj.month = date.data[i].month;
    obj.year = date.data[i].year;
    obj.isClicked = false;
    obj.weekIndex = pageCount.value;
    obj.value = `${obj.year}/${obj.month < 10 ? '0' : ''}${obj.month}/${obj.day < 10 ? '0' : ''}${obj.day}`;
    // console.log(moment(obj.value).weekday())
    if ([0, 6].indexOf(moment(obj.value).weekday()) !== -1) {
      obj.isHoliday = true;
    }
    weekArray.data.push(obj);
  }
  weekArray.pageIndex = pageCount.value;
  pageCount.value++;
  return weekArray;
}

</script>

<template>
<view class="ui-w-calendar">
      <view class="calendar-title">
          <view wx:for="{{['日', '一', '二', '三', '四', '五', '六']}}" class="calendar-weekday">
            {{item}}
          </view>
        </view>
    <swiper class="calendar-wrap"           
      current="{{weekPage}}"
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
            class="calendar-day-cell {{dayItem.isHoliday ? 'is-holiday' : ''}} {{dayItem.isClicked ? 'is-selected' : ''}}  "    
            style="background-color:{{dayItem.isClicked ? themeColor : ''}} "
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
.ui-w-calendar {
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
    height: 50px;
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

        .is-this-month {
          color: black
        }
        .is-holiday {
          background-color: white;
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
