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
  autoWidth?: boolean
  inkBar?: boolean
  inkBarStyle?: string
  tabStyle?: string
  activeTabStyle?: string
}>(), {
  index: 0,
  probe: 0,
  width: 0,
  autoWidth: true
})

const isInit = ref(false)
const scrollTop = ref(0)
const scrollLeft = ref(0)
const children = ref([])
const rect = ref({})
const outerChange = ref(false)
const walkDistance = ref(0)
const walkCount = ref(0)
const selfStyle = ref('')
const selfProbe = ref(0)
const selfIndex = ref(0)
const selfInkBarStyle = ref('')
const inkBarWrapperStyle = ref('')

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'isInit')) isInit.value = patch['isInit']
  if (Object.prototype.hasOwnProperty.call(patch, 'scrollTop')) scrollTop.value = patch['scrollTop']
  if (Object.prototype.hasOwnProperty.call(patch, 'scrollLeft')) scrollLeft.value = patch['scrollLeft']
  if (Object.prototype.hasOwnProperty.call(patch, 'children')) children.value = patch['children']
  if (Object.prototype.hasOwnProperty.call(patch, 'rect')) rect.value = patch['rect']
  if (Object.prototype.hasOwnProperty.call(patch, 'outerChange')) outerChange.value = patch['outerChange']
  if (Object.prototype.hasOwnProperty.call(patch, 'walkDistance')) walkDistance.value = patch['walkDistance']
  if (Object.prototype.hasOwnProperty.call(patch, 'walkCount')) walkCount.value = patch['walkCount']
  if (Object.prototype.hasOwnProperty.call(patch, 'selfStyle')) selfStyle.value = patch['selfStyle']
  if (Object.prototype.hasOwnProperty.call(patch, 'selfProbe')) selfProbe.value = patch['selfProbe']
  if (Object.prototype.hasOwnProperty.call(patch, 'selfIndex')) selfIndex.value = patch['selfIndex']
  if (Object.prototype.hasOwnProperty.call(patch, 'selfInkBarStyle')) selfInkBarStyle.value = patch['selfInkBarStyle']
  if (Object.prototype.hasOwnProperty.call(patch, 'inkBarWrapperStyle')) inkBarWrapperStyle.value = patch['inkBarWrapperStyle']
}

onMounted(() => {
  setData({
    selfIndex: Number(props.index),
    selfProbe: Number(props.probe),
    height: Number(height.value)
  });
  _init();
})

const _init = () => {
  _initRect();
  _initChildren();
  _initChildActive();
  _initSelfStyle();
  if (props.inkBar) {
    _initSelfInkBarStyle();
  }
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
  WxHelper.getComponentRect(this, '.ui-tabs').then(rect => {
    setData({
      rect: rect
    });
  });
}

const _initSelfStyle = () => {
  setData({
    selfStyle: StyleHelper.getPlainStyle({
      width: props.width
    })
  });
}

const _initSelfInkBarStyle = () => {
  setData({
    selfInkBarStyle: StyleHelper.getPlainStyle(props.inkBarStyle)
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

  // 初始化完成时再执行_autoCenterTab，否则WxHelper.getComponentRect可能会报错
  // 初始化完成时再执行_autoCenterTab，否则WxHelper.getComponentRect可能会报错
  if (isInit.value) {
    _autoCenterTab();
  }
  if (props.inkBar) {
    _setInkBarWrapperStyle();
  }
}

const _setTabStyle = () => {
  let {
    children,
    selfIndex,
    tabStyle,
    activeTabStyle,
    autoWidth
  } = data;
  let style = StyleHelper.getPlainStyle(tabStyle);
  let activeStyle = StyleHelper.getMergedPlainStyles([tabStyle, activeTabStyle]);
  children.forEach((child, index) => {
    let renderStyle = index === selfIndex ? activeStyle : style;
    if (autoWidth) {
      renderStyle += `;width: ${child.data.width}px`;
    }
    child.setData({
      selfStyle: renderStyle
    });
  });
}

const _autoCenterTab = () => {
  let child = children.value[selfIndex.value];
  WxHelper.getScrollViewRect(this, '.ui-tabs').then(scrollRect => {
    WxHelper.getComponentRect(child, '.ui-tab').then(rect => {
      let diff = rect.left - (rect.value.width - child.data.width) / 2;
      setData({
        scrollLeft: diff + scrollRect.scrollLeft
      });
    });
  });
}

const _setInkBarWrapperStyle = () => {
  let {
    children,
    rect
  } = data;
  let left = 0;
  let width = 0;
  for (let i = 0; i < children.length; i++) {
    if (children[i].data.active) {
      width = children[i].data.width;
      break;
    } else {
      left += children[i].data.width;
    }
  }
  setData({
    inkBarWrapperStyle: StyleHelper.getPlainStyle({
      top: rect.height - 2,
      left: left,
      width: width
    })
  });
}

const _increaseWalkDistance = (rect) => {
  walkDistance.value += rect.width;
  walkCount.value++;

  // 最后一个tab初始化完成时
  // 最后一个tab初始化完成时
  if (walkCount.value === children.value.length) {
    let {
      walkDistance,
      walkCount,
      rect,
      tabStyle,
      activeTabStyle,
      children,
      selfIndex
    } = data;
    let resetTabHandle = null;
    let fixedStyle = {};
    let width = null;

    // 当walkDistance < 容器宽度时，tab项的样式需要重设
    if (walkDistance < rect.width && props.autoWidth) {
      width = rect.width / walkCount;
      fixedStyle = {
        width: width
      };
    }
    let style = StyleHelper.getMergedPlainStyles([tabStyle, fixedStyle]);
    let activeStyle = StyleHelper.getMergedPlainStyles([tabStyle, activeTabStyle, fixedStyle]);
    setData({
      isInit: true
    });
    _autoCenterTab();
    resetTabHandle = () => {
      children.forEach((child, index) => {
        child.setData({
          selfStyle: index === selfIndex ? activeStyle : style
        });
        if (width) {
          child.setData({
            width: width
          });
        }
      });
    };
    setTimeout(() => {
      if (resetTabHandle) {
        resetTabHandle();
      }
      if (props.inkBar) {
        _setInkBarWrapperStyle();
      }
    });
  }
}

</script>

<template>
<scroll-view scroll-with-animation class="ui-tabs ui-tabs-x" style="{{ selfStyle }}" scroll-x="{{ true }}" scroll-left="{{ scrollLeft }}">
    <slot></slot>
    <view class="ui-tabs-ink-bar-wrapper" wx:if="{{ inkBar }}" style="{{ inkBarWrapperStyle }}">
      <view class="ui-tabs-ink-bar" style="{{ selfInkBarStyle }}"></view>
    </view>
  </scroll-view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
ui-tabs {
  display: inline-block;
  width: 100%;
}
.ui-tabs {
  position: relative;
  &.ui-tabs-x {
    width: 100%; 
    white-space: nowrap;
  }
}

.ui-tabs-x {
  .ui-tabs-ink-bar-wrapper {
    position: absolute;
    left: 0;
    height: 2px;
    transform-origin: 50% 50%;
    transition: width 250ms ease-out, left 250ms ease-out;
  }

  .ui-tabs-ink-bar {
    position: relative;
    width: 100%;
    margin: 0 auto;
    border-bottom: 2px solid $theme-color;
  }
}
</style>
