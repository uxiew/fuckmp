#!/usr/bin/env tsx

/**
 * TouchWX `.wxa` / `.wx` 示例迁移器。
 *
 * 该脚本只读取外部 TouchWX 源项目，并在当前仓库生成可被 FuckMP 编译的
 * Vue3 SFC 示例工程，用于扩大真实小程序页面/组件/样式测试面。
 */

import { parse as babelParse } from '@babel/parser'
import generateModule from '@babel/generator'
import * as t from '@babel/types'
import fs from 'fs-extra'
import { dirname, join, relative } from 'node:path'

const DEFAULT_SOURCE_ROOT = '/Users/bing/Workspace/touchwx/touchwx'
const DEFAULT_OUTPUT_ROOT = 'examples/touchwx-migrated'

const generate = (generateModule as unknown as { default?: typeof generateModule }).default || generateModule

const VUE_LIFECYCLE_IMPORTS = new Map([
  ['onLoad', 'onLoad'],
  ['onReady', 'onReady'],
  ['onShow', 'onShow'],
  ['onHide', 'onHide'],
  ['onUnload', 'onUnload'],
  ['onMounted', 'onMounted']
])

const SCRIPT_UTILS = `
const wxSafe = typeof wx !== 'undefined'
  ? wx
  : {
      STATUS_BAR_HEIGHT: 20,
      DEFAULT_HEADER_HEIGHT: 46,
      DEFAULT_CONTENT_HEIGHT: 667,
      WIN_WIDTH: 375,
      navigateBack() {},
      navigateTo() {},
      showToast() {},
      setStorageSync() {},
      createMapContext() {
        return { moveToLocation() {} }
      },
      openSysMap() {}
    }
`.trim()

interface SfcParts {
  template: string
  script: string
  style: string
  styleAttrs: string
}

interface PageMigrationResult {
  route: string
  source: string
  output: string
}

interface ScriptMigrationResult {
  code: string
  importedHooks: Set<string>
  dataBindings: DataBinding[]
}

interface DataBinding {
  sourceKey: string
  localName: string
}

interface TouchWxAppConfig {
  pages: string[]
  window?: Record<string, unknown>
  tabBar?: Record<string, unknown>
  networkTimeout?: Record<string, unknown>
}

interface MigrationSummary {
  sourceRoot: string
  outputRoot: string
  pages: PageMigrationResult[]
  uiTags: string[]
  copiedAssets: string[]
}

async function main(): Promise<void> {
  const sourceRoot = process.env.TOUCHWX_SOURCE_ROOT || DEFAULT_SOURCE_ROOT
  const outputRoot = process.env.TOUCHWX_OUTPUT_ROOT || join(process.cwd(), DEFAULT_OUTPUT_ROOT)

  const summary = await migrateTouchWxProject(sourceRoot, outputRoot)
  console.log(`✅ TouchWX 迁移完成：${summary.pages.length} 个页面，${summary.uiTags.length} 个 UI stub 组件`)
  console.log(`📁 输出目录：${summary.outputRoot}`)
}

/** 迁移 TouchWX 项目到当前 FuckMP Vue3 SFC 示例工程。 */
export async function migrateTouchWxProject(sourceRoot: string, outputRoot: string): Promise<MigrationSummary> {
  const absoluteSourceRoot = sourceRoot
  const absoluteOutputRoot = outputRoot

  await fs.rm(absoluteOutputRoot, { recursive: true, force: true })
  await fs.ensureDir(absoluteOutputRoot)

  const appParts = splitSfc(await fs.readFile(join(absoluteSourceRoot, 'app.wxa'), 'utf8'))
  const appConfig = extractTouchWxAppConfig(appParts.script)
  const pageFiles = await findTouchWxPages(absoluteSourceRoot)
  const uiTags = new Set<string>()

  const pages: PageMigrationResult[] = []
  for (const pageFile of pageFiles) {
    const source = join(absoluteSourceRoot, pageFile)
    const output = join(absoluteOutputRoot, pageFile.replace(/\.wx$/, '.vue'))
    const content = await fs.readFile(source, 'utf8')
    const parts = splitSfc(content)
    collectUiTags(parts.template, uiTags)

    await fs.ensureDir(dirname(output))
    await fs.writeFile(output, migratePageSfc(parts, pageFile), 'utf8')

    pages.push({
      route: pageFile.replace(/\.wx$/, ''),
      source: pageFile,
      output: relative(absoluteOutputRoot, output)
    })
  }

  await writeAppVue(absoluteOutputRoot, appParts)
  await writeVue3MpConfig(absoluteOutputRoot, appConfig, pages.map(page => page.route))
  await writeUiStubComponents(absoluteOutputRoot, Array.from(uiTags).sort())
  const copiedAssets = await copyTouchWxAssets(absoluteSourceRoot, absoluteOutputRoot)
  await writeMigrationReadme(absoluteOutputRoot, absoluteSourceRoot, pages, Array.from(uiTags).sort(), copiedAssets)

  return {
    sourceRoot: absoluteSourceRoot,
    outputRoot: absoluteOutputRoot,
    pages,
    uiTags: Array.from(uiTags).sort(),
    copiedAssets
  }
}

