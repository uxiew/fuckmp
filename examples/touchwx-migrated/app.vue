<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  if (typeof wx !== 'undefined') {
    console.log('TouchWX migrated app launched')
  }
})
</script>

<template>
  <view></view>
</template>

<style lang="scss">
/* migrated less import removed */
page {
  font-size: 14px;
}

image {
  width: 100%;
  height: 100%;
  display: block;
}

.touchui-hover {
  background-color: #eee !important;
}

// 示例列表样式
.sample_list {
  .ui-row {
    font-size: 14px;
    height: 46px;
    line-height: 46px;
    color: #333;
    padding: 0 15px;
  }
  .group-title {
    height: 50px;
    line-height: 50px;
    font-weight: bold;
    font-size: 16px;
    color: #168AFD;
    .sign {
      width: 5px;
      height: 16px;
      background-color: #168AFD;
      border-radius: 5px;
    }
    .ui-row {
      padding: 0 10px;
      color: #168AFD;
      view {
        font-weight: bold;
      }
    }
  }
}

// 示例title和内容
.sample_title {
  background-color: #F7F9FB;
  font-size: 14px;
  font-weight: bold;
  line-height: 40px;
  padding-left: 20px;
}

.sample_content {
  padding: 10px 20px;
  line-height: 30px;
}

.content_list {
  list-style: none;
  background-color: #fff;
  view {
    padding: 0 15px;
    height: 50px;
    line-height: 50px;
    font-size: 14px;
    color: #666;
    border-bottom: 1px solid #eee;
  }
  .grey-bg {
    background-color: #f5f5f5;
  }
}
</style>
