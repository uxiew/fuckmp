<template>
  <view class="container">
    <text>{{ message }}</text>
    <text>{{ count }}</text>
    <button @tap="increment">点击增加</button>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

// 简单的ref
const count = ref(0)

// 简单的reactive对象
const state = reactive({
  message: 'Hello Vue3',
  items: ['item1', 'item2', 'item3']
})

// 计算属性
const doubleCount = computed(() => count.value * 2)

// 简单函数
const increment = () => {
  count.value++
}

// 复杂函数
const handleComplexAction = (param: string) => {
  console.log('处理复杂操作:', param)
  
  if (param === 'reset') {
    count.value = 0
    state.message = 'Reset!'
  } else {
    state.message = `Action: ${param}`
  }
  
  return {
    success: true,
    data: param
  }
}
</script>

<style scoped>
.container {
  padding: 20rpx;
}
</style>
