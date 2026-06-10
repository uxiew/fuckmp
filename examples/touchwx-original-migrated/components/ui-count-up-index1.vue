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
  from?: string | number
  to?: string | number
  duration?: string | number
  easing?: string
  mode?: string
  fromColor?: string
  toColor?: string
}>(), {
  duration: 1000,
  easing: 'easeOutQuad',
  mode: null
})

const num = ref(null)
const options = ref(null)
const state = ref(0)
const numColor = ref({})

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'num')) num.value = patch['num']
  if (Object.prototype.hasOwnProperty.call(patch, 'options')) options.value = patch['options']
  if (Object.prototype.hasOwnProperty.call(patch, 'state')) state.value = patch['state']
  if (Object.prototype.hasOwnProperty.call(patch, 'numColor')) numColor.value = patch['numColor']
}

onMounted(() => {
  makeOptions();
  if (props.mode === AUTO) start();
  if (props.mode === MANUAL) {
    typeof _from.value === 'string' ? num.value = formatter.value(parseFloat(_from.value)) : num.value = formatter.value(_from.value);
    if (_fromColor.value && _toColor.value) {
      let {
        r,
        g,
        b
      } = hexToRGB(_fromColor.value);
      numColor.value = ` color: rgb(${parseInt(r)}, ${parseInt(g)}, ${parseInt(b)})`;
    }
  }
  updateData();
})

const updateData = () => {
  setData({
    mode: props.mode,
    num: num.value,
    _fromColor: _fromColor.value,
    numColor: numColor.value,
    _toColor: _toColor.value,
    _to: _to.value,
    options: options.value,
    state: state.value
  });
}

const updateNumber = (state) => {
  num.value = formatter.value ? formatter.value(state.x) : state.x;
  numColor.value = `color: rgb(${parseInt(state.r)}, ${parseInt(state.g)}, ${parseInt(state.b)})`;
  updateData();
}

const makeOptions = () => {
  let from = typeof _from.value === 'string' ? {
    x: parseFloat(_from.value)
  } : {
    x: _from.value
  };
  let to = typeof _to.value === 'string' ? {
    x: parseFloat(_to.value)
  } : {
    x: _to.value
  };
  if (_fromColor.value && _toColor.value) {
    let fromRGB = hexToRGB(_fromColor.value);
    extend(from, fromRGB);
    let toRGB = hexToRGB(_toColor.value);
    extend(to, toRGB);
  }
  let duration = typeof props.duration === 'string' ? parseFloat(props.duration) : props.duration;
  options.value = {
    from: from,
    to: to,
    duration: duration,
    easing: props.easing,
    step: updateNumber.value
  };
  updateData();
}

const start = () => {
  if (state.value > 0) return;
  state.value = 1;
  tween(options.value).then(updateNumber.value).then(() => {
    state.value = 0;
    if (animateEnd.value) animateEnd.value(parseFloat(num.value));
  });
  updateData();
}

const reset = (from, to, fromColor, toColor) => {
  options.value.from = typeof from === 'string' ? {
    x: parseFloat(from)
  } : {
    x: from
  };
  options.value.to = typeof to === 'string' ? {
    x: parseFloat(to)
  } : {
    x: to
  };
  if (fromColor && isColor(fromColor) && toColor && isColor(toColor)) {
    let fromRGB = hexToRGB(fromColor);
    extend(options.value.from, fromRGB);
    let toRGB = hexToRGB(toColor);
    extend(options.value.to, toRGB);
  }
  updateData();
}

</script>

<template>
<!-- <view wx:if="{{num != undefined}}"
    :style="{{numColor}}">{{num}}</view> -->
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;

</style>
