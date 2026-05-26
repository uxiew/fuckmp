<template>
  <view class="example-page">
    <view class="hero shared-card">
      <text class="title">{{ title }}</text>
      <text class="muted-text">{{ statusText }}</text>
    </view>

    <UserCard
      :user="currentUser"
      :active="isActive"
      @user-click="handleUserClick"
      @send-message="handleSendMessage"
    />

    <CounterInput v-model="displayName" v-model:count="visitCount" />

    <ActivityList
      :items="activities"
      :loading="activitiesLoading"
      @select-activity="handleSelectActivity"
    />

    <SlotPanel>
      <template #header>
        <text>原生 slot 验收</text>
      </template>
      <text>默认 slot 内容会透传到微信原生组件</text>
    </SlotPanel>

    <button class="primary-button" @tap="incrementVisit">增加访问</button>
  </view>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, onMounted } from 'vue'
import UserCard from '@/components/UserCard.vue'
import CounterInput from '@/components/CounterInput.vue'
import ActivityList from '@/components/ActivityList.vue'
import SlotPanel from '@/components/SlotPanel.vue'
import '../../styles/shared.scss'

interface User {
  id: number
  name: string
  email: string
}

interface Activity {
  id: number
  title: string
  type: string
  done: boolean
}

const title = ref('真实示例首页')
const displayName = ref('访客')
const visitCount = ref(1)
const isActive = ref(true)
const activitiesLoading = ref(false)
const currentUser = reactive<User>({
  id: 1001,
  name: '张三',
  email: 'zhangsan@example.com'
})
const activities = ref<Activity[]>([
  { id: 1, title: '完成首页编译验收', type: 'compile', done: true },
  { id: 2, title: '接入微信开发者工具冒烟', type: 'devtools', done: false }
])

const statusText = computed(() => `${displayName.value} 已访问 ${visitCount.value} 次`)

const incrementVisit = () => {
  visitCount.value += 1
}

const handleUserClick = (user: User) => {
  console.log('user click', user.name)
}

const handleSendMessage = (user: User) => {
  console.log('send message', user.id)
}

const handleSelectActivity = (activity: Activity) => {
  console.log('select activity', activity.id)
}

onMounted(() => {
  console.log('真实示例首页加载完成')
})
</script>

<style lang="scss" scoped>
@import '../../styles/shared.scss';

.example-page {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding: 32rpx;
}

.hero {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.title {
  color: $text-color;
  font-size: 40rpx;
  font-weight: 800;
}
</style>
