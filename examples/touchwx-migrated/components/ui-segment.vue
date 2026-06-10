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
  index?: string | number
  itemStyle?: string
  activeItemStyle?: string
}>(), {
  index: 0
})

const selfIndex = ref(0)
const children = ref([])

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'selfIndex')) selfIndex.value = patch['selfIndex']
  if (Object.prototype.hasOwnProperty.call(patch, 'children')) children.value = patch['children']
}

onMounted(() => {
  _init();
})

const _init = () => {
  _initChildren();
  _setItem();
}

const _initChildren = () => {
  let children = getRelationNodes(ChildPath);
  setData({
    children: children
  });
}

const _setItem = () => {
  let {
    children,
    selfIndex,
    itemStyle,
    activeItemStyle
  } = data;
  let style = StyleHelper.getPlainStyle(itemStyle);
  let activeStyle = StyleHelper.getMergedPlainStyles([itemStyle, activeItemStyle]);
  children.forEach((node, index) => {
    node.setData({
      selfStyle: index === selfIndex ? activeStyle : style,
      active: index === selfIndex
    });
  });
}

const handleIndexChange = (index) => {
  setData({
    selfIndex: index
  });
  _setItem();
  triggerEvent('change', {
    index: index
  });
}

</script>

<template>
<view class="ui-segment">
    <slot></slot>
  </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
ui-segment {
  display: inline-block;
  width: 100%;
}
.ui-segment {
  display: flex;
  justify-content: center;
}
</style>
