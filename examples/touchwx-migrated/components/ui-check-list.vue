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
  options?: any[]
  value?: any[]
  type?: string
  disabled?: boolean
  color?: string
  labelPosition?: string
  max?: string | number
  min?: string | number
}>(), {
  value: []
})

const innerCheckStyle = ref('')
const checkBoxStyle = ref('')

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'innerCheckStyle')) innerCheckStyle.value = patch['innerCheckStyle']
  if (Object.prototype.hasOwnProperty.call(patch, 'checkBoxStyle')) checkBoxStyle.value = patch['checkBoxStyle']
}

onMounted(() => {
  init();
})

const init = () => {
  let innerCheckStyle = _getInnerCheckStyle();
  let checkBoxStyle = _getCheckBoxStyle();
  setData({
    innerCheckStyle: innerCheckStyle,
    checkBoxStyle: checkBoxStyle
  });
  let {
    min,
    max
  } = data;
  if (min != null) {
    setData({
      selfMin: Number(min)
    });
  } else {
    setData({
      selfMin: 0
    });
  }
  if (max != null) {
    setData({
      selfMax: Number(max)
    });
  } else {
    setData({
      selfMax: 999
    });
  }
}

const _getInnerCheckStyle = () => {
  let style = {};
  let {
    color,
    type,
    disabled
  } = data;
  if (color) {
    if (!disabled && type !== 'plain') {
      style.backgroundColor = color;
      style.borderColor = color;
    }
  }
  return StyleHelper.getPlainStyle(style);
}

const _getCheckBoxStyle = () => {
  let style = {};
  let {
    color,
    type,
    disabled
  } = data;
  if (color) {
    if (!disabled && type === 'plain') {
      style.borderColor = color;
    }
  }
  return StyleHelper.getPlainStyle(style);
}

const handleChange = (e) => {
  let item = e.currentTarget.dataset.item;
  let itemValue = getItemValue(item);
  let {
    value,
    disabled,
    selfMax,
    selfMin
  } = data;
  if (!disabled) {
    let index = value.indexOf(itemValue);

    // 单选的场景
    if (selfMax === 1) {
      if (index < 0) {
        value = [itemValue];
        _changeValue(value);
      }
    } else {
      if (index < 0) {
        if (selfMax > value.length) {
          value.push(itemValue);
          _changeValue(value);
        }
      } else {
        if (selfMin < value.length) {
          value.splice(index, 1);
          _changeValue(value);
        }
      }
    }
  }
}

const _changeValue = (value) => {
  setData({
    value: value
  });
  triggerEvent('change', {
    value: value
  });
}

const getItemValue = (item) => {
  return typeof item === 'object' ? item.key : item;
}

</script>

<template>
<view class="ui-check-list {{ disabled ? 'ui-check-list-disabled' : '' }}">
    <view class="cells">
      <view wx:for="{{ options }}" wx:key="index" class="cell {{ labelPosition === 'left' ? 'cell__label-left' : ''}}" bindtap="handleChange" data-item="{{ item }}">
        <view class="cell_hd">
          <span class="ui-checkbox-inner {{ type ? 'ui-checkbox-inner__' + type :  '' }} {{ disabled ? 'is-disabled' : '' }} {{ util.getCheckedClass(value, item) }}" style="{{ util.isChecked(value, item) ? innerCheckStyle : '' }}">
            <span class="ui-checkbox__check" style="{{ checkBoxStyle }}"></span>
          </span>
        </view>
        <view class="cell_bd">
          <span>{{ util.getItem(options, item) }}</span>
          <view class="inline-desc" wx:if="{{ item.subTitle }}">{{ item.subTitle }}</view>
        </view>
      </view>
    </view>
  </view>
  <wxs module="util">
    module.exports = {
      isChecked: function (value, item) {
        if (typeof item === 'object') {
          return value.indexOf(item.key) > -1
        }
        return value.indexOf(item) > -1
      },
      getItem: function (options, item) {
        return typeof item === 'object' ? item.value : item
      },
      getCheckedClass: function (value, item) {
        if (typeof item === 'object') {
          return value.indexOf(item.key) > -1 ? 'is-checked' : ''
        }
        return value.indexOf(item) > -1 ? 'is-checked' : ''
      }
    }
  </wxs>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
/* migrated less import removed */
$disabled-color: #eff2f7;

.cells {
  background-color: #FFFFFF;
  line-height: 1.7;
  font-size: 14px;
  overflow: hidden;
  position: relative;
  padding-left: 15px;
  
  /* migrated less mixin: .mix-1px(1, 0, 1, 0, #d9d9d9); */
}

.cell {
  position: relative;
  display: flex;
  align-items: center;
  padding: 10px 15px;

  &.cell__label-left {
    flex-direction: row-reverse;
  }

  &:not(:first-child) {
    /* migrated less mixin: .mix-1px(1, 0, 0, 0, #d9d9d9); */
  }

  .cell_hd {
  }

  .cell_bd {
    flex: 1;
  }

  .inline-desc {
    color: #666;
    font-size: 14px;
  }
}

.ui-checkbox-inner {
  margin-left: 6px;
  margin-right: 6px;
  box-sizing: border-box;
  display: inline-block;
  vertical-align: middle;
  position: relative;
  width: 20px;
  height: 20px;
  border: 1px solid #c0ccda;
  border-radius: 3px;
  background-color: #fff;
  z-index: 1;
  transition: border-color 0.25s cubic-bezier(0.71, -0.46, 0.29, 1.46), background-color 0.25s cubic-bezier(0.71, -0.46, 0.29, 1.46);

  &.is-disabled {
    background-color: $disabled-color;
    border-color: #D3DCE6;

    &.is-checked {
      background-color: #D3DCE6;
      border-color: #D3DCE6;
      .ui-checkbox__check {
        border-color: #fff;
      }

      &.ui-checkbox-inner__plain {
        .ui-checkbox__check {
          border-color: $disabled-color;
        }
      }
    }
  }

  &.is-checked {
    background-color: $theme-color;
    border-color: $theme-color;
    .ui-checkbox__check {
      border-color: #fff;
      transform: rotate(45deg) scaleY(1);
    }

    &.ui-checkbox-inner__plain {
      background-color: transparent;
    }
  }

  &.ui-checkbox-inner__circle {
    width: 20px;
    height: 20px;
    border-radius: 50%;
  }

  &.ui-checkbox-inner__plain {
    border: 0;
    background-color: transparent;

    &.is-checked {
      .ui-checkbox__check {
        border-color: $theme-color;
      }
    }
  }
}
.ui-checkbox__check {
  box-sizing: content-box;
  position: absolute;
  top: 2px;
  left: 6px;
  content: "";
  height: 8px;
  width: 4px;
  border: 2px solid #fff;
  border-left: 0;
  border-top: 0;
  transform: rotate(45deg) scaleY(0);
  transition: transform 0.15s cubic-bezier(0.71, -0.46, 0.88, 0.6) 0.05s;
  transform-origin: center;
}

.ui-checkbox-inner__circle {
  .ui-checkbox__check {
    top: 3px;
    left: 7px;
    height: 7px;
    width: 3px;
  }
}

.ui-checkbox-inner__plain {
  .ui-checkbox__check {
    height: 12px;
    width: 6px;
    transition: transform 0.15s;
  }
}
</style>
