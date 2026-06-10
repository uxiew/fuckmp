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
const statusBarHeight = ref(0)
const headerHeight = ref(0)
const radioCalendar = ref(false)
const radioDate = ref('')
const radioYear = ref('')
const radioMonth = ref('')
const radioDay = ref('')
const dateobj = ref({})
const monthrange = ref([])
const defaultMonthrange = ref([])
const rangeCalendar = ref(false)
const rangeCalendarDefault = ref(false)
const differ = ref('')
const differShow = ref(false)
const rangeDate = ref('')
const rangeDate2 = ref('')
const rangestart = ref('')
const rangeend = ref('')
const rangestart2 = ref('')
const rangeend2 = ref('')
const differ2 = ref('')
const height = ref(0)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'statusBarHeight')) statusBarHeight.value = patch['statusBarHeight']
  if (Object.prototype.hasOwnProperty.call(patch, 'headerHeight')) headerHeight.value = patch['headerHeight']
  if (Object.prototype.hasOwnProperty.call(patch, 'radioCalendar')) radioCalendar.value = patch['radioCalendar']
  if (Object.prototype.hasOwnProperty.call(patch, 'radioDate')) radioDate.value = patch['radioDate']
  if (Object.prototype.hasOwnProperty.call(patch, 'radioYear')) radioYear.value = patch['radioYear']
  if (Object.prototype.hasOwnProperty.call(patch, 'radioMonth')) radioMonth.value = patch['radioMonth']
  if (Object.prototype.hasOwnProperty.call(patch, 'radioDay')) radioDay.value = patch['radioDay']
  if (Object.prototype.hasOwnProperty.call(patch, 'dateobj')) dateobj.value = patch['dateobj']
  if (Object.prototype.hasOwnProperty.call(patch, 'monthrange')) monthrange.value = patch['monthrange']
  if (Object.prototype.hasOwnProperty.call(patch, 'defaultMonthrange')) defaultMonthrange.value = patch['defaultMonthrange']
  if (Object.prototype.hasOwnProperty.call(patch, 'rangeCalendar')) rangeCalendar.value = patch['rangeCalendar']
  if (Object.prototype.hasOwnProperty.call(patch, 'rangeCalendarDefault')) rangeCalendarDefault.value = patch['rangeCalendarDefault']
  if (Object.prototype.hasOwnProperty.call(patch, 'differ')) differ.value = patch['differ']
  if (Object.prototype.hasOwnProperty.call(patch, 'differShow')) differShow.value = patch['differShow']
  if (Object.prototype.hasOwnProperty.call(patch, 'rangeDate')) rangeDate.value = patch['rangeDate']
  if (Object.prototype.hasOwnProperty.call(patch, 'rangeDate2')) rangeDate2.value = patch['rangeDate2']
  if (Object.prototype.hasOwnProperty.call(patch, 'rangestart')) rangestart.value = patch['rangestart']
  if (Object.prototype.hasOwnProperty.call(patch, 'rangeend')) rangeend.value = patch['rangeend']
  if (Object.prototype.hasOwnProperty.call(patch, 'rangestart2')) rangestart2.value = patch['rangestart2']
  if (Object.prototype.hasOwnProperty.call(patch, 'rangeend2')) rangeend2.value = patch['rangeend2']
  if (Object.prototype.hasOwnProperty.call(patch, 'differ2')) differ2.value = patch['differ2']
  if (Object.prototype.hasOwnProperty.call(patch, 'height')) height.value = patch['height']
}

const radioinit = (thisdate) => {
  console.log(thisdate);
  dateobj.value.radioDate = thisdate;
  dateobj.value.radioDate = thisdate.split('/');
  radioDate.value = dateobj.value.radioDate;
  radioMonth.value = dateobj.value.radioDate[1];
  radioDay.value = dateobj.value.radioDate[2];
  setData({
    radioDate: thisdate,
    radioMonth: dateobj.value.radioDate[1],
    radioDay: dateobj.value.radioDate[2]
  });
  console.log(radioDate.value, '11111');
}

const rangeinit = (thisdate) => {
  let start, end;
  dateobj.value.rangestart = thisdate.rangedate[0];
  dateobj.value.rangeend = thisdate.rangedate[1];
  start = dateobj.value.rangestart.split('/');
  end = dateobj.value.rangeend.split('/');
  // rangestart.value = `${start[1]}月${start[2]}日`
  // rangeend.value = `${end[1]}月${end[2]}日`
  // rangestart.value = `${start[1]}月${start[2]}日`
  // rangeend.value = `${end[1]}月${end[2]}日`
  setData({
    rangestart: `${start[1]}月${start[2]}日`,
    rangeend: `${end[1]}月${end[2]}日`
  });
}

const rangeinit2 = (thisdate) => {
  console.log('rangeinit2', thisdate);
  let start, end;
  dateobj.value.rangestart2 = thisdate.rangedate2[0];
  dateobj.value.rangeend2 = thisdate.rangedate2[1];
  start = dateobj.value.rangestart2.split('/');
  end = dateobj.value.rangeend2.split('/');
  // rangestart2.value = `${start[1]}月${start[2]}日`
  // rangeend2.value = `${end[1]}月${end[2]}日`
  // rangestart2.value = `${start[1]}月${start[2]}日`
  // rangeend2.value = `${end[1]}月${end[2]}日`
  setData({
    rangestart2: `${start[1]}月${start[2]}日`,
    rangeend2: `${end[1]}月${end[2]}日`
  });
  console.log(rangestart2.value, rangeend2.value, start, end);
}

const selectedChange = (e) => {
  radioinit(e.detail);
  setTimeout(() => {
    radioCalendar.value = false;
    setData({
      radioCalendar: false
    });
  }, 200);
}