function splitSfc(content: string): SfcParts {
  const templateMatch = content.match(/<template[^>]*>([\s\S]*?)<\/template>/i)
  const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/i)
  const styleMatch = content.match(/<style([^>]*)>([\s\S]*?)<\/style>/i)

  return {
    template: templateMatch?.[1]?.trim() || '<view></view>',
    script: scriptMatch?.[1]?.trim() || 'export default {}',
    style: styleMatch?.[2]?.trim() || '',
    styleAttrs: styleMatch?.[1]?.trim() || ''
  }
}

function migratePageSfc(parts: SfcParts, sourceFile: string): string {
  const script = migrateTouchWxScript(parts.script, sourceFile)
  const styleLang = parts.styleAttrs.includes('less') ? 'scss' : 'css'
  const style = convertLessToScss(parts.style)

  return `<script setup lang="ts">
${script.code}
</script>

<template>
${normalizeTemplate(parts.template, createIdentifierMap(script.dataBindings))}
</template>

<style lang="${styleLang}" scoped>
${style}
</style>
`
}

function migrateTouchWxScript(script: string, sourceFile: string): ScriptMigrationResult {
  const importedHooks = new Set<string>()
  const dataBindings: DataBinding[] = []

  try {
    const ast = babelParse(script, {
      sourceType: 'module',
      plugins: ['typescript']
    })
    const exportDefault = ast.program.body.find((node): node is t.ExportDefaultDeclaration =>
      node.type === 'ExportDefaultDeclaration'
    )
    const objectExpression = exportDefault?.declaration

    if (!objectExpression || objectExpression.type !== 'ObjectExpression') {
      return createFallbackScript(sourceFile)
    }

    const dataProperty = findObjectProperty(objectExpression, 'data')
    const dataDeclarations = dataProperty?.value && dataProperty.value.type === 'ObjectExpression'
      ? createRefDeclarationsFromDataObject(dataProperty.value, dataBindings)
      : []
    const dataNameMap = createIdentifierMap(dataBindings)

    const lines: string[] = []
    lines.push(SCRIPT_UTILS)
    lines.push('')
    lines.push(...dataDeclarations)
    lines.push('')
    lines.push(createSetDataHelper(dataBindings))
    lines.push('')

    const methods = new Map<string, { node: t.Node, hook: string | undefined }>()
    for (const prop of objectExpression.properties) {
      if (!isObjectMember(prop)) continue
      const name = getPropertyName(prop.key)
      if (!name || name === 'config' || name === 'data') continue

      const valueNode = prop.type === 'ObjectMethod' ? prop : prop.value
      methods.set(name, {
        node: valueNode,
        hook: VUE_LIFECYCLE_IMPORTS.get(name)
      })
    }

    for (const [name, { node, hook }] of methods) {
      const method = transformObjectMemberToFunction(node)
      if (!method) continue

      if (hook) {
        importedHooks.add(hook)
        lines.push(`${hook}(() => {`)
        lines.push(indentCode(rewriteLegacyThisAccess(method.body, dataNameMap), '  '))
        lines.push('})')
      } else {
        const localMethodName = safeIdentifier(name, 'Handler')
        lines.push(`const ${localMethodName} = (${method.params}) => {`)
        lines.push(indentCode(rewriteLegacyThisAccess(method.body, dataNameMap), '  '))
        lines.push('}')
      }
      lines.push('')
    }



    const imports = buildVueImports(importedHooks)
    return {
      code: `${imports}\n\n${lines.join('\n').trim()}\n`,
      importedHooks,
      dataBindings
    }
  } catch (error) {
    console.warn(`⚠️  ${sourceFile} 脚本迁移降级：${(error as Error).message}`)
    return createFallbackScript(sourceFile)
  }
}

