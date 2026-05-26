<template>
  <view class="activity-list shared-card">
    <text class="section-title">最近动态</text>

    <view v-if="loading" class="activity-loading">
      <text class="muted-text">动态加载中...</text>
    </view>

    <view v-else class="activity-body">
      <view
        v-for="(activity, index) in items"
        :key="activity.id"
        class="activity-row"
        :class="{ done: activity.done }"
        :data-activity-id="activity.id"
        @tap="handleSelect"
      >
        <text class="activity-index">{{ index + 1 }}</text>
        <view class="activity-content">
          <text class="activity-title">{{ activity.title }}</text>
          <text class="muted-text">{{ activity.type }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
interface Activity {
  id: number
  title: string
  type: string
  done: boolean
}

interface Props {
  items: Activity[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  selectActivity: [activity: Activity]
}>()

/** 根据微信原生 dataset 找回当前点击的动态项。 */
const handleSelect = (event: any) => {
  emit(
    'selectActivity',
    props.items.find(item => item.id === Number(event.currentTarget.dataset.activityId))
  )
}
</script>

<style lang="scss" scoped>
@import '../styles/shared.scss';

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.section-title {
  color: $text-color;
  font-size: 30rpx;
  font-weight: 700;
}

.activity-loading {
  padding: 20rpx 0;
}

.activity-body {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.activity-row {
  align-items: center;
  background: #f6f8fb;
  border-radius: 12rpx;
  display: flex;
  gap: 16rpx;
  padding: 16rpx;

  &.done {
    opacity: 0.72;
  }
}

.activity-index {
  color: $primary-color;
  font-size: 24rpx;
  font-weight: 700;
}

.activity-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6rpx;
}

.activity-title {
  color: $text-color;
  font-size: 28rpx;
  font-weight: 600;
}
</style>
