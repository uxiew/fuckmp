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

const props = defineProps<{
  mode?: any
}>()

const width = ref(375)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'width')) width.value = patch['width']
}

onMounted(() => {
  childrens.value = _getAllLi();
  console.log(childrens.value);
  childrens.value.forEach(element => {
    element.setData({
      timelineType: props.mode
    });
  });
})

const _getAllLi = () => {
  return getRelationNodes(ChildPath);
}

</script>

<template>
<view class="{{mode === 'row' ? 'ui-timeline-row' : 'ui-timeline'}}" style="width:{{ mode === 'row' ? width + 'px' : ''}};">
      <view class="slot-wrap">
        <slot></slot>
      </view>
    </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
.ui-timeline {
  position: relative;
  margin: 10px 0;
  overflow: hidden;
  .slot-wrap {
    margin-top: 10px;
    padding: 0;
    bottom: 0;
  }
}
.ui-timeline-row {
  position: relative;
  overflow: hidden;
  .slot-wrap {
    margin: 0;
    padding: 0;
    bottom: 0;
  }
}
</style>
