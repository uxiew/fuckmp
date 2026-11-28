<template>
  <view class="pickup-page">
    <text>周六社区自提</text>
    <text v-if="reserved > 0">已预订 {{ reserved }} 份</text>
    <text v-else>尚未预订</text>
    <PickupOffer
      v-for="offer in offers"
      :key="offer.id"
      :name="offer.name"
      @reserve="reserveOffer"
    />
    <navigator url="/pages/pickup-info">查看自提须知</navigator>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PickupOffer from '../components/PickupOffer.vue'

const offers = [
  { id: 'vegetables', name: '时令蔬菜包' },
  { id: 'fruit', name: '当季水果包' }
]
const reserved = ref(0)

const reserveOffer = () => {
  reserved.value += 1
}
</script>

<style lang="scss" scoped>
$card-background: #fff;

.pickup-page {
  display: flex;
  flex-direction: column;
  background: $card-background;
  padding: 24rpx;
}
</style>
