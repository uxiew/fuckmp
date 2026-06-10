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
const radioMonth = ref('')
const radioDay = ref('')
const dateobj = ref({})
const monthrange = ref([])
const defaultMonthrange = ref([])
const rangeCalendar = ref(false)
const rangeCalendarDefault = ref(false)
const differ = ref('')
const differ2 = ref('2')
const differShow = ref(false)
const rangestart = ref('')
const rangeend = ref('')
const rangestart2 = ref('')
const rangeend2 = ref('')
const height = ref(0)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'statusBarHeight')) statusBarHeight.value = patch['statusBarHeight']
  if (Object.prototype.hasOwnProperty.call(patch, 'headerHeight')) headerHeight.value = patch['headerHeight']
  if (Object.prototype.hasOwnProperty.call(patch, 'radioCalendar')) radioCalendar.value = patch['radioCalendar']
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
    radioDate: thisdate,
    radioMonth: dateobj.value.radioDate[1],
    radioDay: dateobj.value.radioDate[2]
  });
}

const format = (obj) => {
  var date = new Date(obj);
  var y = 1900 + date.getYear();
  var m = '0' + (date.getMonth() + 1);
  var d = '0' + date.getDate();
  return y + '/' + m.substring(m.length - 2, m.length) + '/' + d.substring(d.length - 2, d.length);
}

const radioCalendaropen = () => {
  // setData({
  //   radioCalendar:true
  // })
  wxSafe.navigateTo({
    url: '/pages/componentDemo/v-calendar3'
  });
}

const rangeCalendaropen = (state) => {
  // setData({
  //   rangeCalendar:true
  // })
  wxSafe.navigateTo({
    url: '/pages/componentDemo/v-calendar'
  });
}

const rangeCalendarDefaultOpen = () => {
  wxSafe.navigateTo({
    url: '/pages/componentDemo/v-calendar2'
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
  console.log(defaultMonthrange.value);
  rangestart2.value = defaultMonthrange.value[0];
  rangeend2.value = defaultMonthrange.value[1];
  setData({
    rangestart2: rangestart2.value,
    rangeend2: rangeend2.value,
    monthrange: monthrange.value,
    defaultMonthrange: defaultMonthrange.value
  });
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
              <ui-icon type="arrow-left" size="16" color="#333"></ui-icon>
          </ui-col>
          <ui-col vertical-align="middle" align="center">
            <view>纵向日历</view>
          </ui-col>
          <ui-col vertical-align="middle" align="center" width="60">
            
          </ui-col>
        </ui-row>
      </ui-nav-bar>
      <view style="margin-top:{{NAV_HEIGHT}}"></view>
        <!-- 双选，默认不选 -->
        <view class="sample_title">双选，默认不选</view>
        <view class="win">
        <ui-row>
          <ui-col width="30" vertical-align="middle">
            <ui-icon type="store"></ui-icon>
          </ui-col>
          <ui-col bindtap="rangeCalendaropen">
            <ui-row height="15">
              <ui-col align="left" class="smalltitle">入住</ui-col>
            </ui-row>
            <ui-row height="27" border-bottom style="padding-bottom:10px">
              <ui-col align="left">{{rangestart}}</ui-col>
              <ui-col width="35" align="center">
                <text class="smalltitle2" wx:show="{{differShow}}">{{differ}}晚</text>
              </ui-col>
            </ui-row>
          </ui-col>
          <ui-col bindtap="rangeCalendaropen" vertical-align="middle">
              <ui-row height="15" >
                  <ui-col space-right="25" align="right" class="smalltitle">离店</ui-col>
                </ui-row>
                <ui-row height="27" border-bottom style="padding-bottom:10px">
                  <ui-col space-right="25" align="right">{{rangeend}}</ui-col>
                </ui-row>
          </ui-col>
          <view style="position:absolute;right:0">
              <ui-icon type="arrow-right" size="12"></ui-icon>
          </view>
        </ui-row>
        </view>
      
        <!-- 双选，默认不选结束 -->
        <!-- 双选，默认选中 -->
        <view class="sample_title">双选，默认选中</view>
        <view class="win">
            <ui-row>
                <ui-col width="30" vertical-align="middle">
                  <ui-icon type="store"></ui-icon>
                </ui-col>
                <ui-col bindtap="rangeCalendarDefaultOpen">
                  <ui-row height="15">
                    <ui-col align="left" class="smalltitle">入住</ui-col>
                  </ui-row>
                  <ui-row height="27" border-bottom style="padding-bottom:10px">
                    <ui-col align="left">{{rangestart2}}</ui-col>
                    <ui-col width="35" align="center">
                      <text class="smalltitle2">{{differ2}}晚</text>
                    </ui-col>
                  </ui-row>
                </ui-col>
                <ui-col bindtap="rangeCalendarDefaultOpen" vertical-align="middle">
                    <ui-row height="15" >
                        <ui-col space-right="25" align="right" class="smalltitle">离店</ui-col>
                      </ui-row>
                      <ui-row height="27" border-bottom style="padding-bottom:10px">
                        <ui-col space-right="25" align="right">{{rangeend2}}</ui-col>
                      </ui-row>
                </ui-col>
                <view style="position:absolute;right:0">
                    <ui-icon type="arrow-right" size="12"></ui-icon>
                </view>
              </ui-row>
        </view>
        <!-- 双选，默认选中结束 -->
        <view class="sample_title">单选</view>
        <view class="win">
        <ui-row height="46" space-top="15" bindtap="radioCalendaropen">
            <ui-col width="30" vertical-align="middle">
              <ui-icon type="store"></ui-icon>
            </ui-col>
            <ui-col>
              <ui-row height="15">
                <ui-col align="left" class="smalltitle">时租房（仅限一天）</ui-col>
              </ui-row>
              <ui-row border-bottom style="padding-bottom:10px">
                <ui-col align="left">{{radioMonth}}月{{radioDay}}日</ui-col>
                <ui-col width="25">
                </ui-col>
              </ui-row>
            </ui-col>
            <ui-col width="30" vertical-align="middle" align="right" style="border-bottom:1px solid #ddd;">
                <ui-icon type="arrow-right" size="12"></ui-icon>
            </ui-col>
          </ui-row>
        </view>

        <!-- 单选结束 -->
        <view class="win">
            <ui-row space-top="15">
              <button class="btnyd">立即预订</button>
            </ui-row>
        </view>       
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
