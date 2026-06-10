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
const list0 = ref([{
  text: '速度与激情8',
  tagStyle: tagStyle0
}, {
  text: '铁道飞虎',
  tagStyle: tagStyle0
}, {
  text: '罗曼蒂克消亡史',
  tagStyle: tagStyle0
}, {
  text: '绑架者',
  tagStyle: tagStyle0
}, {
  text: '地心引力',
  tagStyle: tagStyle0
}, {
  text: '一条狗的使命',
  tagStyle: tagStyle0
}])
const list00 = ref([{
  text: '速度与激情8',
  tagStyle: tagStyle00,
  tagSelectedStyle: selectStyle,
  checked: true
}, {
  text: '铁道飞虎',
  tagStyle: tagStyle00,
  tagSelectedStyle: selectStyle,
  checked: false
}, {
  text: '罗曼蒂克消亡史',
  tagStyle: tagStyle00,
  tagSelectedStyle: selectStyle,
  checked: false
}, {
  text: '绑架者',
  tagStyle: tagStyle00,
  tagSelectedStyle: selectStyle,
  checked: false
}, {
  text: '地心引力',
  tagStyle: tagStyle00,
  tagSelectedStyle: selectStyle,
  checked: false
}, {
  text: '一条狗的使命',
  tagStyle: tagStyle00,
  tagSelectedStyle: selectStyle,
  checked: false
}])
const list1 = ref([{
  text: '热门',
  tagStyle: tagStyle1
}, {
  text: '小吃快餐',
  tagStyle: tagStyle1
}, {
  text: '面包甜点',
  tagStyle: tagStyle1
}, {
  text: '北京菜',
  tagStyle: tagStyle1
}, {
  text: '川菜',
  tagStyle: tagStyle1
}, {
  text: '韩国料理',
  tagStyle: tagStyle1
}, {
  text: '江浙菜',
  tagStyle: tagStyle1
}, {
  text: '江浙菜',
  tagStyle: tagStyle1
}])
const list2 = ref([{
  text: '微型车',
  tagStyle: tagStyle2,
  tagSelectedStyle: selectStyle3,
  icon: 'plus2',
  iconSelected: 'duigou',
  checked: true
}, {
  text: '小型车',
  tagStyle: tagStyle2,
  tagSelectedStyle: selectStyle3,
  icon: 'plus2',
  iconSelected: 'duigou',
  checked: true
}, {
  text: '紧凑型',
  tagStyle: tagStyle2,
  tagSelectedStyle: selectStyle3,
  icon: 'plus2',
  iconSelected: 'duigou',
  checked: false
}, {
  text: '中型车',
  tagStyle: tagStyle2,
  tagSelectedStyle: selectStyle3,
  icon: 'plus2',
  iconSelected: 'duigou',
  checked: false
}, {
  text: '大中型',
  tagStyle: tagStyle2,
  tagSelectedStyle: selectStyle3,
  icon: 'plus2',
  iconSelected: 'duigou',
  checked: false
}, {
  text: '豪华车',
  tagStyle: tagStyle2,
  tagSelectedStyle: selectStyle3,
  icon: 'plus2',
  iconSelected: 'duigou',
  checked: false
}])
const list3 = ref([{
  text: '大众',
  tagStyle: tagStyle3,
  icon: 'close'
}, {
  text: '朗逸',
  tagStyle: tagStyle3,
  icon: 'close'
}, {
  text: '10-15万',
  tagStyle: tagStyle3,
  icon: 'close'
}])
const list8 = ref([{
  text: '早餐',
  tagStyle: tagStyle6,
  tagSelectedStyle: selectStyle2,
  checked: false
}, {
  text: '午餐',
  tagStyle: tagStyle6,
  tagSelectedStyle: selectStyle2,
  checked: false
}, {
  text: '下午茶',
  tagStyle: tagStyle6,
  tagSelectedStyle: selectStyle2,
  checked: false
}, {
  text: '晚餐',
  tagStyle: tagStyle6,
  tagSelectedStyle: selectStyle2,
  checked: false
}, {
  text: '夜宵',
  tagStyle: tagStyle6,
  tagSelectedStyle: selectStyle2,
  checked: false
}])
const fullWidth = ref(false)
const showPop = ref(true)
const selectValue = ref([])

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'list0')) list0.value = patch['list0']
  if (Object.prototype.hasOwnProperty.call(patch, 'list00')) list00.value = patch['list00']
  if (Object.prototype.hasOwnProperty.call(patch, 'list1')) list1.value = patch['list1']
  if (Object.prototype.hasOwnProperty.call(patch, 'list2')) list2.value = patch['list2']
  if (Object.prototype.hasOwnProperty.call(patch, 'list3')) list3.value = patch['list3']
  if (Object.prototype.hasOwnProperty.call(patch, 'list8')) list8.value = patch['list8']
  if (Object.prototype.hasOwnProperty.call(patch, 'fullWidth')) fullWidth.value = patch['fullWidth']
  if (Object.prototype.hasOwnProperty.call(patch, 'showPop')) showPop.value = patch['showPop']
  if (Object.prototype.hasOwnProperty.call(patch, 'selectValue')) selectValue.value = patch['selectValue']
}

