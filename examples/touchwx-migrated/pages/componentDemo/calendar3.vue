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
const date = ref('')
const dateDay = ref('')
const dateObj = ref({})
const dataMonth = ref('')

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'date')) date.value = patch['date']
  if (Object.prototype.hasOwnProperty.call(patch, 'dateDay')) dateDay.value = patch['dateDay']
  if (Object.prototype.hasOwnProperty.call(patch, 'dateObj')) dateObj.value = patch['dateObj']
  if (Object.prototype.hasOwnProperty.call(patch, 'dataMonth')) dataMonth.value = patch['dataMonth']
}

const selectedHandler = (e) => {
  console.log(e, 'selectedHandlerselectedHandler');
  let val = e.detail;
  console.log(val);
  dateObj.value = val.split('/');
  dateDay.value = `${dateObj.value[0]}年${dateObj.value[1]}月${dateObj.value[2]}日`;
  setData({
    dateObj: dateObj.value,
    dateDay: dateDay.value
  });
}

const weekHandler = (e) => {
  console.log(e, 'weekHandler');
  let dataMonth = e.detail.substring(0, 7);
  dataMonth = dataMonth.split('/');
  console.log(dataMonth);
  dataMonth.value = `${dataMonth[0]}年${dataMonth[1]}月`;
  console.log(dataMonth.value);
  setData({
    dataMonth: dataMonth.value
  });
}

const navigateBack = () => {
  wxSafe.navigateBack();
}

const format = (obj) => {
  var date = new Date(obj);
  var y = 1900 + date.getYear();
  var m = '0' + (date.getMonth() + 1);
  var d = '0' + date.getDate();
  return y + '/' + m.substring(m.length - 2, m.length) + '/' + d.substring(d.length - 2, d.length);
}

onLoad(() => {
  let date = new Date();
  date = Date.parse(date);
  date = format(date);
  date.value = date;
  dateObj.value = date.value.split('/');
  dateDay.value = `${dateObj.value[0]}年${dateObj.value[1]}月${dateObj.value[2]}日`;
  dataMonth.value = `${dateObj.value[0]}年${dateObj.value[1]}月`;
  setData({
    date: date,
    dateObj: dateObj.value,
    dateDay: dateDay.value,
    dataMonth: dataMonth.value
  });
})

</script>

<template>
<view>
    <ui-nav-bar slot="nav-bar">
      <ui-row height="46">
        <ui-col vertical-align="middle" align="center" width="60" bindtap="navigateBack">
            <ui-icon type="arrow-left" size="16" color="#333"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="center">
          <view>{{dataMonth}}</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
        </ui-col>
      </ui-row>
    </ui-nav-bar>
    <view style="height:{{NAV_HEIGHT}}"></view>
    <view class="bg-blue">
        <ui-w-calendar
        value="{{date}}"
        bindchanged="selectedHandler"
        bindweekchange="weekHandler"
        date-range="{{[2,2]}}"
      ></ui-w-calendar>

    </view>
    <text block style="margin-top:10px;text-align:center">当前选中的日期是{{dateDay}}</text>
  </view>
</template>

<style lang="scss" scoped>
// calendar3.less
.ui-nav-bar{
  background-color: #39f;
  color:#fff
}
.calendartab{
  padding:10px 0
}
.ui-w-calendar{
  background-color: transparent;
  color:#fff;
}
.is-holiday{
  color:#fff !important;
}


.bg-blue{
  background-color:#3399FF; 
  width:100%; 
  height: 100px;
  position: relative;
}
</style>
