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

const props = withDefaults(defineProps<{
  data?: any[]
  width?: string | number
  height?: number
  themeColor?: string
  showTitle?: boolean
  nameKey?: string
  valueKey?: string
  border?: boolean
}>(), {
  data: [],
  width: '100%',
  height: 300,
  themeColor: '',
  showTitle: true,
  nameKey: 'name',
  valueKey: 'value'
})

const newArray = ref([])
const step = ref(0)
const dynamicWidth = ref(0)
const seqData = ref([{
  name: '请选择',
  selected: true
}])

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'newArray')) newArray.value = patch['newArray']
  if (Object.prototype.hasOwnProperty.call(patch, 'step')) step.value = patch['step']
  if (Object.prototype.hasOwnProperty.call(patch, 'dynamicWidth')) dynamicWidth.value = patch['dynamicWidth']
  if (Object.prototype.hasOwnProperty.call(patch, 'seqData')) seqData.value = patch['seqData']
}

onMounted(() => {
  reAttached();
})

onMounted(() => {
  reReady();
})

const reAttached = () => {
  titleMargin.value = props.showTitle ? 50 : 0;
  let traver = true;
  for (let i = 0; i < props.data.length; i++) {
    if (props.data[i].children) {
      traver = false;
      break;
    }
  }
  console.log(traver);
  if (traver) {
    var setting = {
      data: {
        simpleData: {
          idKey: "value",
          pIdKey: "parent",
          enable: true
        },
        key: {
          children: "children"
        }
      }
    };
    props.data = transition(setting, props.data);
  }
}

const reReady = () => {
  newArray.value = [];
  newArray.value.push([]);
  props.data.forEach(element => {
    element.deep = step.value;
    newArray.value[0].push(element);
  });
  setData({
    newArray: newArray.value,
    cascaderStyle: objectToStyle(cascaderStyleObj())
  });
  wxSafe.createSelectorQuery().in(this).select('.ui-cascader').boundingClientRect(res => {
    if (res) {
      dynamicWidth.value = res.width / 2;
      blockWidth.value = dynamicWidth.value;
      setData({
        cascaderContentWrapStyle: objectToStyle(cascaderContentWrapStyleObj()),
        cascaderBlockStyle: objectToStyle(cascaderBlockStyleObj())
      });
    }
  }).exec();
}

const cascaderBlockStyleObj = () => {
  let style = {};
  style.width = blockWidth.value + 'px';
  style.height = props.height - titleMargin.value + 'px';
  return style;
}

const cascaderContentWrapStyleObj = () => {
  let style = {};
  let trans;
  if (props.showTitle) {
    style.height = props.height - titleMargin.value + 'px';
  } else {
    style.height = props.height + 'px';
  }
  if (transmode.value === 'showtrans') {
    trans = -selectseqIndex.value * blockWidth.value;
  } else {
    if (step.value > 1) {
      trans = -(step.value - 1) * blockWidth.value;
    } else {
      trans = 0;
    }
  }
  style.transform = `translate3d(${trans}px, 0, 0)`;
  style.width = dynamicWidth.value + 'px';
  return style;
}

const cascaderStyleObj = () => {
  let style = {};
  if (('' + props.width).indexOf('%') > -1) {
    style.width = props.width;
  } else {
    style.width = props.width + 'px';
  }
  style.height = props.height + 'px';
  return style;
}

const nextStep = (e, tbmode) => {
  let selectIndex = e.currentTarget.dataset.index;
  step.value++;
  newArray.value.push([]);
  if (!newArray.value[step.value - 1][selectIndex].children) {
    // 点击最后的一项
    seqData.value.forEach(element => {
      element.selected = false;
    });
    newArray.value[step.value - 1].forEach(element => {
      element.selected = false;
    });
    newArray.value[step.value - 1][selectIndex].selected = true;
    step.value--;
    seqData.value.splice(-1, 1, {
      value: e.currentTarget.dataset.item.value,
      name: e.currentTarget.dataset.item.name,
      selected: true
    });
    setData({
      newArray: newArray.value,
      seqData: seqData.value
    });
    console.log(seqData.value);
    let send = [];
    seqData.value.forEach(element => {
      let obj = {};
      obj[props.nameKey] = element[props.nameKey];
      obj[props.valueKey] = element[props.valueKey];
      send.push();
    });
    triggerEvent('selected', seqData.value);
    return;
  }
  //添加轨迹词语
  //添加轨迹词语
  if (!tbmode) {
    seqData.value.splice(-1, 0, {
      name: e.currentTarget.dataset.item.name,
      value: e.currentTarget.dataset.item.value
    });
    seqData.value[seqData.value.length - 1].name = "请选择";
  } else {
    seqData.value.splice(-1, 0, {
      name: e.currentTarget.dataset.item.name
    });
    seqData.value.forEach(element => {
      element.selected = false;
    });
    seqData.value[seqData.value.length - 1].name = "请选择";
    seqData.value[seqData.value.length - 1].selected = true;
  }

  // 更新宽及其transfrom
  // 更新宽及其transfrom

  dynamicWidth.value = (e.currentTarget.dataset.item.deep + 2) * blockWidth.value;
  setData({
    cascaderContentWrapStyle: objectToStyle(cascaderContentWrapStyleObj())
  });

  // 换颜色
  // 换颜色

  newArray.value[step.value - 1].forEach(element => {
    element.selected = false;
  });
  newArray.value[step.value - 1][selectIndex].selected = true;
  newArray.value[step.value - 1][selectIndex].children.forEach(element => {
    element.deep = step.value;
    element.selected = false;
    newArray.value[step.value].push(element);
  });
  setData({
    newArray: newArray.value,
    seqData: seqData.value
  });
}

