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
  text?: string | number
  maxlength?: string | number
  customStyle?: string
}>(), {
  text: '',
  maxlength: 2
})

const selfText = ref('')

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'selfText')) selfText.value = patch['selfText']
}

onMounted(() => {
  setText();
})

const setText = () => {
  let {
    text,
    maxlength,
    customStyle
  } = data;
  let isSingleNumber = false;
  let isNumberOverLength = false;
  let isStringOverLength = false;
  if (StringHelper.isNumber(text)) {
    if (text.length === 1) {
      isSingleNumber = true;
    }
    isNumberOverLength = maxlength < text.length;
  } else {
    isStringOverLength = maxlength < text.length;
  }
  let selfText = getText(text, maxlength);
  setData({
    isSingleNumber: isSingleNumber,
    isNumberOverLength: isNumberOverLength,
    isStringOverLength: isStringOverLength,
    selfText: selfText,
    selfCustomStyle: StyleHelper.getPlainStyle(customStyle)
  });
}

</script>

<template>
<span style="{{ selfCustomStyle }}" class="ui-badge {{ text === '' ? 'ui-badge-dot' : '' }} {{ isSingleNumber ? 'ui-badge-single' : '' }}">
    {{ selfText }}
    <span wx:if="{{ isNumberOverLength }}" class="plus">+</span>
    <block wx:if="{{ isStringOverLength }}">...</block>
  </span>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
.ui-badge {
  position: relative;
  display: inline-block;
  text-align: center;
  background: #ff2a00;
  color: #fff;
  font-size: 12px;
  line-height: 16px;
  border-radius: 8px;
  padding: 0 6px 0 7px;
  background-clip: padding-box;
  vertical-align: middle;

  .plus {
    display: inline;
    padding-left: 1px;
    line-height: 12px;
    font-weight: bold;
    transform: translateY(-1px);
  }

  &.ui-badge-single {
    padding: 0;
    width: 16px;
  }

  &.ui-badge-dot {
    height: auto;
    padding: 5px
  }
  &.small-dot {
    padding: 3px;
  }
}
</style>
