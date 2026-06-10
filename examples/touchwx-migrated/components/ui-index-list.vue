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

const windowHeight = ref(0)
const scrollTop = ref(0)
const bigIndex = ref('')
const blockOpacity = ref(0)
const indexData = ref([])

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'windowHeight')) windowHeight.value = patch['windowHeight']
  if (Object.prototype.hasOwnProperty.call(patch, 'scrollTop')) scrollTop.value = patch['scrollTop']
  if (Object.prototype.hasOwnProperty.call(patch, 'bigIndex')) bigIndex.value = patch['bigIndex']
  if (Object.prototype.hasOwnProperty.call(patch, 'blockOpacity')) blockOpacity.value = patch['blockOpacity']
  if (Object.prototype.hasOwnProperty.call(patch, 'indexData')) indexData.value = patch['indexData']
}

onMounted(() => {
  updateAttached();
  // data.value.splice(0, 0, {index: 'Top', items: [{name: 'ans'}]})
})

onMounted(() => {
  updateReady();
})

const updateAttached = () => {
  indexData.value.splice(0, indexData.value.length);
  data.value.forEach(element => {
    indexData.value.push(element.index);
  });
  if (showTop.value) {
    indexData.value.splice(0, 0, 'Top');
  }
  setData({
    indexData: indexData.value
  });
  try {
    let res = wxSafe.getSystemInfoSync();
    windowHeight.value = res.windowHeight;
    windowWidth.value = res.windowWidth;
  } catch (e) {}
}

const updateReady = () => {
  if (!flag.value) {
    flag.value = 1;
    return;
  }
  wxSafe.createSelectorQuery().in(this).select('.index-list-top').boundingClientRect(res => {
    indexListTopPosition.value = res.height;
    // console.log(indexListTopPosition.value)
    let posY = indexListTopPosition.value;
    for (let i = 0; i < data.value.length; i++) {
      data.value[i].position = posY;
      posY += 24 + 54 * data.value[i].items.length;
    }
    setData({
      indexSelectorWrapStyle: objectToStyle(indexSelectorWrapStyleObj()),
      indexListStyle: objectToStyle(indexListStyleObj()),
      indexFloatBlockStyle: objectToStyle(indexFloatBlockStyleObj())
    });
  }).exec();
}

const indexFloatBlockDynamicStyleObj = () => {
  let style = {};
  style.opacity = blockOpacity.value;
  return style;
}

const indexFloatBlockStyleObj = () => {
  let style = {};
  style.top = (windowHeight.value - 100) / 2 + 'px';
  style.left = (windowWidth.value - 100) / 2 + 'px';
  return style;
}

const indexListStyleObj = () => {
  let style = {};
  if (height.value) {
    style.height = height.value + 'px';
  } else {
    style.height = windowHeight.value + 'px';
  }
  return style;
}

const indexSelectorWrapStyleObj = () => {
  let height = data.value.length * 16;
  let style = {};
  if (color.value) {
    style.color = color.value;
  }
  style.height = height + 'px';
  style.top = (height.value - height) / 2 + 'px';
  // console.log(windowHeight.value, height, style.top)
  // console.log(windowHeight.value, height, style.top)
  return style;
}

const selectTouchStartHandler = (e) => {
  let fingerY = e.touches[0].clientY;
  let offsetTop = e.currentTarget.offsetTop;
  itemIndex.value = Math.floor((fingerY - offsetTop) / 16 - (showTop.value ? 1 : 0));
  console.log(itemIndex.value);
  if (itemIndex.value === -1) {
    scrollTop.value = 0;
    blockOpacity.value = 1;
    setData({
      scrollTop: scrollTop.value,
      bigIndex: 'Top',
      indexFloatBlockDynamicStyle: objectToStyle(indexFloatBlockDynamicStyleObj())
    });
  } else {
    scrollTop.value = data.value[itemIndex.value].position;
    blockOpacity.value = 1;
    setData({
      scrollTop: scrollTop.value,
      bigIndex: data.value[itemIndex.value].index,
      indexFloatBlockDynamicStyle: objectToStyle(indexFloatBlockDynamicStyleObj())
    });
  }
}

