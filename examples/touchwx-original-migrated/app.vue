<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  if (typeof wx !== 'undefined') {
    console.log('TouchWX _original migrated app launched')
  }
})
</script>

<template>
  <view></view>
</template>

<style lang="scss">
$theme-color: #3399ff !default;
$disabled-color: #eff2f7 !default;
/* migrated less import removed */

</style>