function createFallbackScript(sourceFile: string): ScriptMigrationResult {
  return {
    code: `import { ref } from 'vue'\n\nconst __touchwxFallback = ref(null)\n\n// ${sourceFile} 的旧脚本结构暂无法自动迁移，保留空页面状态用于模板验收。\n`,
    importedHooks: new Set(),
    dataBindings: []
  }
}

function buildVueImports(hooks: Set<string>): string {
  const names = ['ref', ...Array.from(hooks)].sort()
  return `import { ${names.join(', ')} } from 'vue'`
}

function transformObjectMemberToFunction(node: t.Node): { params: string, body: string } | null {
  if (node.type === 'ObjectMethod') {
    return {
      params: node.params.map(param => generate(param).code).join(', '),
      body: generateBlockBody(node.body)
    }
  }

  if (node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
    if (node.body.type !== 'BlockStatement') return null
    return {
      params: node.params.map(param => generate(param).code).join(', '),
      body: generateBlockBody(node.body)
    }
  }

  return null
}

function generateBlockBody(block: t.BlockStatement): string {
  return block.body.map(statement => generate(statement).code).join('\n')
}

function rewriteLegacyThisAccess(code: string, dataNameMap: Map<string, string>): string {
  let output = code
  output = output.replace(/\bthis\.setData\s*\(/g, 'setData(')
  output = output.replace(/\bthis\.data\.([A-Za-z_$][\w$]*)/g, (_match, key: string) => `${dataNameMap.get(key) || key}.value`)
  output = output.replace(/\bthis\.([A-Za-z_$][\w$]*)\s*\(/g, '$1(')
  output = output.replace(/\bvar\s+([A-Za-z_$][\w$]*)\s*=\s*this;/g, 'const $1 = { setData }')
  output = output.replace(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*this;/g, 'const $1 = { setData }')
  output = output.replace(/\bthis\.([A-Za-z_$][\w$]*)\b/g, (_match, key: string) => `${dataNameMap.get(key) || key}.value`)
  output = output.replace(/\bwx\./g, 'wxSafe.')
  return output
}

function rewriteWxGlobals(code: string): string {
  return code.replace(/\bwx\./g, 'wxSafe.')
}

function createIdentifierMap(dataBindings: DataBinding[]): Map<string, string> {
  return new Map(dataBindings.map(binding => [binding.sourceKey, binding.localName]))
}

function normalizeTemplate(template: string, dataNameMap: Map<string, string> = new Map()): string {
  const output = template
    .replace(/<\/?page\b[^>]*>/g, '')
    .replace(/<\/ui-image>/g, '</image>')
    .replace(/(<input\b[^>]*?)\s+value=\{\{([^}]+)\}\}/g, '$1 value="{{$2}}"')
    .replace(/(<input\b[^>]*?)>\s*<\/ui-input>/g, '$1 />')
    .replace(/<\/ui-button>/g, '</button>')
    .replace(/(<scroll-view\b[^>]*>\s*<view\b[^>]*>[\s\S]*?)<\/scroll-view\s*>\s*<\/view>/g, '$1</view></scroll-view>')
    .replace(/(<ui-col\b[^>]*\bwidth="60"[^>]*><\/ui-col>)\s*<\/ui-col>/g, '$1')
    .replace(/(\sdata-index="\{\{index\}\}"[^>]*?)\sdata-index="\{\{index\}\}"/g, '$1')
    .trim()

  return replaceTemplateIdentifiers(output, dataNameMap)
}

function replaceTemplateIdentifiers(template: string, dataNameMap: Map<string, string>): string {
  const renamedBindings = Array.from(dataNameMap.entries()).filter(([sourceKey, localName]) => sourceKey !== localName)
  if (renamedBindings.length === 0) return template

  return template.replace(/\{\{([\s\S]*?)\}\}/g, (match, expression: string) => {
    let nextExpression = expression
    for (const [sourceKey, localName] of renamedBindings) {
      nextExpression = nextExpression.replace(new RegExp(`\\b${escapeRegExp(sourceKey)}\\b`, 'g'), localName)
    }
    return `{{${nextExpression}}}`
  })
}

function convertLessToScss(style: string): string {
  return style
    .replace(/@import\s+['"][^'"]+['"];\s*/g, '/* migrated less import removed */\n')
    .replace(/\.mix-flex-center\s*\(\s*\)\s*;?/g, 'display: flex; align-items: center; justify-content: center;')
    .replace(/\.mix-flex-x-center\s*\(\s*\)\s*;?/g, 'display: flex; justify-content: center;')
    .replace(/\.mix-flex-y-center\s*\(\s*\)\s*;?/g, 'display: flex; align-items: center;')
    .replace(/\.([A-Za-z0-9_-]+)\s*\(([^;{}\n]*)\)\s*;?/g, '/* migrated less mixin: .$1($2); */')
}

function safeIdentifier(name: string, fallbackSuffix: string): string {
  const normalized = name
    .replace(/^[^A-Za-z_$]+/, '')
    .replace(/[^\w$]/g, '_')
  const candidate = normalized || `touchwx${fallbackSuffix}`
  return isValidIdentifier(candidate) && !isReservedIdentifier(candidate)
    ? candidate
    : `${candidate}${fallbackSuffix}`
}

function uniqueIdentifier(candidate: string, usedNames: Set<string>): string {
  let next = candidate
  let index = 2
  while (usedNames.has(next)) {
    next = `${candidate}${index}`
    index += 1
  }
  usedNames.add(next)
  return next
}

function isValidIdentifier(name: string): boolean {
  return /^[A-Za-z_$][\w$]*$/.test(name)
}

function isReservedIdentifier(name: string): boolean {
  return new Set([
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'else',
    'export',
    'extends',
    'finally',
    'for',
    'function',
    'if',
    'import',
    'in',
    'instanceof',
    'new',
    'return',
    'super',
    'switch',
    'this',
    'throw',
    'try',
    'typeof',
    'var',
    'void',
    'while',
    'with',
    'yield',
    'enum',
    'await',
    'implements',
    'interface',
    'let',
    'package',
    'private',
    'protected',
    'public',
    'static'
  ]).has(name)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}



function createSetDataHelper(dataBindings: DataBinding[]): string {
  const assignments = dataBindings
    .map(({ sourceKey, localName }) =>
      `  if (Object.prototype.hasOwnProperty.call(patch, '${sourceKey}')) ${localName}.value = patch['${sourceKey}']`
    )

  if (assignments.length === 0) {
    return `function setData(_patch: Record<string, any>) {}`
  }

  return `function setData(patch: Record<string, any>) {\n${assignments.join('\n')}\n}`
}

function createRefDeclarationsFromDataObject(dataObject: t.ObjectExpression, dataBindings: DataBinding[]): string[] {
  const declarations: string[] = []
  const properties = new Map<string, t.ObjectProperty>()

  for (const prop of dataObject.properties) {
    if (prop.type !== 'ObjectProperty') continue
    const key = getPropertyName(prop.key)
    if (!key) continue
    properties.delete(key)
    properties.set(key, prop)
  }

  const usedNames = new Set<string>()
  for (const [sourceKey, prop] of properties) {
    const localName = uniqueIdentifier(safeIdentifier(sourceKey, 'Value'), usedNames)
    dataBindings.push({ sourceKey, localName })
    declarations.push(`const ${localName} = ref(${rewriteWxGlobals(toRefInitialValueCode(prop.value))})`)
  }

  return declarations
}

function toRefInitialValueCode(node: t.Expression | t.PatternLike): string {
  switch (node.type) {
    case 'StringLiteral':
    case 'NumericLiteral':
    case 'BooleanLiteral':
    case 'NullLiteral':
    case 'ArrayExpression':
    case 'ObjectExpression':
      return generate(node).code
    default:
      return fallbackInitialValueCode(node)
  }
}

function fallbackInitialValueCode(node: t.Expression | t.PatternLike): string {
  const code = generate(node).code
  if (/HEIGHT|WIDTH|height|width/i.test(code)) return '0'
  if (/\+\s*['"]px['"]/.test(code)) return "'0px'"
  return 'null'
}

function extractTouchWxAppConfig(script: string): TouchWxAppConfig {
  try {
    const ast = babelParse(script, { sourceType: 'module', plugins: ['typescript'] })
    const exportDefault = ast.program.body.find((node): node is t.ExportDefaultDeclaration =>
      node.type === 'ExportDefaultDeclaration'
    )
    const objectExpression = exportDefault?.declaration
    if (!objectExpression || objectExpression.type !== 'ObjectExpression') return { pages: [] }

    const configProp = findObjectProperty(objectExpression, 'config')
    if (!configProp?.value || configProp.value.type !== 'ObjectExpression') return { pages: [] }

    const value = literalObjectFromExpression(configProp.value) as TouchWxAppConfig
    return value || { pages: [] }
  } catch {
    return { pages: [] }
  }
}

function literalObjectFromExpression(node: t.ObjectExpression): Record<string, unknown> {
  const output: Record<string, unknown> = {}

  for (const prop of node.properties) {
    if (prop.type !== 'ObjectProperty') continue
    const key = getPropertyName(prop.key)
    if (!key) continue
    output[key] = literalValueFromNode(prop.value)
  }

  return output
}

function literalValueFromNode(node: t.Expression | t.PatternLike): unknown {
  switch (node.type) {
    case 'StringLiteral':
    case 'NumericLiteral':
    case 'BooleanLiteral':
      return node.value
    case 'NullLiteral':
      return null
    case 'ArrayExpression':
      return node.elements.map(item => item ? literalValueFromNode(item as t.Expression) : null)
    case 'ObjectExpression':
      return literalObjectFromExpression(node)
    default:
      return generate(node).code
  }
}

function findObjectProperty(objectExpression: t.ObjectExpression, name: string): t.ObjectProperty | undefined {
  return objectExpression.properties.find((prop): prop is t.ObjectProperty =>
    prop.type === 'ObjectProperty' && getPropertyName(prop.key) === name
  )
}

function getPropertyName(key: t.Node): string | null {
  if (key.type === 'Identifier') return key.name
  if (key.type === 'StringLiteral') return key.value
  if (key.type === 'NumericLiteral') return String(key.value)
  return null
}

function isObjectMember(prop: t.ObjectExpression['properties'][number]): prop is t.ObjectProperty | t.ObjectMethod {
  return prop.type === 'ObjectProperty' || prop.type === 'ObjectMethod'
}

function indentCode(code: string, indent: string): string {
  if (!code.trim()) return ''
  return code.split('\n').map(line => line ? indent + line : line).join('\n')
}

async function findTouchWxPages(sourceRoot: string): Promise<string[]> {
  const pagesRoot = join(sourceRoot, 'pages')
  const files: string[] = []

  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.wx')) {
        files.push(relative(sourceRoot, fullPath).replace(/\\/g, '/'))
      }
    }
  }

  await walk(pagesRoot)
  return files.sort((a, b) => scoreRoute(a) - scoreRoute(b) || a.localeCompare(b))
}