const selectTouchMoveHandler = (e) => {
  let fingerY = e.touches[0].clientY;
  let offsetTop = e.currentTarget.offsetTop;
  let itemIndex = Math.floor((fingerY - offsetTop) / 16 - (showTop.value ? 1 : 0));
  if (itemIndex === -1) {
    scrollTop.value = 0;
    setData({
      scrollTop: scrollTop.value,
      bigIndex: 'Top'
    });
  } else if (data.value[itemIndex]) {
    scrollTop.value = data.value[itemIndex].position;
    setData({
      scrollTop: scrollTop.value,
      bigIndex: data.value[itemIndex].index
    });
  }
}

const selectTouchEndHandler = () => {
  blockOpacity.value = 0;
  setData({
    indexFloatBlockDynamicStyle: objectToStyle(indexFloatBlockDynamicStyleObj())
  });
}

const selectTapHandler = (e) => {
  if (e.currentTarget.dataset.disabled) {
    return;
  }
  if (checkbox.value) {
    console.log(e.currentTarget.dataset.blockIndex, e.currentTarget.dataset.index);
    let item = data.value[e.currentTarget.dataset.blockIndex].items[e.currentTarget.dataset.index];
    item.checked = !item.checked;
  }
  setData({
    data: data.value
  });
  console.log(data.value);
  triggerEvent('customtap', e.currentTarget.dataset.item);
}

</script>

<template>
<view class="ui-index-list" style="height:px">
    <view class="index-list-wrap" style="height: {{height}}px">
      <view class="index-selector-wrap" 
      catchtouchstart="selectTouchStartHandler"
      catchtouchmove="selectTouchMoveHandler"
      catchtouchend="selectTouchEndHandler"
      style="{{indexSelectorWrapStyle}}">
        <view 
          class="index-selector-item"
          style="top: {{index * 16}}px"
          wx:for="{{indexData}}"
          wx:key="index"
          >{{item}}
        </view>
      </view>
      <scroll-view
        scroll-y	
        scroll-top="{{scrollTop}}"
        class="index-list"
        height="{{height}}"

        style="{{indexListStyle}}"
        >
        <view class="index-list-top">
          <view wx:if="{{showTop}}">
              <slot></slot>
          </view>
        </view>
        <view class="index-list-block"
          wx:for="{{data}}"
          wx:for-item="blockItem"
          wx:for-index="blockIndex"
          wx:key="{{blockIndex}}"
          >
          <view class="index-list-title">{{blockItem.index}}</view>
          <view class="index-list-content {{listItem.disabled ? 'index-list-content-disabled' : ''}}"
            data-item="{{listItem}}"
            data-name="{{listItem.name}}"
            data-index="{{listIndex}}"
            data-block-index="{{blockIndex}}"
            wx:for="{{blockItem.items}}"
            wx:for-item="listItem"
            wx:for-index="listIndex"
            wx:key="{{listIndex}}"
            bindtap="selectTapHandler"
          >
              {{listItem.name}}
          </view>
        </view>
      </scroll-view>
    </view>
    <view
      class="index-float-block"
      style="{{indexFloatBlockStyle}};{{indexFloatBlockDynamicStyle}}"
    >{{bigIndex}}</view>
    <!-- <view>UiIndexList Component</view> -->
  </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
.index-float-block {
    transition: opacity 1s;
    opacity: 0;
    position: fixed;
    text-align: center;
    width: 100px;
    height: 100px;
    border-radius: 50px;
    background-color: rgba(0, 0, 0, 0.5);
    font-size: 50px;
    line-height: 100px;
    color: white;
  }

  
.ui-index-list {
  position: relative;
  overflow: hidden;
  background-color: #FEFEFE;
  .index-selector-wrap {
    position: fixed;
    z-index: 2;
    font-size: 10px;
    right: 0px;
    text-align: center;
    width: 30px;
    color: $theme-color;
    border-radius: 5px;
    .index-selector-item {
      width: 30px;
      text-align: center;
      position: absolute;
      height: 16px;
    }
  }
  .index-list {
  }

  

  .index-list-title {
      height: 24px;
      font-size: 10px;
      background-color: #f4f6f8;
      color: #808080;
      line-height: 24px;
      padding-left: 8px;
    }
    .index-list-content {
      padding-left: 8px;
      height: 54px;
      line-height: 54px;
      border-bottom: #f4f6f8 solid 1px;
    }
    .index-list-content-disabled {
      padding-left: 8px;
      height: 54px;
      line-height: 54px;
      background-color: #CCC;
      border-bottom: #f4f6f8 solid 1px;
    }
    .index-list-button {
      float: right; 
      margin-top: 12px;
      margin-right: 28px
    }
}
</style>
