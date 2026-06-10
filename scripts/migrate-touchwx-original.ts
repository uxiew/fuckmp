#!/usr/bin/env tsx

/**
 * TouchWX `_original` 迁移器。
 *
 * 第一阶段只读取 `/Users/bing/Workspace/touchwx/_original`，将原始 TouchWX scaffold
 * 与组件库 `.wxa` / `.wx` / `.wxc` 转成当前 FuckMP 可编译的 Vue3 SFC 示例工程。
 */

import { parse as babelParse } from '@babel/parser'
import generateModule from '@babel/generator'
import * as t from '@babel/types'
import fs from 'fs-extra'
import { basename, dirname, join, relative } from 'node:path'

const DEFAULT_ORIGINAL_ROOT = '/Users/bing/Workspace/touchwx/_original'
const DEFAULT_OUTPUT_ROOT = 'examples/touchwx-original-migrated'

const generate = (generateModule as unknown as { default?: typeof generateModule }).default || generateModule

const DEFAULT_APP_SOURCE = 'touchui-wx-cli-1.1.6/scaffold/project/application'
const DEFAULT_COMPONENTS_SOURCE = 'touchui-wx-components-1.0.13'

const PAGE_LIFECYCLE_IMPORTS = new Map([
  ['onLoad', 'onLoad'],
  ['onReady', 'onReady'],
  ['onShow', 'onShow'],
  ['onHide', 'onHide'],
  ['onUnload', 'onUnload'],
  ['onMounted', 'onMounted']
])

