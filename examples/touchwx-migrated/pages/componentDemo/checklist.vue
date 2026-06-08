<script setup lang="ts">
import { ref } from 'vue'

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
const labelPosition = ref('')
const countryList = ref(['中国', '香港', '澳大利亚'])
const checklist1 = ref(['中国'])
const checklist2 = ref([])
const checklist3 = ref([])
const checklist4 = ref([])
const checklist5 = ref([])
const checklist6 = ref([])
const checklist7 = ref([])
const checklist8 = ref(['中国'])
const checklist9 = ref([])
const objectList = ref([{
  key: 'SZ',
  value: '深圳'
}, {
  key: 'GZ',
  value: '广州'
}, {
  key: 'ZH',
  value: '珠海'
}, {
  key: 'ST',
  value: '汕头'
}])
const objectListValue = ref(['SZ'])
const inlineDescList = ref([{
  key: '1',
  value: '广东',
  subTitle: '深圳，广州，东莞'
}, {
  key: '2',
  value: '浙江',
  subTitle: '杭州，宁波，嘉兴'
}, {
  key: '3',
  value: '江苏',
  subTitle: '南京，苏州，无锡'
}])
const inlineDescListValue = ref(['1'])
const inlineDescListValue2 = ref(['1'])

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'labelPosition')) labelPosition.value = patch['labelPosition']
  if (Object.prototype.hasOwnProperty.call(patch, 'countryList')) countryList.value = patch['countryList']
  if (Object.prototype.hasOwnProperty.call(patch, 'checklist1')) checklist1.value = patch['checklist1']
  if (Object.prototype.hasOwnProperty.call(patch, 'checklist2')) checklist2.value = patch['checklist2']
  if (Object.prototype.hasOwnProperty.call(patch, 'checklist3')) checklist3.value = patch['checklist3']
  if (Object.prototype.hasOwnProperty.call(patch, 'checklist4')) checklist4.value = patch['checklist4']
  if (Object.prototype.hasOwnProperty.call(patch, 'checklist5')) checklist5.value = patch['checklist5']
  if (Object.prototype.hasOwnProperty.call(patch, 'checklist6')) checklist6.value = patch['checklist6']
  if (Object.prototype.hasOwnProperty.call(patch, 'checklist7')) checklist7.value = patch['checklist7']
  if (Object.prototype.hasOwnProperty.call(patch, 'checklist8')) checklist8.value = patch['checklist8']
  if (Object.prototype.hasOwnProperty.call(patch, 'checklist9')) checklist9.value = patch['checklist9']
  if (Object.prototype.hasOwnProperty.call(patch, 'objectList')) objectList.value = patch['objectList']
  if (Object.prototype.hasOwnProperty.call(patch, 'objectListValue')) objectListValue.value = patch['objectListValue']
  if (Object.prototype.hasOwnProperty.call(patch, 'inlineDescList')) inlineDescList.value = patch['inlineDescList']
  if (Object.prototype.hasOwnProperty.call(patch, 'inlineDescListValue')) inlineDescListValue.value = patch['inlineDescListValue']
  if (Object.prototype.hasOwnProperty.call(patch, 'inlineDescListValue2')) inlineDescListValue2.value = patch['inlineDescListValue2']
}

const change = (e) => {
  console.log(e);
  let val = e.detail.value;
  wxSafe.showToast({
    title: val.join(','),
    icon: 'none'
  });
}

const navigateBack = () => {
  wxSafe.navigateBack();
}

</script>

<template>
<ui-nav-bar slot="nav-bar" custom-style="{{ {borderBottom:'1px solid rgba(231, 231, 231, 0.6)',backgroundColor:'#fff'} }}">
        <ui-row height="46">
          <ui-col vertical-align="middle" align="center" width="60" bindtap="navigateBack">
              <ui-icon type="arrow-left" size="16" color="#333"></ui-icon>
          </ui-col>
          <ui-col vertical-align="middle" align="center">
            <view>check-list</view>
          </ui-col>
          <ui-col vertical-align="middle" align="center" width="60">
            
          </ui-col>
        </ui-row>
      </ui-nav-bar>
      <view style="height:{{NAV_HEIGHT}}"></view>
  <view class="sample_title">多选，label在左侧</view>
  <ui-divider>样式为对号</ui-divider>
  <ui-check-list label-position="left" options="{{ countryList }}" type="plain" value="{{ checklist1 }}"></ui-check-list>
  <ui-divider>样式为圆形</ui-divider>
  <ui-check-list label-position="left" options="{{ countryList }}" type="circle" value="{{ checklist2 }}"></ui-check-list>

  <view class="sample_title">多选，label在右侧</view>
  <ui-divider>样式为方形</ui-divider>
  <ui-check-list label-position="right" options="{{ countryList }}" value="{{ checklist3 }}" ></ui-check-list>
  <ui-divider>样式为圆形</ui-divider>
  <ui-check-list label-position="right" options="{{ countryList }}" type="circle" value="{{ checklist4 }}"></ui-check-list>

  <view class="sample_title">单选</view>
  <ui-divider>label在左侧</ui-divider>
  <ui-check-list max="1" label-position="left" options="{{ countryList }}" type="plain" value="{{ checklist5 }}" ></ui-check-list>
  <ui-divider>label在右侧</ui-divider>
  <ui-check-list max="1" label-position="right" options="{{ countryList }}" type="circle" value="{{ checklist6 }}" ></ui-check-list>

  <view class="sample_title">设置最大值checklist</view>
  <ui-check-list max="2" options="{{ countryList }}" value="{{ checklist7 }}" ></ui-check-list>

  <view class="sample_title">自定义颜色</view>
  <ui-check-list options="{{ countryList }}" color="#e60012"></ui-check-list>

  <view class="sample_title">使用change事件</view>
  <ui-check-list options="{{ countryList }}" bindchange="change"></ui-check-list>

  <view class="sample_title">默认选中和禁用(中国被选中)</view>
  <ui-check-list options="{{ countryList }}" disabled value="{{ checklist8 }}" ></ui-check-list>

  <view class="sample_title">使用对象数组数据源</view>
  <ui-check-list options="{{ objectList }}" value="{{ objectListValue }}" ></ui-check-list>

  <view class="sample_title">使用副标题</view>
  <ui-divider>多选</ui-divider>
  <ui-check-list options="{{ inlineDescList }}" value="{{ inlineDescListValue }}"></ui-check-list>
  <ui-divider>单选</ui-divider>
  <ui-check-list max="1" options="{{ inlineDescList }}" value="{{ inlineDescListValue2 }}" type="circle"></ui-check-list>
</template>

<style lang="scss" scoped>
.demo{
  .is-checked .ui-checkbox-inner{
    background-image: url('~images/duigou.svg');
    background-size:70%;
    background-color: transparent;
    background-repeat: no-repeat;
    border:none
  }

 .is-checked .weui-cell__bd{
   color:#ff5723 
 }
  .ui-checkbox__check{
    border:none;
  }

  .ui-checkbox-inner{
    border:none
  }
}
</style>