const navigateBack = () => {
  wxSafe.navigateBack();
}

const singleTap = (e) => {
  let opt = e.detail.index;
  wxSafe.showToast({
    title: list00.value[opt].text,
    icon: 'none'
  });
  list00.value.forEach((item, index) => {
    item.checked = index === opt;
  });
  setData({
    list00: list00.value
  });
}

const multipleTap = (e) => {
  let opt = e.detail.index;
  list2.value[opt].checked = !list2.value[opt].checked;
  setData({
    list2: list2.value
  });
}

const sure = () => {
  var a = list2.value.filter((item, index) => {
    return item.checked;
  });
  selectValue.value = a;
  var str = a.map((item, index) => {
    return item.text;
  }).join(',');
  setData({
    list2: list2.value
  });
  wxSafe.showToast({
    title: str || '未选择任何标签',
    icon: 'none'
  });
}

const cancel = () => {
  list2.value.forEach((item, index) => {
    item.checked = false;
  });
  setData({
    list2: list2.value
  });
}

const delate = (e) => {
  let opt = e.detail.index;
  list3.value = list3.value.filter((item, index) => {
    return index != opt;
  });
  var str = list3.value.map((item, index) => {
    return item.text;
  }).join(',');
  wxSafe.showToast({
    title: str ? `还剩：` + str : '该组已经没有标签',
    icon: 'none'
  });
  setData({
    list3: list3.value
  });
}

const multipleTap2 = (e) => {
  let index = e.detail.index;
  list8.value[index].checked = !list8.value[index].checked;
  setData({
    list8: list8.value
  });
}

</script>

<template>
<view>
    <ui-nav-bar slot="nav-bar" custom-style="{{ {borderBottom:'1px solid rgba(231, 231, 231, 0.6)',backgroundColor:'#fff'} }}">
        <ui-row height="46">
          <ui-col vertical-align="middle" align="center" width="60" bindtap="navigateBack">
              <ui-icon type="arrow-left" size="16" color="#333"></ui-icon>
          </ui-col>
          <ui-col vertical-align="middle" align="center">
            <view>标签组</view>
          </ui-col>
          <ui-col vertical-align="middle" align="center" width="60">
            
          </ui-col>
        </ui-row>
      </ui-nav-bar>
      <view style="height:{{NAV_HEIGHT}}"></view>
    <view class="sample_title">标签展示</view>
    <view style="padding: 10px 10px;">
      <ui-tags data="{{list0}}"></ui-tags>
    </view>
    
    <view class="sample_title">标签点击触发</view>
    <view style="padding: 10px 10px;">
      <ui-tags 
        data="{{list00}}" 
        bindchange="singleTap" 
        ></ui-tags>
    </view>


    <view class="sample_title">点击删除</view>
    <view style="padding: 10px 10px;">
      <ui-tags 
        data="{{list3}}" 
        bindchange="delate"
        icon-position="right"
        icon-size="12"
        ></ui-tags>
    </view>

    <view class="sample_title">等宽标签</view>
    <view style="padding: 10px 0 5px 0;">
     <ui-tags 
        data="{{list8}}" 
        fixed-width
        bindchange="multipleTap2" 
        ></ui-tags>
    </view>

   

    <view class="sample_title">多项选择</view>
    <view style="padding: 10px 10px;">
      <ui-tags 
        data="{{list2}}" 
        fixed-width
        fixed-space="15"
        bindchange="multipleTap" 
        icon-position="right" 
        ></ui-tags>
      <button class="delAll" fullWidth="{{fullWidth}}" bindtap="cancel">清空</button>
      <button class="sure" fullWidth="{{fullWidth}}" bindtap="sure">确定</button>
    </view>

  
  </view>
</template>

<style lang="scss" scoped>
.delAll{
  display: inline-block;
  width: 48%;
  margin-right:2%;
  border: 1px solid #ccc;
  font-size: 12px;
  width: 48%;
}
.sure{
  display: inline-block;
  width: 48%;
  font-size: 12px;
  background: #FD5623;
  border:1px solid #FD5623;
  color: #fff;
}
</style>