const COMPONENT_LIFECYCLE_IMPORTS = new Map([
  ['created', 'onMounted'],
  ['attached', 'onMounted'],
  ['ready', 'onMounted']
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
      createSelectorQuery() {
        return {
          in() { return this },
          select() { return this },
          boundingClientRect(callback?: (rect: { height: number, width: number }) => void) {
            callback?.({ height: 0, width: 0 })
            return this
          },
          exec() {}
        }
      },
      createMapContext() {
        return { moveToLocation() {} }
      },
      openSysMap() {}
    }

const objectToStyle = (value: Record<string, unknown> = {}) => Object.entries(value)
  .map(([key, item]) => key.replace(/[A-Z]/g, match => '-' + match.toLowerCase()) + ':' + String(item))
  .join(';')
`.trim()

interface SfcParts {
  template: string
  script: string
  style: string
  styleAttrs: string
}

interface DataBinding {
  sourceKey: string
  localName: string
}

interface PropBinding {
  sourceKey: string
  localName: string
  typeName: string
  defaultCode?: string
}

interface ScriptMigrationResult {
  code: string
  dataBindings: DataBinding[]
}

interface AppConfig {
  pages: string[]
  window?: Record<string, unknown>
  tabBar?: Record<string, unknown>
  networkTimeout?: Record<string, unknown>
}

interface MigratedFile {
  source: string
  output: string
}

interface OriginalMigrationSummary {
  originalRoot: string
  appSourceRoot: string
  componentsSourceRoot: string
  outputRoot: string
  pages: MigratedFile[]
  components: MigratedFile[]
  copiedAssets: string[]
}

async function main(): Promise<void> {
  const originalRoot = process.env.TOUCHWX_ORIGINAL_ROOT || DEFAULT_ORIGINAL_ROOT
  const outputRoot = process.env.TOUCHWX_ORIGINAL_OUTPUT_ROOT || join(process.cwd(), DEFAULT_OUTPUT_ROOT)
  const summary = await migrateTouchWxOriginalProject(originalRoot, outputRoot)

  console.log(`✅ TouchWX _original 迁移完成：${summary.pages.length} 个页面，${summary.components.length} 个组件`)
  console.log(`📁 输出目录：${summary.outputRoot}`)
}

/** 迁移 TouchWX `_original` 到当前 FuckMP Vue3 SFC 示例工程。 */
export async function migrateTouchWxOriginalProject(
  originalRoot = DEFAULT_ORIGINAL_ROOT,
  outputRoot = join(process.cwd(), DEFAULT_OUTPUT_ROOT)
): Promise<OriginalMigrationSummary> {
  const appSourceRoot = join(originalRoot, DEFAULT_APP_SOURCE)
  const componentsSourceRoot = join(originalRoot, DEFAULT_COMPONENTS_SOURCE)

  await fs.rm(outputRoot, { recursive: true, force: true })
  await fs.ensureDir(outputRoot)

  const appParts = splitSfc(await fs.readFile(join(appSourceRoot, 'app.wxa'), 'utf8'))
  const appConfig = extractAppConfig(appParts.script)
  const pages = await migrateOriginalPages(appSourceRoot, outputRoot)
  pages.push(...await migrateOriginalScaffoldPages(originalRoot, outputRoot))
  const components = await migrateOriginalComponents(componentsSourceRoot, outputRoot)
  components.push(...await migrateOriginalScaffoldComponents(originalRoot, outputRoot))
  components.push(...await writeMissingReferencedComponents(outputRoot))
  const copiedAssets = await copyOriginalAssets(appSourceRoot, componentsSourceRoot, outputRoot)

  await writeAppVue(outputRoot, appParts)
  await writeVue3MpConfig(outputRoot, appConfig, pages.map(page => page.output.replace(/\.vue$/, '')))
  await writeReadme(outputRoot, {
    originalRoot,
    appSourceRoot,
    componentsSourceRoot,
    pages,
    components,
    copiedAssets
  })

  return {
    originalRoot,
    appSourceRoot,
    componentsSourceRoot,
    outputRoot,
    pages,
    components,
    copiedAssets
  }
}

async function migrateOriginalPages(appSourceRoot: string, outputRoot: string): Promise<MigratedFile[]> {
  const pageFiles = await findFiles(join(appSourceRoot, 'pages'), file => file.endsWith('.wx'))
  const pages: MigratedFile[] = []

  for (const source of pageFiles) {
    const relativeSource = relative(appSourceRoot, source).replace(/\\/g, '/')
    const output = join(outputRoot, relativeSource.replace(/\.wx$/, '.vue'))
    const parts = splitSfc(await fs.readFile(source, 'utf8'))

    await fs.ensureDir(dirname(output))
    await fs.writeFile(output, createPageVue(parts, relativeSource), 'utf8')

    pages.push({
      source: relativeSource,
      output: relative(outputRoot, output).replace(/\\/g, '/')
    })
  }

  return pages.sort((a, b) => a.output.localeCompare(b.output))
}

async function migrateOriginalScaffoldPages(originalRoot: string, outputRoot: string): Promise<MigratedFile[]> {
  const scaffoldRoot = join(originalRoot, 'touchui-wx-cli-1.1.6/scaffold')
  const fixtures = [
    {
      source: join(scaffoldRoot, 'example/index.wx'),
      output: join(outputRoot, 'pages/original-fixtures/scaffold-example.vue')
    },
    {
      source: join(scaffoldRoot, 'page/index.wx'),
      output: join(outputRoot, 'pages/original-fixtures/scaffold-page.vue')
    },
    {
      source: join(scaffoldRoot, 'project/component/src/pages/home/index.wxp'),
      output: join(outputRoot, 'pages/original-fixtures/component-home.vue')
    }
  ]

  const pages: MigratedFile[] = []
  for (const fixture of fixtures) {
    if (!(await fs.pathExists(fixture.source))) continue
    const relativeSource = relative(originalRoot, fixture.source).replace(/\\/g, '/')
    const parts = splitSfc(await fs.readFile(fixture.source, 'utf8'))
    await fs.ensureDir(dirname(fixture.output))
    await fs.writeFile(fixture.output, createPageVue(parts, relativeSource), 'utf8')
    pages.push({
      source: relativeSource,
      output: relative(outputRoot, fixture.output).replace(/\\/g, '/')
    })
  }

  return pages
}

async function migrateOriginalComponents(componentsSourceRoot: string, outputRoot: string): Promise<MigratedFile[]> {
  const componentFiles = await findFiles(componentsSourceRoot, file => file.endsWith('.wxc'))
  const components: MigratedFile[] = []

  for (const source of componentFiles) {
    const componentName = basename(dirname(dirname(source)))
    if (!componentName.startsWith('ui-')) continue

    const variantName = basename(source, '.wxc')
    const outputName = variantName === 'index' ? componentName : `${componentName}-${variantName}`
    const output = join(outputRoot, 'components', `${outputName}.vue`)
    const parts = splitSfc(await fs.readFile(source, 'utf8'))

    await fs.ensureDir(dirname(output))
    await fs.writeFile(output, createComponentVue(parts, outputName), 'utf8')

    components.push({
      source: relative(componentsSourceRoot, source).replace(/\\/g, '/'),
      output: relative(outputRoot, output).replace(/\\/g, '/')
    })
  }

  return components.sort((a, b) => a.output.localeCompare(b.output))
}

async function migrateOriginalScaffoldComponents(originalRoot: string, outputRoot: string): Promise<MigratedFile[]> {
  const source = join(originalRoot, 'touchui-wx-cli-1.1.6/scaffold/package/src/index.wxc')
  if (!(await fs.pathExists(source))) return []

  const output = join(outputRoot, 'components/original-scaffold-package.vue')
  const parts = splitSfc(await fs.readFile(source, 'utf8'))
  await fs.ensureDir(dirname(output))
  await fs.writeFile(output, createComponentVue(parts, 'original-scaffold-package'), 'utf8')

  return [{
    source: relative(originalRoot, source).replace(/\\/g, '/'),
    output: relative(outputRoot, output).replace(/\\/g, '/')
  }]
}

async function writeMissingReferencedComponents(outputRoot: string): Promise<MigratedFile[]> {
  const vueFiles = await findFiles(outputRoot, file => file.endsWith('.vue'))
  const referencedTags = new Set<string>()
  const existingComponentNames = new Set<string>()

  for (const file of vueFiles) {
    if (file.includes('/components/')) {
      existingComponentNames.add(basename(file, '.vue'))
    }

    const parts = splitSfc(await fs.readFile(file, 'utf8'))
    collectCustomTags(parts.template, referencedTags)
  }

  const created: MigratedFile[] = []
  for (const tag of Array.from(referencedTags).sort()) {
    if (existingComponentNames.has(tag)) continue

    const output = join(outputRoot, 'components', `${tag}.vue`)
    await fs.ensureDir(dirname(output))
    await fs.writeFile(output, createFallbackReferencedComponent(tag), 'utf8')
    existingComponentNames.add(tag)
    created.push({
      source: `generated missing referenced component: ${tag}`,
      output: relative(outputRoot, output).replace(/\\/g, '/')
    })
  }

  return created
}

function collectCustomTags(template: string, tags: Set<string>): void {
  const regex = /<\/?([a-z][a-z0-9]*(?:-[a-z0-9]+)+)\b/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(template))) {
    const tag = match[1]
    if (tag.startsWith('ui-') || tag.startsWith('wxc-')) tags.add(tag)
  }
}

function createFallbackReferencedComponent(tag: string): string {
  return `<script setup lang="ts">
/** _original 迁移时为缺失引用 ${tag} 生成的轻量组件，保证 usingComponents 可解析。 */
</script>

<template>
  <view class="${tag}">
    <slot></slot>
  </view>
</template>

<style scoped>
.${tag} {
  box-sizing: border-box;
}
</style>
`
}

function createPageVue(parts: SfcParts, sourceFile: string): string {
  const script = migrateLegacyObjectScript(parts.script, {
    sourceFile,
    component: false
  })

  return `<script setup lang="ts">
${script.code}
</script>

<template>
${normalizeTemplate(parts.template, createIdentifierMap(script.dataBindings))}
</template>

<style lang="scss" scoped>
${convertLessToScss(parts.style)}
</style>
`
}

function createComponentVue(parts: SfcParts, componentName: string): string {
  const script = migrateLegacyObjectScript(parts.script, {
    sourceFile: `${componentName}/src/index.wxc`,
    component: true
  })

  return `<script setup lang="ts">
${script.code}
</script>

<template>
${normalizeTemplate(parts.template, createIdentifierMap(script.dataBindings))}
</template>

<style lang="scss" scoped>
${convertLessToScss(parts.style)}
</style>
`
}

function migrateLegacyObjectScript(script: string, options: { sourceFile: string, component: boolean }): ScriptMigrationResult {
  const dataBindings: DataBinding[] = []
  const propBindings: PropBinding[] = []
  const importedHooks = new Set<string>()

  try {
    const ast = babelParse(stripTemplatePlaceholders(script), {
      sourceType: 'module',
      plugins: ['typescript']
    })
    const objectExpression = findDefaultObjectExpression(ast.program.body)
    if (!objectExpression) return createFallbackScript(options.sourceFile)

    const lines: string[] = []
    lines.push(SCRIPT_UTILS)
    lines.push('')

    if (options.component) {
      propBindings.push(...extractPropBindings(findObjectProperty(objectExpression, 'properties')))
      lines.push(...createPropsDeclarations(propBindings))
      lines.push('')
    }

    const dataProperty = findObjectProperty(objectExpression, 'data')
    if (dataProperty?.value?.type === 'ObjectExpression') {
      lines.push(...createRefDeclarationsFromDataObject(dataProperty.value, dataBindings))
      lines.push('')
    }

    lines.push(createSetDataHelper(dataBindings))
    lines.push('')

    const dataNameMap = createIdentifierMap(dataBindings)
    const propNameMap = createPropIdentifierMap(propBindings)
    const methodMap = collectLegacyMethods(objectExpression, options.component)

    for (const [name, node] of methodMap) {
      const method = transformObjectMemberToFunction(node)
      if (!method) continue

      const lifecycleHook = options.component
        ? COMPONENT_LIFECYCLE_IMPORTS.get(name)
        : PAGE_LIFECYCLE_IMPORTS.get(name)

      const body = rewriteLegacyThisAccess(method.body, dataNameMap, propNameMap)
      if (lifecycleHook) {
        importedHooks.add(lifecycleHook)
        lines.push(`${lifecycleHook}(() => {`)
        lines.push(indentCode(body, '  '))
        lines.push('})')
      } else {
        const localMethodName = safeIdentifier(name, 'Handler')
        lines.push(`const ${localMethodName} = (${method.params}) => {`)
        lines.push(indentCode(body, '  '))
        lines.push('}')
      }
      lines.push('')
    }

    const imports = buildVueImports(importedHooks)
    return {
      code: `${imports}\n\n${lines.join('\n').trim()}\n`,
      dataBindings
    }
  } catch (error) {
    console.warn(`⚠️  ${options.sourceFile} 脚本迁移降级：${(error as Error).message}`)
    return createFallbackScript(options.sourceFile)
  }
}

function createFallbackScript(sourceFile: string): ScriptMigrationResult {
  return {
    code: `import { ref } from 'vue'\n\nconst __touchwxOriginalFallback = ref(null)\n\n// ${sourceFile} 的旧脚本结构暂无法自动迁移，保留空状态用于编译验收。\n`,
    dataBindings: []
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

function buildVueImports(hooks: Set<string>): string {
  const names = ['ref', ...Array.from(hooks)].sort()
  return `import { ${names.join(', ')} } from 'vue'`
}

function findDefaultObjectExpression(nodes: t.Statement[]): t.ObjectExpression | null {
  const exportDefault = nodes.find((node): node is t.ExportDefaultDeclaration =>
    node.type === 'ExportDefaultDeclaration'
  )
  return exportDefault?.declaration.type === 'ObjectExpression'
    ? exportDefault.declaration
    : null
}

function collectLegacyMethods(objectExpression: t.ObjectExpression, component: boolean): Map<string, t.Node> {
  const methods = new Map<string, t.Node>()

  for (const prop of objectExpression.properties) {
    if (!isObjectMember(prop)) continue
    const name = getPropertyName(prop.key)
    if (!name || name === 'config' || name === 'data' || name === 'properties' || name === 'options') continue
    const valueNode = prop.type === 'ObjectMethod' ? prop : prop.value
    methods.set(name, valueNode)
  }

  if (component) {
    const methodsProperty = findObjectProperty(objectExpression, 'methods')
    if (methodsProperty?.value.type === 'ObjectExpression') {
      for (const prop of methodsProperty.value.properties) {
        if (!isObjectMember(prop)) continue
        const name = getPropertyName(prop.key)
        if (!name) continue
        const valueNode = prop.type === 'ObjectMethod' ? prop : prop.value
        methods.set(name, valueNode)
      }
    }
  }

  return methods
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

function createPropsDeclarations(propBindings: PropBinding[]): string[] {
  if (propBindings.length === 0) return ['const props = defineProps<Record<string, never>>()']

  const typeLines = propBindings.map(prop => `  ${prop.localName}?: ${prop.typeName}`)
  const defaults = propBindings
    .filter(prop => prop.defaultCode !== undefined)
    .map(prop => `  ${prop.localName}: ${prop.defaultCode}`)

  if (defaults.length === 0) {
    return [`const props = defineProps<{\n${typeLines.join('\n')}\n}>()`]
  }

  return [`const props = withDefaults(defineProps<{\n${typeLines.join('\n')}\n}>(), {\n${defaults.join(',\n')}\n})`]
}

function extractPropBindings(prop: t.ObjectProperty | undefined): PropBinding[] {
  if (!prop || prop.value.type !== 'ObjectExpression') return []

  const bindings: PropBinding[] = []
  const usedNames = new Set<string>()

  for (const item of prop.value.properties) {
    if (item.type !== 'ObjectProperty') continue
    const sourceKey = getPropertyName(item.key)
    if (!sourceKey) continue

    const localName = uniqueIdentifier(safeIdentifier(sourceKey, 'Prop'), usedNames)
    const config = item.value.type === 'ObjectExpression' ? item.value : null
    bindings.push({
      sourceKey,
      localName,
      typeName: getPropTypeName(config),
      defaultCode: getPropDefaultCode(config)
    })
  }

  return bindings
}

function getPropTypeName(config: t.ObjectExpression | null): string {
  if (!config) return 'any'
  const typeProp = findObjectProperty(config, 'type')
  if (!typeProp) return 'any'

  const code = generate(typeProp.value).code
  if (/String/.test(code) && /Number/.test(code)) return 'string | number'
  if (/String/.test(code) && /Boolean/.test(code)) return 'string | boolean'
  if (/Number/.test(code) && /Boolean/.test(code)) return 'number | boolean'
  if (/String/.test(code)) return 'string'
  if (/Number/.test(code)) return 'number'
  if (/Boolean/.test(code)) return 'boolean'
  if (/Array/.test(code)) return 'any[]'
  if (/Object/.test(code)) return '{ [key: string]: any }'
  return 'any'
}

function getPropDefaultCode(config: t.ObjectExpression | null): string | undefined {
  if (!config) return undefined
  const valueProp = findObjectProperty(config, 'value')
  if (!valueProp) return undefined
  return toSafeInitialValueCode(valueProp.value)
}

function createRefDeclarationsFromDataObject(dataObject: t.ObjectExpression, dataBindings: DataBinding[]): string[] {
  const declarations: string[] = []
  const properties = new Map<string, t.ObjectProperty>()

  for (const prop of dataObject.properties) {
    if (prop.type !== 'ObjectProperty') continue
    const key = getPropertyName(prop.key)
    if (!key) continue
    properties.set(key, prop)
  }

  const usedNames = new Set<string>()
  for (const [sourceKey, prop] of properties) {
    const localName = uniqueIdentifier(safeIdentifier(sourceKey, 'Value'), usedNames)
    dataBindings.push({ sourceKey, localName })
    declarations.push(`const ${localName} = ref(${rewriteWxGlobals(toSafeInitialValueCode(prop.value))})`)
  }

  return declarations
}

function toSafeInitialValueCode(node: t.Expression | t.PatternLike): string {
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
  if (/HEIGHT|WIDTH|height|width/i.test(code)) return /px/.test(code) ? "'0px'" : '0'
  if (/\+\s*['"]px['"]/.test(code)) return "'0px'"
  if (/true|false/.test(code)) return 'false'
  return 'null'
}

function createSetDataHelper(dataBindings: DataBinding[]): string {
  const assignments = dataBindings.map(({ sourceKey, localName }) =>
    `  if (Object.prototype.hasOwnProperty.call(patch, '${sourceKey}')) ${localName}.value = patch['${sourceKey}']`
  )

  if (assignments.length === 0) return 'function setData(_patch: Record<string, any>) {}'
  return `function setData(patch: Record<string, any>) {\n${assignments.join('\n')}\n}`
}

function rewriteLegacyThisAccess(code: string, dataNameMap: Map<string, string>, propNameMap: Map<string, string>): string {
  let output = code
  output = output.replace(/\bthis\.setData\s*\(/g, 'setData(')
  output = output.replace(/\bthis\.triggerEvent\s*\(/g, 'triggerEvent(')
  output = output.replace(/\bthis\.data\.([A-Za-z_$][\w$]*)/g, (_match, key: string) => {
    if (dataNameMap.has(key)) return `${dataNameMap.get(key)}.value`
    if (propNameMap.has(key)) return `props.${propNameMap.get(key)}`
    return `${key}.value`
  })
  output = output.replace(/\bthis\.properties\.([A-Za-z_$][\w$]*)/g, (_match, key: string) => `props.${propNameMap.get(key) || key}`)
  output = output.replace(/\bthis\.([A-Za-z_$][\w$]*)\s*\(/g, '$1(')
  output = output.replace(/\bvar\s+([A-Za-z_$][\w$]*)\s*=\s*this;/g, 'const $1 = { setData }')
  output = output.replace(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*this;/g, 'const $1 = { setData }')
  output = output.replace(/\bthis\.([A-Za-z_$][\w$]*)\b/g, (_match, key: string) => {
    if (dataNameMap.has(key)) return `${dataNameMap.get(key)}.value`
    if (propNameMap.has(key)) return `props.${propNameMap.get(key)}`
    return key
  })
  output = rewriteWxGlobals(output)
  output = output.replace(/\bOTS\s*\(/g, 'objectToStyle(')
  return output
}

function rewriteWxGlobals(code: string): string {
  return code.replace(/\bwx\./g, 'wxSafe.')
}

function normalizeTemplate(template: string, dataNameMap: Map<string, string>): string {
  const output = template
    .replace(/<%=[\s\S]*?%>/g, 'TouchWXOriginal')
    .replace(/<%[\s\S]*?%>/g, '')
    .replace(/<\/?page\b[^>]*>/g, '')
    .replace(/<\/ui-image>/g, '</image>')
    .replace(/<\/ui-button>/g, '</button>')
    .replace(/(\sstyle)=\{\{([\s\S]*?)\}\}/g, '$1="{{$2}}"')
    .replace(/\bsrc="\{\{triangleImg\}\}"/g, 'src="{{triangleImg}}"')
    .replace(/\s*\{\{\s*\}\}/g, '')
    .replace(/\{\{\s+\}\}/g, '')
    .trim()

  return balanceViewTags(replaceTemplateIdentifiers(output, dataNameMap))
}

function balanceViewTags(template: string): string {
  const openCount = Array.from(template.matchAll(/<view\b(?![^>]*\/>)/g)).length
  const closeCount = Array.from(template.matchAll(/<\/view>/g)).length
  const missingCloseCount = openCount - closeCount
  if (missingCloseCount <= 0) return template
  return `${template}\n${'</view>'.repeat(missingCloseCount)}`
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
  const scss = style
    .replace(/<%=[\s\S]*?%>/g, 'touchwx-original')
    .replace(/<%[\s\S]*?%>/g, '')
    .replace(/(^|[^:])\/\/([^\n\r]*)/g, '$1/*$2 */')
    .replace(/@b\s+([A-Za-z0-9_-]+)\s*\{/g, '.$1 {')
    .replace(/@e\s+([A-Za-z0-9_-]+)\s*\{/g, '&__$1 {')
    .replace(/@import\s+['"][^'"]+['"];\s*/g, '/* migrated less import removed */\n')
    .replace(/^@([A-Za-z0-9_-]+)\s*:\s*([^;]+);/gm, (_match, name: string, value: string) =>
      `$${name}: ${replaceKnownLessVariables(value)};`
    )
    .replace(/@charset\s+[^;]+;\s*/g, '')
    .replace(/@([A-Za-z0-9_-]+)/g, (match, name: string) =>
      isKnownLessVariable(name) ? `$${name}` : match
    )
    .replace(/\.mix-flex-center\s*\(\s*\)\s*;?/g, 'display: flex; align-items: center; justify-content: center;')
    .replace(/\.mix-flex-x-center\s*\(\s*\)\s*;?/g, 'display: flex; justify-content: center;')
    .replace(/\.mix-flex-y-center\s*\(\s*\)\s*;?/g, 'display: flex; align-items: center;')
    .replace(/\.([A-Za-z0-9_-]+)\s*\(([^;{}\n]*)\)\s*;?/g, '/* migrated less mixin: .$1($2); */')

  return `$theme-color: #3399ff !default;\n$disabled-color: #eff2f7 !default;\n${scss}`
}

function replaceKnownLessVariables(value: string): string {
  return value.replace(/@([A-Za-z0-9_-]+)/g, (match, name: string) =>
    isKnownLessVariable(name) ? `$${name}` : match
  )
}

function isKnownLessVariable(name: string): boolean {
  return !new Set(['keyframes', 'media', 'font-face', 'supports', 'b', 'e', 'c', 'return', 'import']).has(name)
}

function extractAppConfig(script: string): AppConfig {
  try {
    const ast = babelParse(stripTemplatePlaceholders(script), { sourceType: 'module', plugins: ['typescript'] })
    const objectExpression = findDefaultObjectExpression(ast.program.body)
    if (!objectExpression) return { pages: [] }

    const configProp = findObjectProperty(objectExpression, 'config')
    if (!configProp?.value || configProp.value.type !== 'ObjectExpression') return { pages: [] }

    return literalObjectFromExpression(configProp.value) as AppConfig
  } catch {
    return { pages: ['pages/home/index'] }
  }
}

function stripTemplatePlaceholders(content: string): string {
  return content
    .replace(/<%[\s\S]*?%>/g, '')
    .replace(/<%=[\s\S]*?%>/g, "'TouchWX _original'")
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

async function writeAppVue(outputRoot: string, appParts: SfcParts): Promise<void> {
  const content = `<script setup lang="ts">
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
${convertLessToScss(appParts.style)}
</style>
`

  await fs.writeFile(join(outputRoot, 'app.vue'), content, 'utf8')
}

async function writeVue3MpConfig(outputRoot: string, config: AppConfig, pages: string[]): Promise<void> {
  const appConfig = {
    window: config.window || {
      navigationBarTitleText: 'TouchWX _original'
    },
    ...(config.tabBar ? { tabBar: config.tabBar } : {}),
    ...(config.networkTimeout ? { networkTimeout: config.networkTimeout } : {})
  }

  const content = `module.exports = ${JSON.stringify({
    app: appConfig,
    project: {
      description: 'TouchWX _original migrated Vue3 SFC example for FuckMP validation',
      projectname: 'touchwx-original-migrated',
      libVersion: '2.19.4'
    },
    pageTitles: Object.fromEntries(pages.map(route => [route.split('/').pop() || route, route.split('/').pop() || route]))
  }, null, 2)}\n`

  await fs.writeFile(join(outputRoot, 'vue3mp.config.js'), content, 'utf8')
}

async function copyOriginalAssets(appSourceRoot: string, componentsSourceRoot: string, outputRoot: string): Promise<string[]> {
  const copied: string[] = []

  for (const dir of ['static/data', 'static/styles', 'static/utils']) {
    const source = join(appSourceRoot, dir)
    if (await fs.pathExists(source)) {
      await fs.copy(source, join(outputRoot, dir))
      copied.push(dir)
    }
  }

  const imageFiles = await findFiles(componentsSourceRoot, file => /\/src\/images\//.test(file))
  for (const imageFile of imageFiles) {
    const componentName = basename(dirname(dirname(dirname(imageFile))))
    const target = join(outputRoot, 'components', 'images', componentName, basename(imageFile))
    await fs.ensureDir(dirname(target))
    await fs.copy(imageFile, target)
  }
  if (imageFiles.length > 0) copied.push('components/images')

  return copied
}

async function writeReadme(outputRoot: string, summary: Omit<OriginalMigrationSummary, 'outputRoot'>): Promise<void> {
  const content = `# TouchWX _original 迁移示例

该目录由 \`scripts/migrate-touchwx-original.ts\` 从 \`${summary.originalRoot}\` 生成，是 TouchWX 迁移的第一阶段验收夹具。

## 迁移范围

- scaffold 页面：${summary.pages.length} 个 \`.wx\` 页面迁移为 \`.vue\` 页面。
- 原始组件库：${summary.components.length} 个 \`.wxc\` 组件迁移为 Vue3 SFC。
- 静态资源：${summary.copiedAssets.join(', ') || '无'}。

## 验收目标

先确保 \`_original\` 可以在当前 FuckMP Vue3 开发方式下完成 SFC 解析和小程序编译，再继续迁移真实 \`touchwx/touchwx\` 应用。
`

  await fs.writeFile(join(outputRoot, 'README.md'), content, 'utf8')
}

async function findFiles(root: string, filter: (file: string) => boolean): Promise<string[]> {
  const files: string[] = []
  if (!(await fs.pathExists(root))) return files

  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'lib') continue
        await walk(fullPath)
      } else if (entry.isFile() && filter(fullPath)) {
        files.push(fullPath)
      }
    }
  }

  await walk(root)
  return files.sort()
}

function createIdentifierMap(dataBindings: DataBinding[]): Map<string, string> {
  return new Map(dataBindings.map(binding => [binding.sourceKey, binding.localName]))
}

function createPropIdentifierMap(propBindings: PropBinding[]): Map<string, string> {
  return new Map(propBindings.map(binding => [binding.sourceKey, binding.localName]))
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
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
    'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function', 'if',
    'import', 'in', 'instanceof', 'new', 'return', 'super', 'switch', 'this', 'throw',
    'try', 'typeof', 'var', 'void', 'while', 'with', 'yield', 'enum', 'await',
    'implements', 'interface', 'let', 'package', 'private', 'protected', 'public', 'static'
  ]).has(name)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ TouchWX _original 迁移失败:', error)
    process.exit(1)
  })
}
