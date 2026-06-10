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
const headerHeight = ref(0)
const radioDate = ref('')
const radioMonth = ref('')
const radioDay = ref('')
const dateobj = ref({})
const monthrange = ref([])
const defaultMonthrange = ref([])
const rangeDate = ref('')
const rangestart = ref('')
const rangeend = ref('')
const height = ref(0)
const differ = ref('')

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'headerHeight')) headerHeight.value = patch['headerHeight']
  if (Object.prototype.hasOwnProperty.call(patch, 'radioDate')) radioDate.value = patch['radioDate']
  if (Object.prototype.hasOwnProperty.call(patch, 'radioMonth')) radioMonth.value = patch['radioMonth']
  if (Object.prototype.hasOwnProperty.call(patch, 'radioDay')) radioDay.value = patch['radioDay']
  if (Object.prototype.hasOwnProperty.call(patch, 'dateobj')) dateobj.value = patch['dateobj']
  if (Object.prototype.hasOwnProperty.call(patch, 'monthrange')) monthrange.value = patch['monthrange']
  if (Object.prototype.hasOwnProperty.call(patch, 'defaultMonthrange')) defaultMonthrange.value = patch['defaultMonthrange']
  if (Object.prototype.hasOwnProperty.call(patch, 'rangeDate')) rangeDate.value = patch['rangeDate']
  if (Object.prototype.hasOwnProperty.call(patch, 'rangestart')) rangestart.value = patch['rangestart']
  if (Object.prototype.hasOwnProperty.call(patch, 'rangeend')) rangeend.value = patch['rangeend']
  if (Object.prototype.hasOwnProperty.call(patch, 'height')) height.value = patch['height']
  if (Object.prototype.hasOwnProperty.call(patch, 'differ')) differ.value = patch['differ']
}

const radioinit = (thisdate) => {
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

const selectedStartHandler = (e) => {
  rangeDate.value = e;
}

const selectedEndHandler = (e) => {
  dateobj.value.rangedate = e.detail;
  setTimeout(() => {
    var pages = getCurrentPages();
    var currPage = pages[pages.length - 1]; //当前页面
    var prevPage = pages[pages.length - 2];
    console.log(dateobj.value.rangedate[0], dateobj.value.rangedate[1], 'chuanhuiqude');
    calculationDays();
    prevPage.setData({
      rangestart: dateobj.value.rangedate[0],
      rangeend: dateobj.value.rangedate[1],
      differ: differ.value
    });
    wxSafe.navigateBack();
  }, 500);
  rangeinit(dateobj.value);
}

const failedHandler = (err) => {
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

onLoad(() => {
  // 计算时间范围
  let rangedate = new Date();
  let rangedate2 = new Date();
  let start, end;
  start = format(rangedate.setMonth(new Date().getMonth()));
  end = format(rangedate.setMonth(new Date().getMonth() + 6));
  start = start.substring(0, 7);
  end = end.substring(0, 7);
  monthrange.value.push(start, end);
  setData({
    monthrange: monthrange.value
  });
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
      <view style="margin-top:{{NAV_HEIGHT}}"></view>
            <ui-v-calendar
              height="{{height - headerHeight}}"
              select-range-mode
              show-month-range="{{monthrange}}"
              max-range="{{30}}"
              date-range="{{[3,3]}}"
              bindselectedstart="selectedStartHandler"
              bindselectedend="selectedEndHandler"
              bindfailed="failedHandler"
            ></ui-v-calendar>
        <!-- 双选，默认不选结束 -->      
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
