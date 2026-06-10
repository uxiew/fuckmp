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
  height?: string | number
  speed?: string | number
  autoplay?: string | number
  direction?: string
}>(), {
  height: 30,
  speed: 300,
  autoplay: 2000,
  direction: 'up'
})

const controlArray = ref([])

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'controlArray')) controlArray.value = patch['controlArray']
}

onMounted(() => {
  selfAutoplay.value = Number(props.autoplay);
  selfSpeed.value = Number(props.speed);
})

onMounted(() => {
  childNodes.value = _getAllLi();
  childLength.value = childNodes.value.length;
  for (let i = 0; i < childNodes.value.length; i++) {
    controlArray.value[i] = i;
    let node = childNodes.value[i];
    node.setData({
      position: i,
      height: props.height,
      direction: props.direction,
      speed: selfSpeed.value
    });
  }
  _updateView();
})

const _getAllLi = () => {
  return getRelationNodes('../../ui-roller-item/dist/index');
}

const _updateView = () => {
  // 開始更新视图
  setInterval(() => {
    controlArray.value = controlArray.value.map(x => x - 1); // 每一个坐标都减一
    // console.log('减一设置开始')

    for (let i = 0; i < childNodes.value.length; i++) {
      childNodes.value[i].setData({
        // 赋值给子元素,让子元素进行有动画的
        animate: true,
        position: controlArray.value[i]
      });
    }
    // console.log('减一设置结束')
    setTimeout(() => {
      // 滚动动画完成后的回调函数,把位列-1的变成最后一个
      controlArray.value = controlArray.value.map(x => x === -1 ? childLength.value - 1 : x); // 
      // console.log('变二设置开始')

      for (let i = 0; i < childNodes.value.length; i++) {
        if (controlArray.value[i] === childLength.value - 1) {
          childNodes.value[i].setData({
            animate: false,
            position: controlArray.value[i]
          });
        }
      }
      // console.log('变二设置结束')
    }, selfSpeed.value); // 滚动动画速度
  }, selfAutoplay.value); // 间隔
}

</script>

<template>
<view class="ui-roller" style="height: {{height}}px">
    <slot></slot>
  </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
ui-roller {
  display: inline-block;
  margin-top: -2px;
  width: 100%;
  overflow: hidden;
}
.ui-roller {
  position: relative;
  width: 100%; 
  height: 30px;
  white-space: nowrap;
}
</style>
