<script setup lang="ts">
import { onLoad, ref } from 'vue'

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
      createMapContext() {
        return { moveToLocation() {} }
      },
      openSysMap() {}
    }

const NAV_HEIGHT = ref(0)
const datePage = ref('')
const date = ref('')
const dateobj = ref({})
const dateyear = ref(null)
const datemonth = ref(null)
const dateday = ref(null)
const monthrange = ref([])
const contentHeight = ref(0)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'datePage')) datePage.value = patch['datePage']
  if (Object.prototype.hasOwnProperty.call(patch, 'date')) date.value = patch['date']
  if (Object.prototype.hasOwnProperty.call(patch, 'dateobj')) dateobj.value = patch['dateobj']
  if (Object.prototype.hasOwnProperty.call(patch, 'dateyear')) dateyear.value = patch['dateyear']
  if (Object.prototype.hasOwnProperty.call(patch, 'datemonth')) datemonth.value = patch['datemonth']
  if (Object.prototype.hasOwnProperty.call(patch, 'dateday')) dateday.value = patch['dateday']
  if (Object.prototype.hasOwnProperty.call(patch, 'monthrange')) monthrange.value = patch['monthrange']
  if (Object.prototype.hasOwnProperty.call(patch, 'contentHeight')) contentHeight.value = patch['contentHeight']
}

const selectedHandler = (val) => {
  let e = val.detail;
  init(e);
}

const monthChangeHandler = (val) => {
  let e = val.detail;
  changeDate(e);
}

const bindselectedstart = (val) => {
  let e = val.detail;
}

const bindselectedend = (val) => {
  let e = val.detail;
}

const nextchange = () => {
  // 结束时间范围的时间戳
  let endrange = Date.parse(new Date(monthrange.value[1]));
  let arr = monthrange.value[1].split('/');
  endrange = new Date(arr[0], arr[1] - 1);
  endrange = Date.parse(endrange);
  let date = new Date(dateobj.value.arr[0], dateobj.value.arr[1] - 1);
  date.setMonth(date.getMonth() + 1);
  // 改变后的日期时间戳
  // 改变后的日期时间戳
  date = Date.parse(date);
  if (date > endrange) {
    return false;
  } else {
    dateobj.value.date = format(date);
    changeDate(dateobj.value.date);
    datePage.value = dateobj.value.arr[0] + '/' + dateobj.value.arr[1];
    setData({
      datePage: datePage.value
    });
  }
}

const prevchange = () => {
  // let date = new Date(dateobj.value.date)
  // 开始时间范围的时间戳
  let startrange = Date.parse(new Date(monthrange.value[0]));
  // let startrange
  // let startrange
  let arr = monthrange.value[0].split('/');
  startrange = new Date(arr[0], arr[1] - 1);
  startrange = Date.parse(startrange);
  let date = new Date(dateobj.value.arr[0], dateobj.value.arr[1] - 1);
  date.setMonth(date.getMonth() - 1);
  // 改变后的日期时间戳
  // 改变后的日期时间戳
  date = Date.parse(date);
  if (date < startrange) {
    return false;
  } else {
    dateobj.value.date = format(date);
    changeDate(dateobj.value.date);
    datePage.value = dateobj.value.arr[0] + '/' + dateobj.value.arr[1];
    setData({
      datePage: datePage.value
    });
  }
}

const qiandao = () => {
  let arr = date.value.split('/');
  let year = arr[0];
  let month = arr[1];
  let day = arr[2];
  wxSafe.showToast({
    title: `签到：${year} 年 ${month} 月 ${day} 日`,
    icon: "none"
  });
}

const format = (obj) => {
  var date = new Date(obj);
  var y = 1900 + date.getYear();
  var m = '0' + (date.getMonth() + 1);
  var d = '0' + date.getDate();
  return y + '/' + m.substring(m.length - 2, m.length) + '/' + d.substring(d.length - 2, d.length);
}

const init = (date) => {
  dateobj.value.date = date;
  dateobj.value.arr = date.split('/');
  setData({
    date: dateobj.value.date,
    dateobj: dateobj.value,
    dateyear: dateobj.value.arr[0],
    datemonth: dateobj.value.arr[1],
    dateday: dateobj.value.arr[2]
  });
}