function scoreRoute(file: string): number {
  if (file === 'pages/index.wx') return -1000
  if (file === 'pages/home/about.wx') return -900
  return 0
}

function collectUiTags(template: string, tags: Set<string>): void {
  const regex = /<\/?(ui-[a-zA-Z0-9-]+)\b/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(template))) {
    tags.add(match[1])
  }
}

async function writeAppVue(outputRoot: string, appParts: SfcParts): Promise<void> {
  const appStyle = convertLessToScss(appParts.style)
  const content = `<script setup lang="ts">
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
${appStyle}
</style>
`

  await fs.writeFile(join(outputRoot, 'app.vue'), content, 'utf8')
}

async function writeVue3MpConfig(outputRoot: string, config: TouchWxAppConfig, pages: string[]): Promise<void> {
  const appConfig = {
    window: config.window || {
      navigationBarTitleText: 'TouchWX 迁移示例'
    },
    ...(config.tabBar ? { tabBar: config.tabBar } : {}),
    ...(config.networkTimeout ? { networkTimeout: config.networkTimeout } : {})
  }

  const content = `module.exports = ${JSON.stringify({
    app: appConfig,
    project: {
      description: 'TouchWX migrated Vue3 SFC example for FuckMP real-world validation',
      projectname: 'touchwx-migrated',
      libVersion: '2.19.4'
    },
    pageTitles: Object.fromEntries(pages.map(route => [route.split('/').pop() || route, route.split('/').pop() || route]))
  }, null, 2)}
`

  await fs.writeFile(join(outputRoot, 'vue3mp.config.js'), content, 'utf8')
}

