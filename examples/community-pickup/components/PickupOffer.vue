<template>
  <view class="pickup-offer">
    <text>{{ name }}</text>
    <button @click="reserve">预订一份</button>
  </view>
</template>

<script setup lang="ts">
defineProps<{ name: string }>()
const emit = defineEmits<{ reserve: [] }>()

const reserve = () => {
  emit('reserve')
}
</script>

<style scoped>
.pickup-offer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx;
}
</style>
