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
  width?: string | number
  height?: string | number
  value?: string | number
  corner?: string
  min?: string | number
  max?: string | number
  step?: string | number
  color?: string
}>(), {
  width: 100,
  height: 30,
  value: 0,
  corner: 'round',
  min: 0,
  step: 1,
  color: '#666'
})


function setData(_patch: Record<string, any>) {}

onMounted(() => {
  selfStep.value = Number(props.step);
  console.log(selfStep.value);
  if (props.max) {
    selfMax.value = Number(props.max);
  }
  selfMin.value = Number(props.min);
  selfValue.value = Number(props.value);
  if (selfValue.value < selfMin.value) {
    selfValue.value = selfMin.value;
  }
  setColor();
  setData({
    selfValue: selfValue.value,
    stepperBtnStyle: objectToStyle(stepperBtnStyleObj()),
    stepperNumStyle: objectToStyle(stepperNumStyleObj()),
    stepperStyle: objectToStyle(stepperStyleObj()),
    minusStyle: objectToStyle(minusStyleObj()),
    plusStyle: objectToStyle(plusStyleObj()),
    plusColStyle: objectToStyle(plusColStyleObj())
  });
})

const setColor = () => {
  if (selfValue.value === selfMin.value) {
    minusColor.value = '#ccc';
  } else {
    minusColor.value = props.color;
  }
  if (selfValue.value === selfMax.value) {
    plusColor.value = '#ccc';
  } else {
    plusColor.value = props.color;
  }
  setData({
    minusStyle: objectToStyle(minusStyleObj()),
    plusStyle: objectToStyle(plusStyleObj()),
    plusColStyle: objectToStyle(plusColStyleObj())
  });
}

const minusStyleObj = () => {
  let style = {};
  style.width = props.height / 3 + 'px';
  style.height = 2 + 'px';
  style['background-color'] = minusColor.value;
  style.transform = `translate(${props.height / 3 - 3}px, ${props.height / 2 - 1}px)`;
  return style;
}

const plusStyleObj = () => {
  let style = {};
  style.width = props.height / 3 + 'px';
  style.height = 2 + 'px';
  style['background-color'] = plusColor.value;
  style.transform = `translate(${props.height / 3 - 3}px, ${props.height / 2 - 1}px)`;
  return style;
}

const plusColStyleObj = () => {
  let style = {};
  style.width = 2 + 'px';
  style.height = props.height / 3 + 'px';
  style['background-color'] = plusColor.value;
  style.transform = `translate(${props.height / 2 - 4}px, ${props.height / 3 - 2}px)`;
  return style;
}

const plusHandler = () => {
  selfValue.value += selfStep.value;
  if (selfMax.value !== undefined && selfValue.value > selfMax.value) {
    selfValue.value = selfMax.value;
  }
  setData({
    selfValue: selfValue.value,
    value: selfValue.value
  });
  setColor();
  triggerEvent('addition', selfValue.value);
}

const minusHandler = () => {
  selfValue.value -= selfStep.value;
  if (selfValue.value < selfMin.value) {
    selfValue.value = selfMin.value;
  }
  setData({
    selfValue: selfValue.value,
    value: selfValue.value
  });
  setColor();
  triggerEvent('subtraction', selfValue.value);
}

const stepperStyleObj = () => {
  let style = {};
  style.height = props.height + 'px';
  style.width = props.width + 'px';
  style['line-height'] = props.height + 'px';
  return style;
}

const stepperBtnStyleObj = () => {
  let style = {};
  style.width = props.width / 4 + 'px';
  style.height = props.height + 'px';
  style['font-size'] = props.height / 2 + 'px';
  style['line-height'] = props.height + 'px';
  return style;
}

const stepperNumStyleObj = () => {
  let style = {};
  style.width = props.width / 2 + 'px';
  style.height = props.height + 'px';
  style['line-height'] = props.height + 'px';
  return style;
}

</script>

<template>
<view class="ui-stepper" style="{{stepperStyle}}">
    <view class="com stepper-minus {{corner === 'round' ? 'minus-corner': ''}}"
      style="{{stepperBtnStyle}}"
      bindtap="minusHandler"
    >
      <view class="minus"
        style="{{minusStyle}}"
      >
      </view>
    </view>
    <view class="com stepper-content"
    style="{{stepperNumStyle}}"
    >
      {{selfValue}}
    </view>
    <view class="com stepper-plus {{corner === 'round' ? 'plus-corner': ''}}"
      bindtap="plusHandler"
      style="{{stepperBtnStyle}}"
    >
      <view class="plus"
      style="{{plusStyle}}"
      ></view>
      <view class="plus-col"
      style="{{plusColStyle}}">
      </view>
    </view>
</view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
.ui-stepper {
  position: relative;
  .com {
    float: left;
    text-align: center;

  }
  .stepper-minus {
    border: 1px solid #CCC;

    position: relative;
    .minus {
      background-color: black;
    }
  }
  .stepper-content {
    border-bottom: 1px solid #CCC;
    border-top: 1px solid #CCC;
  }
  .stepper-plus {
    border: 1px solid #CCC;
    position: relative;
  }


}

.minus-corner{
    border-radius: 5px 0 0 5px;
}

.plus-corner {
  border-radius:  0 5px 5px 0;
}
</style>
