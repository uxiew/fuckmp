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

const selfStyle = ref('')
const index = ref(null)
const active = ref(false)
const isFirst = ref(false)
const isLast = ref(false)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'selfStyle')) selfStyle.value = patch['selfStyle']
  if (Object.prototype.hasOwnProperty.call(patch, 'index')) index.value = patch['index']
  if (Object.prototype.hasOwnProperty.call(patch, 'active')) active.value = patch['active']
  if (Object.prototype.hasOwnProperty.call(patch, 'isFirst')) isFirst.value = patch['isFirst']
  if (Object.prototype.hasOwnProperty.call(patch, 'isLast')) isLast.value = patch['isLast']
}

onMounted(() => {
  _init();
})

const _init = () => {
  let parent = getRelationNodes(ParentPath)[0];
  WxHelper.getComponentRect(this, '.ui-segment-item').then(rect => {
    let index = MultiHelper.getChildIndex(parent, this);
    setData({
      index: index,
      isFirst: index === 0,
      isLast: index === parent.data.children.length - 1
    });
  });
}

const handleChange = () => {
  let parent = getRelationNodes(ParentPath)[0];
  parent.handleIndexChange(index.value, false);
}

</script>

<template>
<view class="ui-segment-item {{ isFirst ? 'ui-segment-item-first' : '' }} {{ isLast ? 'ui-segment-item-last' : '' }} {{ active ? 'active' : '' }}" style="{{ selfStyle }}" bindtap="handleChange">
    <slot></slot>
  </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
$segment-item-border: 1px solid $theme-color;
$segment-item-border-radius: 4px;

ui-segment-item  {
  display: inline-block;
  position: relative;
  align-items: center;
  justify-content: center;
}

.ui-segment-item {
  flex: 1;

  max-width: 100px;
  padding: 0 1em;
  height: 32px;

  transition: .1s all linear;
  text-align: center;
  white-space: nowrap;
  text-overflow: ellipsis;

  color: $theme-color;
  border-top: $segment-item-border;
  border-bottom: $segment-item-border;
  background: transparent;

  line-height: 30px;

  &.active {
    opacity: 1;
    color: #fff;
    background-color: $theme-color;
  }

  &:active:not(.active) {
    background-color: lighten($theme-color, 30%);
  }

  &.ui-segment-item-first {
    border-right:  $segment-item-border;
    border-left: $segment-item-border;
    border-top-left-radius: $segment-item-border-radius;
    border-bottom-left-radius: $segment-item-border-radius;
  }

  &:not(.ui-segment-item-first):not(.ui-segment-item-last) {
    border-right: $segment-item-border;
  }

  &.ui-segment-item-last {
    border-right:  $segment-item-border;
    border-top-right-radius: $segment-item-border-radius;
    border-bottom-right-radius: $segment-item-border-radius;
  }
}
</style>
