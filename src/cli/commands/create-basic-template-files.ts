/**
 * create 命令基础模板文件内容生成。
 */

/**
 * create 命令模板特性开关。
 */
export interface CreateTemplateFeatures {
  typescript: boolean
  scss: boolean
}

/**
 * 创建基础模板文件集合。
 */
export function createBasicTemplateFiles(features: CreateTemplateFeatures): Record<string, string> {
  const ext = features.typescript ? 'ts' : 'js'
  const styleExt = features.scss ? 'scss' : 'css'
  const files: Record<string, string> = {
    'package.json': createPackageJson(features),
    'src/app.vue': createAppVue(styleExt),
    'src/pages/index/index.vue': createIndexPage(ext, styleExt),
    'src/components/HelloWorld.vue': createHelloWorldComponent(ext, styleExt),
    'vue3mp.config.js': createConfig(features),
    '.gitignore': createGitignore(),
    'README.md': createReadme()
  }

  if (features.typescript) {
    files['tsconfig.json'] = createTSConfig()
  }

  return files
}

/**
 * 创建 package.json
 */
function createPackageJson(features: CreateTemplateFeatures): string {
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
function createConfig(features: CreateTemplateFeatures): string {
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