const selectedStartHandler = (e) => {
  console.log(e, 'selectedStartHandler');
  rangeDate.value = e;
}

const selectedEndHandler = (e) => {
  console.log(e, 'selectedEndHandler');
  dateobj.value.rangedate = e.detail;
  setTimeout(() => {
    // rangeCalendar.value = false
    setData({
      rangeCalendar: false
    });
    // wxSafe.setStatusBarStyle({style: 'light'})
  }, 200);
  calculationDays();
  rangeinit(dateobj.value);
}

const failedHandler = (err) => {
  if (err === 1) {
    wxSafe.showToast({
      title: '您选择的时间超过30天,请重新选择'
    });
  }
}

const selectedStartHandler2 = (e) => {
  console.log(e, 'selectedStartHandler2开始');
  rangeDate2.value = e.detail;
  console.log(rangeDate2.value, 'rangeDate2.value');
}

const selectedEndHandler2 = (e) => {
  console.log(e, 'selectedEndHandler2结束');
  dateobj.value.rangedate2 = e.detail;
  console.log(dateobj.value.rangedate2);
  setTimeout(() => {
    var pages = getCurrentPages();
    var currPage = pages[pages.length - 1]; //当前页面
    var prevPage = pages[pages.length - 2];
    console.log(dateobj.value.rangedate2[0], dateobj.value.rangedate2[1], 'chuanhuiqude');
    calculationDays2();
    prevPage.setData({
      rangestart2: dateobj.value.rangedate2[0],
      rangeend2: dateobj.value.rangedate2[1],
      differ2: differ2.value
    });
    wxSafe.navigateBack();
  }, 200);
  rangeinit2(dateobj.value);
}

const failedHandler2 = (err) => {
  if (err === 1) {
    wxSafe.showToast({
      title: '您选择的时间超过30天,请重新选择'
    });
  }
}

const format = (obj) => {
  var date = new Date(obj);
  var y = 1900 + date.getYear();
  var m = '0' + (date.getMonth() + 1);
  var d = '0' + date.getDate();
  return y + '/' + m.substring(m.length - 2, m.length) + '/' + d.substring(d.length - 2, d.length);
}

const calculationDays = () => {
  let start, end;
  start = Date.parse(dateobj.value.rangedate[0]);
  end = Date.parse(dateobj.value.rangedate[1]);
  differ.value = Math.floor((end - start) / (24 * 3600 * 1000));
  differShow.value = true;
  setData({
    differ: differ.value,
    differShow: true
  });
}

const calculationDays2 = () => {
  let start, end;
  start = Date.parse(dateobj.value.rangedate2[0]);
  end = Date.parse(dateobj.value.rangedate2[1]);
  differ2.value = Math.floor((end - start) / (24 * 3600 * 1000));
  setData({
    differ2: differ2.value
  });
}

onLoad(() => {
  // 计算时间范围
  let radiodate = new Date();
  let rangedate = new Date();
  let rangedate2 = new Date();
  radioDate.value = format(Date.parse(radiodate));
  let start, end, defaultStart, defaultEnd;
  start = format(rangedate.setMonth(new Date().getMonth()));
  end = format(rangedate.setMonth(new Date().getMonth() + 6));
  start = start.substring(0, 7);
  end = end.substring(0, 7);
  monthrange.value.push(start, end);
  defaultStart = format(rangedate2.setDate(new Date().getDate()));
  defaultEnd = format(rangedate2.setDate(new Date().getDate() + 2));
  defaultMonthrange.value.push(defaultStart, defaultEnd);
  setData({
    monthrange: monthrange.value,
    defaultMonthrange: defaultMonthrange.value
  });
  let date = new Date();
  radioinit(format(date));
  console.log(monthrange.value, defaultMonthrange.value, '12312311');
})

const navigateBack = () => {
  wxSafe.navigateBack();
}

</script>

<template>
<view>
      <ui-nav-bar slot="nav-bar" custom-style="{{ {backgroundColor:'#fff'} }}">
        <ui-row height="46">
          <ui-col vertical-align="middle" align="center" width="60" bindtap="navigateBack">
            <text>完成</text>
          </ui-col>
          <ui-col vertical-align="middle" align="center">
            <view>请选择入住离店日期</view>
          </ui-col>
          <ui-col vertical-align="middle" align="center" width="60">
          </ui-col>
        </ui-row>
      </ui-nav-bar>
      <view style="padding-top:{{NAV_HEIGHT}}"></view>
      <!-- 双选，默认选中 -->
      <ui-v-calendar
      height="{{height - headerHeight}}"
      select-range-mode
      max-range="{{30}}"
      date-range="{{[3,3]}}"
      value="{{defaultMonthrange}}"
      bindselectedstart="selectedStartHandler2"
      bindselectedend="selectedEndHandler2"
      bindfailed="failedHandler2($event)"
    ></ui-v-calendar>
      <!-- 双选，默认选中结束 -->
  </view>
</template>

<style lang="scss" scoped>
// calendar2.less
  .swiper-slide {
    .ui-image {
      width: 100%;
  }
  }
  .win{
    padding:10px 30px; 
  }
  .smalltitle{
    font-size:12px;
    color:#666
  }
  .smalltitle2{
    background-color:#ebc7c8;
    color: #C01920;
    padding:0px 3px;
    border-radius: 5px;
    font-size:12px;
  }
  
  .btnyd {
    width:100%;
    background-color: #C01920;
    border-radius: 20px;
    border-color: #C01920;
    box-shadow: 3px 3px 8px #E57A7E;
    color: #fff;
  }

  .btnyd::after{
    border: none;
  }
</style>
