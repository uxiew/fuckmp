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
  probe?: string | number
  width?: string | number
  height?: string | number
  tabStyle?: string
  activeTabStyle?: string
}>(), {
  index: 0
})

const isInit = ref(false)
const scrollTop = ref(0)
const scrollLeft = ref(0)
const children = ref([])
const rect = ref({})
const selfProbe = ref(0)
const selfIndex = ref(0)
const walkDistance = ref(0)
const walkCount = ref(0)

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'isInit')) isInit.value = patch['isInit']
  if (Object.prototype.hasOwnProperty.call(patch, 'scrollTop')) scrollTop.value = patch['scrollTop']
  if (Object.prototype.hasOwnProperty.call(patch, 'scrollLeft')) scrollLeft.value = patch['scrollLeft']
  if (Object.prototype.hasOwnProperty.call(patch, 'children')) children.value = patch['children']
  if (Object.prototype.hasOwnProperty.call(patch, 'rect')) rect.value = patch['rect']
  if (Object.prototype.hasOwnProperty.call(patch, 'selfProbe')) selfProbe.value = patch['selfProbe']
  if (Object.prototype.hasOwnProperty.call(patch, 'selfIndex')) selfIndex.value = patch['selfIndex']
  if (Object.prototype.hasOwnProperty.call(patch, 'walkDistance')) walkDistance.value = patch['walkDistance']
  if (Object.prototype.hasOwnProperty.call(patch, 'walkCount')) walkCount.value = patch['walkCount']
}

onMounted(() => {
  setData({
    selfIndex: Number(props.index),
    selfProbe: Number(props.probe),
    height: Number(props.height)
  });
  _init();
})

const _init = () => {
  _initRect();
  _initChildren();
  _initChildActive();
  _initSelfStyle();
  _setTabStyle();
}

const _initChildren = () => {
  let children = getRelationNodes(ChildPath);
  setData({
    children: children
  });
}

const _initChildActive = () => {
  // 将index项设置为active
  children.value[selfIndex.value].setData({
    active: true
  });
}

const _initRect = () => {
  WxHelper.getComponentRect(this, '.ui-v-tabs').then(rect => {
    setData({
      rect: rect
    });
  });
}

const _initSelfStyle = () => {
  setData({
    selfStyle: StyleHelper.getPlainStyle({
      width: props.width,
      height: props.height
    })
  });
}

const handleIndexChange = (index, outerChange) => {
  MultiHelper.updateChildActive(this, index);
  let selfProbe = selfProbe.value;
  if (selfProbe === 0 || selfProbe === 1 && !outerChange) {
    triggerEvent('change', {
      index: index
    });
  }
  setData({
    selfIndex: index
  });
  _setTabStyle();
  if (isInit.value) {
    _autoMiddleTab();
  }
}

const _setTabStyle = () => {
  let {
    children,
    selfIndex,
    tabStyle,
    activeTabStyle
  } = data;
  let style = StyleHelper.getPlainStyle(tabStyle);
  let activeStyle = StyleHelper.getMergedPlainStyles([tabStyle, activeTabStyle]);
  children.forEach((node, index) => {
    node.setData({
      selfStyle: index === selfIndex ? activeStyle : style
    });
  });
}

const _autoMiddleTab = () => {
  let child = children.value[selfIndex.value];
  WxHelper.getScrollViewRect(this, '.ui-v-tabs').then(scrollRect => {
    WxHelper.getComponentRect(child, '.ui-v-tab').then(rect => {
      let relativeTop = rect.top - rect.value.top;
      let diff = relativeTop - (props.height - child.data.height) / 2;
      setData({
        scrollTop: diff + scrollRect.scrollTop
      });
    });
  });
}

const _increaseWalkDistance = (rect) => {
  walkDistance.value += rect.height;
  walkCount.value++;
  if (walkCount.value === children.value.length) {
    setData({
      isInit: true
    });
    _autoMiddleTab();
  }
}

</script>

<template>
<scroll-view scroll-with-animation class="ui-v-tabs" style="{{ selfStyle }}" scroll-y="{{ true }}" scroll-top="{{ scrollTop }}">
    <slot></slot>
  </scroll-view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
/* migrated less import removed */
ui-v-tabs {
  display: inline-block;
}
.ui-v-tabs {
  position: relative;
  height: 100%;
  /* migrated less mixin: .mix-1px(0, 1, 0, 0, #ccc); */
}
</style>