const turnBackStep = (e) => {
  let selectIndex = e.currentTarget.dataset.index;
  let selectBlock = e.currentTarget.dataset.item.deep;
  newArray.value = newArray.value.slice(0, selectBlock + 1);
  step.value = selectBlock;

  // 退回到某数组
  // 退回到某数组

  seqData.value.splice(step.value, seqData.value.length - step.value - 1);
  nextStep(e, true);
}

const transition = (setting, sNodes) => {
  if (setting.data.simpleData.enable) {
    var i,
      l,
      key = setting.data.simpleData.idKey,
      parentKey = setting.data.simpleData.pIdKey,
      childKey = setting.data.key.children;
    if (!key || key == "" || !sNodes) return [];
    var r = [];
    var tmpMap = {};
    for (i = 0, l = sNodes.length; i < l; i++) {
      tmpMap[sNodes[i][key]] = sNodes[i];
    }
    ;
    for (i = 0, l = sNodes.length; i < l; i++) {
      if (tmpMap[sNodes[i][parentKey]] && sNodes[i][key] != sNodes[i][parentKey]) {
        if (!tmpMap[sNodes[i][parentKey]][childKey]) tmpMap[sNodes[i][parentKey]][childKey] = [];
        tmpMap[sNodes[i][parentKey]][childKey].push(sNodes[i]);
      } else {
        r.push(sNodes[i]);
      }
    }
    ;
    return r;
  } else {
    return sNodes;
  }
}

const itemTapHandler = (e) => {
  console.log(e.currentTarget.dataset.item.name);
  transmode.value = 'addtrans';
  if (e.currentTarget.dataset.item.deep < step.value) {
    turnBackStep(e);
  } else {
    nextStep(e);
  }
}

const seqItemTapHandler = (e) => {
  transmode.value = 'showtrans';
  selectseqIndex.value = e.currentTarget.dataset.index;
  seqData.value.forEach(element => {
    element.selected = false;
  });
  seqData.value[e.currentTarget.dataset.index].selected = true;
  if (step.value !== e.currentTarget.dataset.index) {
    setData({
      cascaderContentWrapStyle: objectToStyle(cascaderContentWrapStyleObj())
    });
  }
  setData({
    seqData: seqData.value
  });
}

</script>

<template>
<view class="ui-cascader" style="{{cascaderStyle}}">
    <view wx:if="{{showTitle}}" class="cascader-name-wrap">
      <view class="cascader-name-item-wrap {{seqItem.selected ? 'cascader-name-item-wrap-clicked' : ''}} "
        style="color: {{seqItem.selected ? themeColor: ''}};border-bottom:{{seqItem.selected ? '2px solid ' + themeColor : ''}};"
        wx:for="{{seqData}}"
        wx:key="{{seqIndex}}"
        wx:for-item="seqItem"
        wx:for-index="seqIndex"
        data-index="{{seqIndex}}"
        bindtap="seqItemTapHandler"
        >
        <!-- <view class="cascader-name-item-name"> -->
          {{seqItem[nameKey]}}
        <!-- </view> -->
      </view>
      <!-- <view class="cascader-name-underline"></view> -->
    </view>
    <view class="cascader-content-view" style="width: {{width}}px; overflow:hidden">
      <view class="cascader-content-wrap" style="{{cascaderContentWrapStyle}}">
        <scroll-view class="cascader-block"
          scroll-y
          style="{{cascaderBlockStyle}}"
          wx:for="{{newArray}}"
          wx:key="{{blockIndex}}"
          wx:for-item="blockItem"
          wx:for-index="blockIndex"
        >
          <view class="cascader-block-item"
            wx:for="{{blockItem}}"
            wx:key="{{index}}"
            wx:for-item="item"
            wx:for-index="index"
            data-item="{{item}}"
            data-index="{{index}}"
            bindtap="itemTapHandler"
          >
            <view class="cascader-item {{item.selected ? 'cascader-item-clicked' : ''}} {{   border ? 'cascader-item-border' : ''}}"
              style="color:{{item.selected ? themeColor : ''}};"
            >
              {{item[nameKey]}}
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
.ui-cascader {
  overflow: hidden;
  background-color: #F5F5F5;
  .cascader-wrap {

  }

  .cascader-name-wrap {
    background-color: white;
    position: relative;
    border-bottom: 1px solid #F5F5F5;
    height: 50px;
  }

  .cascader-name-item-wrap {
    height: 50px;
    padding-left: 8px;
    padding-right: 8px;
    float: left;
    text-align: center;
    line-height: 50px;
    color: black;
    border-bottom: 0px solid black;
  }

  .cascader-item-border {
        border-bottom: 1px solid #F5F5F5;

  }

  .cascader-name-item-wrap-clicked {
    color: $theme-color;
    /* border-bottom: 2px solid $theme-color; */
  }

  /* .cascader-name-item-wrap:last-of-type {
    border-bottom: 2px solid red;

  } */




  .cascader-content-wrap {
    background-color: white;
    transition: 0.1s transform linear;
  }


  .cascader-block {
    float: left;
    height: 250px;


    .cascader-block-item {
      height: 40px;
      padding-left: 8px;
      padding-right: 8px;
      line-height: 40px;
      .cascader-item{
        overflow: hidden;
        text-overflow:ellipsis;
        white-space: nowrap;
        /* display: inline; */
        /* width: 100%; */
        /* border-bottom: 1px solid #F5F5F5; */
      }
      .cascader-item-clicked {
        color: $theme-color;
      }

    }
  }

  
}
</style>
