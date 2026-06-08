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
const radioDate = ref('')
const radioMonth = ref('')
const radioDay = ref('')
const dateobj = ref({})
const monthrange = ref([])
const defaultMonthrange = ref([])
const rangeCalendar = ref(false)
const rangeCalendarDefault = ref(false)
const differ = ref('')
const differ2 = ref('')
const differShow = ref(false)
const rangeDate = ref('')
const rangeDate2 = ref('')
const rangestart = ref('')
const rangeend = ref('')
const rangestart2 = ref('')
const rangeend2 = ref('')
const height = ref(0)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'radioDate')) radioDate.value = patch['radioDate']
  if (Object.prototype.hasOwnProperty.call(patch, 'radioMonth')) radioMonth.value = patch['radioMonth']
  if (Object.prototype.hasOwnProperty.call(patch, 'radioDay')) radioDay.value = patch['radioDay']
  if (Object.prototype.hasOwnProperty.call(patch, 'dateobj')) dateobj.value = patch['dateobj']
  if (Object.prototype.hasOwnProperty.call(patch, 'monthrange')) monthrange.value = patch['monthrange']
  if (Object.prototype.hasOwnProperty.call(patch, 'defaultMonthrange')) defaultMonthrange.value = patch['defaultMonthrange']
  if (Object.prototype.hasOwnProperty.call(patch, 'rangeCalendar')) rangeCalendar.value = patch['rangeCalendar']
  if (Object.prototype.hasOwnProperty.call(patch, 'rangeCalendarDefault')) rangeCalendarDefault.value = patch['rangeCalendarDefault']
  if (Object.prototype.hasOwnProperty.call(patch, 'differ')) differ.value = patch['differ']
  if (Object.prototype.hasOwnProperty.call(patch, 'differ2')) differ2.value = patch['differ2']
  if (Object.prototype.hasOwnProperty.call(patch, 'differShow')) differShow.value = patch['differShow']
  if (Object.prototype.hasOwnProperty.call(patch, 'rangeDate')) rangeDate.value = patch['rangeDate']
  if (Object.prototype.hasOwnProperty.call(patch, 'rangeDate2')) rangeDate2.value = patch['rangeDate2']
  if (Object.prototype.hasOwnProperty.call(patch, 'rangestart')) rangestart.value = patch['rangestart']
  if (Object.prototype.hasOwnProperty.call(patch, 'rangeend')) rangeend.value = patch['rangeend']
  if (Object.prototype.hasOwnProperty.call(patch, 'rangestart2')) rangestart2.value = patch['rangestart2']
  if (Object.prototype.hasOwnProperty.call(patch, 'rangeend2')) rangeend2.value = patch['rangeend2']
  if (Object.prototype.hasOwnProperty.call(patch, 'height')) height.value = patch['height']
}

const radioinit = (thisdate) => {
  dateobj.value.radioDate = thisdate;
  dateobj.value.radioDate = thisdate.split('/');
  radioDate.value = dateobj.value.radioDate;
  radioMonth.value = dateobj.value.radioDate[1];
  radioDay.value = dateobj.value.radioDate[2];
  setData({
    radioDate: thisdate
  });
}

const selectedChange = (e) => {
  radioinit(e.detail);
  setTimeout(() => {
    var pages = getCurrentPages();
    var currPage = pages[pages.length - 1]; //当前页面
    var prevPage = pages[pages.length - 2];
    console.log(dateobj.value.radioDate, 'chuanhuiqude');
    prevPage.setData({
      radioMonth: dateobj.value.radioDate[1],
      radioDay: dateobj.value.radioDate[2]
    });
    wxSafe.navigateBack();
  }, 200);
}

const format = (obj) => {
  var date = new Date(obj);
  var y = 1900 + date.getYear();
  var m = '0' + (date.getMonth() + 1);
  var d = '0' + date.getDate();
  return y + '/' + m.substring(m.length - 2, m.length) + '/' + d.substring(d.length - 2, d.length);
}

onLoad(() => {
  // 计算时间范围
  let radiodate = new Date();
  let rangedate2 = new Date();
  let date = new Date();
  radioinit(format(date));
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
              <ui-icon type="close" size="16" color="#333"></ui-icon>
          </ui-col>
          <ui-col vertical-align="middle" align="center">
            <view>选择日期</view>
          </ui-col>
          <ui-col vertical-align="middle" align="center" width="60">
            
          </ui-col>
        </ui-row>
      </ui-nav-bar>
      <view style="margin-top:{{NAV_HEIGHT}}"></view>
      <ui-v-calendar
      select-range-mode="{{false}}"
      header-height="30"
      height="319"
      date-range="{{[3,3]}}"
      show-month-range="{{monthrange}}"
      bindchange="selectedChange"
      value="{{radioDate}}"
      theme-color="red"
    ></ui-v-calendar>
  
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
    background-color: #C01920;
    border-radius: 20px;
    border-color: #C01920;
    box-shadow: 3px 3px 8px #E57A7E;
    color: #fff;
  }
</style>
