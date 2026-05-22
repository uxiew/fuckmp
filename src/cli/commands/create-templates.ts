/**
 * create 命令项目模板定义与文件内容生成。
 */


/**
 * 项目模板。
 */
export interface ProjectTemplate {
  name: string
  description: string
  features: string[]
  files: Record<string, string>
}

/**
 * 获取项目模板
 */
export function getProjectTemplate(templateName: string, features: { typescript: boolean; scss: boolean }): ProjectTemplate {
  const templates: Record<string, ProjectTemplate> = {
    basic: createBasicTemplate(features),
    advanced: createAdvancedTemplate(features),
    ecommerce: createEcommerceTemplate(features)
  }

  const template = templates[templateName]
  if (!template) {
    throw new Error(`未知的模板: ${templateName}`)
  }

  return template
}

/**
 * 创建基础模板
 */
function createBasicTemplate(features: { typescript: boolean; scss: boolean }): ProjectTemplate {
  const ext = features.typescript ? 'ts' : 'js'
  const styleExt = features.scss ? 'scss' : 'css'
  const files: Record<string, string> = {
    'package.json': createPackageJson(features),
    [`src/app.vue`]: createAppVue(styleExt),
    [`src/pages/index/index.vue`]: createIndexPage(ext, styleExt),
    [`src/components/HelloWorld.vue`]: createHelloWorldComponent(ext, styleExt),
    'vue3mp.config.js': createConfig(features),
    '.gitignore': createGitignore(),
    'README.md': createReadme()
  }

  if (features.typescript) {
    files['tsconfig.json'] = createTSConfig()
  }

  return {
    name: 'basic',
    description: '基础 Vue3 小程序模板',
    features: ['Vue3', 'Composition API', ...(features.typescript ? ['TypeScript'] : []), ...(features.scss ? ['SCSS'] : [])],
    files
  }
}

/**
 * 创建高级模板
 */
function createAdvancedTemplate(features: { typescript: boolean; scss: boolean }): ProjectTemplate {
  const basicTemplate = createBasicTemplate(features)

  return {
    ...basicTemplate,
    name: 'advanced',
    description: '高级 Vue3 小程序模板',
    features: [...basicTemplate.features, 'Pinia', 'Router', 'Utils'],
    files: {
      ...basicTemplate.files,
      'src/store/index.ts': createStore(),
      'src/utils/request.ts': createRequest(),
      'src/pages/profile/index.vue': createProfilePage()
    }
  }
}

/**
 * 创建电商模板
 */
function createEcommerceTemplate(features: { typescript: boolean; scss: boolean }): ProjectTemplate {
  const advancedTemplate = createAdvancedTemplate(features)

  return {
    ...advancedTemplate,
    name: 'ecommerce',
    description: '电商 Vue3 小程序模板',
    features: [...advancedTemplate.features, 'Product List', 'Shopping Cart', 'Order'],
    files: {
      ...advancedTemplate.files,
      'src/pages/products/index.vue': createProductsPage(),
      'src/pages/cart/index.vue': createCartPage(),
      'src/components/ProductCard.vue': createProductCard()
    }
  }
}

/**
 * 创建 package.json
 */
function createPackageJson(features: { typescript: boolean; scss: boolean }): string {
  const dependencies = {
    vue: '^3.4.0'
  }

  const devDependencies = {
    '@vue3-miniprogram/compiler': '^1.0.0',
    ...(features.typescript ? { typescript: '^5.6.0' } : {}),
    ...(features.scss ? { sass: '^1.69.0' } : {})
  }

  return JSON.stringify({
    name: '{{PROJECT_NAME}}',
    version: '1.0.0',
    description: 'Vue3 微信小程序项目',
    scripts: {
      dev: 'vue3-mp build --watch',
      build: 'vue3-mp build',
      'build:prod': 'vue3-mp build --minify'
    },
    dependencies,
    devDependencies
  }, null, 2)
}

/**
 * 创建 App.vue
 */
function createAppVue(styleExt: string): string {
  return `<template>
  <view class="app">
    <!-- 应用根组件 -->
  </view>
</template>

<script setup lang="ts">
// 应用初始化逻辑
</script>

<style lang="${styleExt}">
.app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>`
}

/**
 * 创建首页
 */
function createIndexPage(ext: string, styleExt: string): string {
  return `<template>
  <view class="index-page">
    <HelloWorld :msg="message" @click="handleClick" />
  </view>
</template>

<script setup lang="${ext}">
import { ref } from 'vue'
import HelloWorld from '@/components/HelloWorld.vue'

const message = ref('欢迎使用 Vue3 小程序!')

const handleClick = () => {
  console.log('Hello World clicked!')
}
</script>

<style lang="${styleExt}" scoped>
.index-page {
  padding: 20rpx;
}
</style>`
}

/**
 * 创建 HelloWorld 组件
 */
function createHelloWorldComponent(ext: string, styleExt: string): string {
  return `<template>
  <view class="hello-world" @tap="$emit('click')">
    <text class="message">{{ msg }}</text>
  </view>
</template>

<script setup lang="${ext}">
defineProps<{
  msg: string
}>()

defineEmits<{
  click: []
}>()
</script>

<style lang="${styleExt}" scoped>
.hello-world {
  text-align: center;
  padding: 40rpx;
  background: #f5f5f5;
  border-radius: 20rpx;
}

.message {
  font-size: 32rpx;
  color: #333;
}
</style>`
}

/**
 * 创建配置文件
 */
function createConfig(features: { typescript: boolean; scss: boolean }): string {
  return `module.exports = {
  input: 'src',
  output: 'dist',
  appId: 'your-app-id',
  features: {
    scriptSetup: true,
    typescript: ${features.typescript},
    scss: ${features.scss},
    compositionApi: true
  },
  optimization: {
    minify: false,
    sourcemap: true
  }
}`
}

/**
 * 创建 .gitignore
 */
function createGitignore(): string {
  return `node_modules/
dist/
.DS_Store
*.log
.env.local
.env.*.local`
}

/**
 * 创建 README.md
 */
function createReadme(): string {
  return `# {{PROJECT_NAME}}

Vue3 微信小程序项目

## 开发

\`\`\`bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build
\`\`\`

## 目录结构

\`\`\`
src/
├── app.vue          # 应用入口
├── pages/           # 页面
├── components/      # 组件
└── utils/           # 工具函数
\`\`\`
`
}

/**
 * 创建 TypeScript 配置
 */
function createTSConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      module: 'ESNext',
      moduleResolution: 'bundler',
      strict: true,
      jsx: 'preserve',
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      baseUrl: '.',
      paths: {
        '@/*': ['src/*']
      }
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist']
  }, null, 2)
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
