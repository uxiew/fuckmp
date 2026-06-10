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
const width = ref(0)
const height = ref(0)
const isParentInkBar = ref(false)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'selfStyle')) selfStyle.value = patch['selfStyle']
  if (Object.prototype.hasOwnProperty.call(patch, 'index')) index.value = patch['index']
  if (Object.prototype.hasOwnProperty.call(patch, 'active')) active.value = patch['active']
  if (Object.prototype.hasOwnProperty.call(patch, 'width')) width.value = patch['width']
  if (Object.prototype.hasOwnProperty.call(patch, 'height')) height.value = patch['height']
  if (Object.prototype.hasOwnProperty.call(patch, 'isParentInkBar')) isParentInkBar.value = patch['isParentInkBar']
}

onMounted(() => {
  _init();
})

const _init = () => {
  let parent = getRelationNodes(ParentPath)[0];
  WxHelper.getComponentRect(this, '.ui-tab').then(rect => {
    parent._increaseWalkDistance(rect);
    setData({
      isParentInkBar: parent.data.inkBar,
      width: rect.width,
      height: rect.height,
      index: MultiHelper.getChildIndex(parent, this)
    });
  });
}

const handleTap = () => {
  let parent = getRelationNodes(ParentPath)[0];
  parent.handleIndexChange(index.value, false);
}

</script>

<template>
<view class="ui-tab ui-tab-x {{ isParentInkBar ? 'border-none' : ''}} {{ active ? 'active' : '' }}" style="{{ selfStyle }}" bindtap="handleTap">
    <slot></slot>
  </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
ui-tab {
  display: inline-block;
  position: relative;
  align-items: center;
  justify-content: center;
}
.ui-tab {
  display: inline-block;
  padding: 12px 16px;
  position: relative;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;

  &.ui-tab-x {
    &.active {
      color: $theme-color;
      border-bottom: 1px solid $theme-color;
    }
  }

  &.border-none {
    border: 0 !important;
  }
}
</style>
