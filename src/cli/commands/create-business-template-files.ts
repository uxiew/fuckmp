/**
 * create 命令高级/业务模板文件内容生成。
 */

/**
 * 创建高级模板追加文件。
 */
export function createAdvancedTemplateFiles(): Record<string, string> {
  return {
    'src/store/index.ts': createStore(),
    'src/utils/request.ts': createRequest(),
    'src/pages/profile/index.vue': createProfilePage()
  }
}

/**
 * 创建电商模板追加文件。
 */
export function createEcommerceTemplateFiles(): Record<string, string> {
  return {
    'src/pages/products/index.vue': createProductsPage(),
    'src/pages/cart/index.vue': createCartPage(),
    'src/components/ProductCard.vue': createProductCard()
  }
}

/**
 * 创建状态管理
 */
function createStore(): string {
  return `import { reactive } from 'vue'

export const store = reactive({
  user: null,
  loading: false
})`
}

/**
 * 创建请求工具
 */
function createRequest(): string {
  return `export function request(url: string, options: any = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      ...options,
      success: resolve,
      fail: reject
    })
  })
}`
}

/**
 * 创建个人中心页面
 */
function createProfilePage(): string {
  return `<template>
  <view class="profile-page">
    <text>个人中心</text>
  </view>
</template>

<script setup lang="ts">
// 个人中心逻辑
</script>

<style scoped>
.profile-page {
  padding: 20rpx;
}
</style>`
}

/**
 * 创建商品列表页面
 */
function createProductsPage(): string {
  return `<template>
  <view class="products-page">
    <ProductCard
      v-for="product in products"
      :key="product.id"
      :product="product"
    />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ProductCard from '@/components/ProductCard.vue'

const products = ref([])
</script>

<style scoped>
.products-page {
  padding: 20rpx;
}
</style>`
}

/**
 * 创建购物车页面
 */
function createCartPage(): string {
  return `<template>
  <view class="cart-page">
    <text>购物车</text>
  </view>
</template>

<script setup lang="ts">
// 购物车逻辑
</script>

<style scoped>
.cart-page {
  padding: 20rpx;
}
</style>`
}

/**
 * 创建商品卡片组件
 */
function createProductCard(): string {
  return `<template>
  <view class="product-card">
    <image :src="product.image" class="image" />
    <view class="info">
      <text class="name">{{ product.name }}</text>
      <text class="price">¥{{ product.price }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  product: {
    id: string
    name: string
    price: number
    image: string
  }
}>()
</script>

<style scoped>
.product-card {
  display: flex;
  padding: 20rpx;
  border-bottom: 1rpx solid #eee;
}

.image {
  width: 120rpx;
  height: 120rpx;
  margin-right: 20rpx;
}

.info {
  flex: 1;
}

.name {
  display: block;
  font-size: 28rpx;
  margin-bottom: 10rpx;
}

.price {
  color: #ff6b35;
  font-size: 32rpx;
  font-weight: bold;
}
</style>`
}
