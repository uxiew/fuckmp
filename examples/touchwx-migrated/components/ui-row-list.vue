<script setup lang="ts">
import { ref } from 'vue'

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
  bordered?: any
  borderLeftIndent?: any
  borderIndent?: any
  title?: any
}>()


function setData(_patch: Record<string, any>) {}

</script>

<template>
<view class="ui-row-list {{ bordered ? 'ui-row-list-bordered' : '' }} {{ borderLeftIndent ? 'ui-row-list-border-left-indent' : '' }} {{ borderIndent ? 'ui-row-list-border-indent' : '' }}">
    <slot></slot>
  </view>
</template>

<style lang="scss" scoped>
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
/* migrated less import removed */
.ui-row-list {
  position: relative;

  &.ui-row-list-bordered {
    &:before {
      /* migrated less mixin: .setTopLine(); */
    }
    &:after {
      /* migrated less mixin: .setBottomLine(); */
    }
  }

  > .ui-row:not(:last-child) {
    &:after {
      /* migrated less mixin: .setBottomLine(); */
    }
  }

  &.ui-row-list-border-left-indent {
    padding-left: 15px;
  }

  &.ui-row-list-border-indent {
    padding-left: 15px;
    padding-right: 15px;
  }
}
</style>