async function writeUiStubComponents(outputRoot: string, tags: string[]): Promise<void> {
  await fs.ensureDir(join(outputRoot, 'components'))
  for (const tag of tags) {
    const content = createUiStubComponent(tag)
    await fs.writeFile(join(outputRoot, 'components', `${tag}.vue`), content, 'utf8')
  }
}

function createUiStubComponent(tag: string): string {
  const className = tag
  const displayName = tag.replace(/^ui-/, '')

  return `<script setup lang="ts">
/** TouchWX ${tag} 轻量迁移占位组件。 */
</script>

<template>
  <view class="${className}">
    <slot></slot>
  </view>
</template>

<style scoped>
.${className} {
  box-sizing: border-box;
}
.${className}:empty::after {
  color: #9aa4b2;
  content: '${displayName}';
  font-size: 24rpx;
}
</style>
`
}

async function copyTouchWxAssets(sourceRoot: string, outputRoot: string): Promise<string[]> {
  const copied: string[] = []
  for (const dir of ['images', 'static/data', 'static/map']) {
    const source = join(sourceRoot, dir)
    if (await fs.pathExists(source)) {
      const target = join(outputRoot, dir)
      await fs.copy(source, target)
      copied.push(dir)
    }
  }
  return copied
}

async function writeMigrationReadme(
  outputRoot: string,
  sourceRoot: string,
  pages: PageMigrationResult[],
  tags: string[],
  copiedAssets: string[]
): Promise<void> {
  const content = `# TouchWX 迁移示例

该目录由 \`scripts/migrate-touchwx.ts\` 从 \`${sourceRoot}\` 生成，用于真实测试 FuckMP 对 Vue3 SFC → 原生微信小程序的编译能力。

## 迁移范围

- 页面：${pages.length} 个 \`.wx\` 页面迁移为 \`.vue\` 页面。
- TouchWX UI 标签：${tags.length} 种 \`ui-*\` 标签生成轻量 Vue3 stub 组件，避免微信开发者工具缺组件。
- 静态资源：${copiedAssets.join(', ') || '无'}。
- 保留原模板中的微信原生语法，例如 \`wx:for\`、\`bindtap\`、\`map\`、\`swiper\`、\`scroll-view\`、\`button\` 等。

## 已知边界

- TouchWX 旧脚本按最小可编译策略迁移为 \`<script setup lang="ts">\`，保留核心状态、方法和生命周期；复杂运行时语义后续逐步增强。
- \`ui-*\` 组件当前是轻量占位，不复刻 TouchUI 完整交互，只用于真实页面编译和 DevTools 打开验证。
- 该示例是迁移夹具，重新运行迁移脚本会覆盖本目录。

## 重新生成

\`\`\`bash
pnpm tsx scripts/migrate-touchwx.ts
\`\`\`
`

  await fs.writeFile(join(outputRoot, 'README.md'), content, 'utf8')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ TouchWX 迁移失败:', error)
    process.exit(1)
  })
}
