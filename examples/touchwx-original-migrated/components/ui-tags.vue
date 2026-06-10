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
  fixedWidth?: boolean
  fixedMaxTextLength?: string | number
  itemSpace?: string | number
  mode?: string
  iconPosition?: string
  iconSize?: string | number
  iconClass?: string
  selectValue?: number
  minWidth?: string | number
  colNumber?: string | number
  width?: string | number
  itemWidth?: string | number
}>(), {
  fixedMaxTextLength: 5,
  itemSpace: 10,
  mode: 'single',
  iconPosition: 'left',
  iconSize: 14,
  iconClass: 'ui-tag-icon'
})

const fixedColumnCount = ref(0)
const containerWidth = ref(0)
const itemStyle = ref({})

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'fixedColumnCount')) fixedColumnCount.value = patch['fixedColumnCount']
  if (Object.prototype.hasOwnProperty.call(patch, 'containerWidth')) containerWidth.value = patch['containerWidth']
  if (Object.prototype.hasOwnProperty.call(patch, 'itemStyle')) itemStyle.value = patch['itemStyle']
}

onMounted(() => {
  let query = wxSafe.createSelectorQuery().in(this);
  query.select('.ui-tags').boundingClientRect(res => {
    let count = getFixedColumnCount();
    setData({
      containerWidth: res.width,
      fixedColumnCount: count
    });
    init();
  }).exec();
})

const init = () => {
  let style = {};
  if (props.fixedWidth) {
    let avaWidth = containerWidth.value - props.itemSpace * (fixedColumnCount.value + 1);
    if (props.itemWidth) {
      style.width = props.itemWidth + 'px';
    } else {
      style.width = avaWidth / fixedColumnCount.value + 'px';
    }
    style.marginRight = props.itemSpace + 'px';
    style.marginLeft = 0;
  }
  let plainStyle = StyleHelper.getPlainStyle(style);
  setData({
    itemStyle: plainStyle
  });
}

const getFixedColumnCount = () => {
  if (props.colNumber) {
    return Number(props.colNumber);
  }
  return containerWidth.value > 360 ? 3 : 4;
}

const handleItemTap = (e) => {
  let index = e.currentTarget.dataset.index;
  triggerEvent('change', {
    index: index
  });
}

</script>

<template>
<view class="ui-tags">
    <view class="ui-tag-item"
      wx:for="{{ data }}"
      wx:key="index"
      style="{{ itemStyle }}">
      <view style="{{ item.checked ? item.tagSelectedStyle : item.tagStyle }}" data-index="{{ index }}" bindtap="handleItemTap">
        <block wx:if="{{ item.badge }}">
          <span
            wx:for="item.badge"
            wx:for-item="badge"
            class="corner left {{ badge['badge-class']}}">
            {{ badge['badge-text'] }}
          </span>
        </block>
        <ui-icon 
          wx:if="{{ iconPosition === 'left' && item.icon && !item.checked }}"
          type="{{ item.icon }}" 
          size="{{ iconSize }}"
          color="{{ item.checked ? (item.iconSelectedColor ? item.iconSelectedColor : item.iconColor) : item.iconColor }}"
          class="left">
        </ui-icon>
        <ui-icon
          wx:if="{{ iconPosition === 'left' && item.iconSelected && item.checked }}"
          type="{{ item.iconSelected }}"
          color="{{ item.checked ? (item.iconSelectedColor ? item.iconSelectedColor : item.iconColor) : item.iconColor }}"
          size="{{ iconSize }}"
          class="left">
        </ui-icon>
        {{item.text}}
        <ui-icon
          wx:if="{{ iconPosition === 'right' && item.icon && !item.checked }}"
          type="{{ item.icon }}" 
          color="{{ item.checked ? (item.iconSelectedColor ? item.iconSelectedColor : item.iconColor) : item.iconColor }}"
          size="{{ iconSize }}"
          class="right">
        </ui-icon>
        <ui-icon 
          wx:if="{{ iconPosition === 'right' && item.iconSelected && item.checked }}"
          type="{{ item.iconSelected }}"
          color="{{ item.checked ? (item.iconSelectedColor ? item.iconSelectedColor : item.iconColor) : item.iconColor }}"
          size="{{ iconSize }}"
          class="right">
        </ui-icon>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
.ui-tags {
  display: flex;
  flex-wrap: wrap;
}

.ui-tag-item {
  margin-bottom: 5px;
  margin-right: 5px;
  font-size: 14px;

  .ui-tag {
    padding: 0 5px;
    border-radius: 10px;
    text-align: center;
    height: 25px;
    display: flex;
    justify-content: center;
    align-items: center;
    line-height: 20px;
  }

  .ui-tag-icon {
    display:inline-block;
    width: 20px;
    height: 20px;
  }
  .corner {
    display:inline-block;
    width: 20px;
    height: 20px;
    border-radius: 5px;
    border-width: 1px;
    border-style: solid;
  }
  .left {
    margin-right: 5px;
  }
  .right {
    margin-left: 5px;
  }
}
</style>