const changeDate = (date) => {
  dateobj.value.date = date;
  dateobj.value.arr = date.split('/');
  setData({
    dateobj: dateobj.value,
    dateyear: dateobj.value.arr[0],
    datemonth: dateobj.value.arr[1]
  });
}

onLoad(() => {
  let start, end;
  let rangedate = new Date();
  let rangedate2 = new Date();
  start = format(rangedate.setMonth(new Date().getMonth() - 6));
  end = format(rangedate2.setMonth(new Date().getMonth() + 6));
  start = start.substring(0, 7);
  end = end.substring(0, 7);
  monthrange.value.push(start, end);
  setData({
    monthrange: monthrange.value
  });
  let date = new Date();
  init(format(date));
})

const navigateBack = () => {
  wxSafe.navigateBack();
}

</script>

<template>
<view>
    <view style="height:{{contentHeight}}px">
      <ui-nav-bar slot="nav-bar" custom-style="{{ {backgroundColor:'#39f',color:'#fff',borderBottom:'1px solid #39f'} }}">
        <ui-row height="46">
          <ui-col vertical-align="middle" align="center" width="60" bindtap="navigateBack">
              <ui-icon type="arrow-left" size="16" color="#fff"></ui-icon>
          </ui-col>
          <ui-col vertical-align="middle" align="center">
          </ui-col>
          <ui-col vertical-align="middle" align="center" width="60">
            
          </ui-col>
        </ui-row>
      </ui-nav-bar>
      <view style="height:{{NAV_HEIGHT}}"></view>
      <view class="personalbox">
        <view class="headimgbox">
          <image src="http://images.uileader.com/20180318/e62a5f83-64a6-428a-8726-7cbb65eab3dd.jpg"></image>
        </view>
            <ui-row class="infobox">
              <ui-col align="center">
                <text class="num">0</text>
                <text class="text">连续签到天数</text>
              </ui-col>
              <ui-col align="center">
                <text class="num">0</text>
                <text class="text">积分</text>
              </ui-col>
            </ui-row>
      </view>
      <view class="calendartab">
        <ui-row>
          <ui-col bindtap="prevchange" align="center" width="50">
            <ui-icon type="arrow-left" color="#666"></ui-icon>
          </ui-col>
          <ui-col>
            <text>{{dateyear}}年{{datemonth}}月</text>
          </ui-col>
          <ui-col bindtap="nextchange" align="center" width="50">
            <ui-icon type="arrow-right" color="#666"></ui-icon>
          </ui-col>
        </ui-row>
      </view>  
      <ui-calendar
        disable-past-days
        select-range-mode="{{false}}"
        bindmonthchange="monthChangeHandler"
        bindchange="selectedHandler"
        value="{{date}}"
        show-month-range ="{{['2017/12/01', '2018/12/01']}}"
        max-range="60"
        date-page="{{datePage}}"
        bindselectedstart="bindselectedstart"
        bindselectedend="bindselectedend"
      ></ui-calendar>
      <ui-row>
        <ui-col vertical-align="middle" space-left="10">
          <text>今日签到可得到10积分</text>
        </ui-col>
        <ui-col>
          <button bindtap="qiandao">签到</button>
        </ui-col>
      </ui-row>
      </view>
    </view>
</template>

<style lang="scss" scoped>
.win{
    background-color: #f4f2f3
  }
  .personalbox{
    background-color: #39f;
    .headimgbox{
      width:50px;
      height:50px;
      border-radius: 50%;
      margin:0 auto;
      border:1px solid #ccc;
      overflow: hidden;
      .ui-image{
        width:100%;
      }
    }
    .infobox{
      color:#fff;
      padding:20px 0;
      .num{
        font-size:16px;
      }
      .text{
        font-size:14px;
      }
    }
  
  }
  
  .calendartab{
    width:200px;
    margin:0 auto;
    text-align: center;
    line-height: 50px;
    background-color: #fff
  }
  .calendartab{
    margin-top:20px;
  }
  
  .calendar-head{
    background-color:#fff !important
  }
  .calendar-week-head{
    color:#333;
  }
</style>
