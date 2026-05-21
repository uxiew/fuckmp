/**
 * Vue 3.5 Native-first 文档一致性审计。
 */

import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const FORMAL_DOCS = [
  'README.md',
  'docs/TODO.md',
  'docs/latest-platform-baseline.md',
  'docs/native-first-runtime-boundary.md'
]

const LATEST_MATRIX_ROWS = [
  {
    label: '`defineProps` type-based declaration',
    status: '已原生映射',
    refs: ['tests/e2e/define-props-type-based.test.ts']
  },
  {
    label: '`defineEmits` type-based declarations',
    status: '已原生映射',
    refs: ['tests/e2e/typed-emits.test.ts']
  },
  {
    label: '`defineModel` + 组件 `v-model`',
    status: '已原生映射',
    refs: ['tests/e2e/native-v-model.test.ts']
  },
  {
    label: '`withDefaults(defineProps())`',
    status: '已原生映射',
    refs: ['tests/e2e/with-defaults-props.test.ts']
  },
  {
    label: 'Vue 3.5 响应式 props 解构',
    status: '已原生映射',
    refs: ['tests/e2e/reactive-props-destructure.test.ts']
  },
  {
    label: '`defineExpose`',
    status: '明确降级',
    refs: ['tests/e2e/define-expose-degrade.test.ts']
  },
  {
    label: '`defineOptions`',
    status: '明确降级',
    refs: ['tests/e2e/define-options-degrade.test.ts']
  },
  {
    label: '`defineSlots`',
    status: '类型宏擦除 / 明确降级',
    refs: ['tests/e2e/define-slots-degrade.test.ts']
  },
  {
    label: '基础 slots / named slots',
    status: '已原生映射',
    refs: ['tests/e2e/slots-provide-inject-boundary.test.ts']
  },
  {
    label: '`provide` / `inject`',
    status: '明确降级',
    refs: ['tests/e2e/slots-provide-inject-boundary.test.ts']
  },
  {
    label: '`watch` / `watchEffect` / `onWatcherCleanup`',
    status: '明确降级',
    refs: ['tests/e2e/watcher-degrade.test.ts']
  },
  {
    label: '`useId`',
    status: '已原生映射',
    refs: ['tests/e2e/use-id-native.test.ts']
  },
  {
    label: '`useTemplateRef`',
    status: '明确降级',
    refs: ['tests/e2e/use-template-ref-degrade.test.ts']
  }
]

const README_NATIVE_FIRST_REFS = [
  'tests/e2e/define-props-type-based.test.ts',
  'tests/e2e/typed-emits.test.ts',
  'tests/e2e/native-v-model.test.ts',
  'tests/e2e/with-defaults-props.test.ts',
  'tests/e2e/reactive-props-destructure.test.ts',
  'tests/e2e/slots-provide-inject-boundary.test.ts',
  'tests/e2e/define-expose-degrade.test.ts',
  'tests/e2e/define-options-degrade.test.ts',
  'tests/e2e/define-slots-degrade.test.ts',
  'tests/e2e/watcher-degrade.test.ts',
  'tests/e2e/use-id-native.test.ts',
  'tests/e2e/use-template-ref-degrade.test.ts'
]

describe('Vue 3.5 Native-first 文档一致性', () => {
  it('正式文档中的测试引用都必须存在', () => {
    for (const docPath of FORMAL_DOCS) {
      const refs = extractTestRefs(readProjectFile(docPath))

      expect(refs.length, `${docPath} should reference verification tests`).toBeGreaterThan(0)
      for (const ref of refs) {
        expect(existsProjectFile(ref), `${docPath} references missing ${ref}`).toBe(true)
      }
    }
  })

  it('latest platform baseline 的每个 Vue 3.5 能力都有状态和验证测试', () => {
    const baseline = readProjectFile('docs/latest-platform-baseline.md')

    for (const row of LATEST_MATRIX_ROWS) {
      const line = findLineContaining(baseline, row.label)
      expect(line, `missing baseline row for ${row.label}`).toBeDefined()
      expect(line).toContain(row.status)
      for (const ref of row.refs) {
        expect(line).toContain(ref)
      }
    }
  })

  it('README 的 Native-first 公开矩阵必须镜像核心能力测试面', () => {
    const readme = readProjectFile('README.md')

    for (const ref of README_NATIVE_FIRST_REFS) {
      expect(readme).toContain(ref)
    }
  })

  it('runtime 边界必须保留 thin runtime 白名单与明确降级说明', () => {
    const boundary = readProjectFile('docs/native-first-runtime-boundary.md')

    expect(boundary).toContain('当前允许进入 `runtime-injection.js` 的能力只有')
    expect(boundary).toContain('`core`')
    expect(boundary).toContain('`reactivity`')
    expect(boundary).toContain('不允许用未实现的 runtime 模块占位来宣称支持某项 Vue 能力')
    expect(boundary).toContain('`RuntimeBundler.getRequiredModules()` 只返回 `core` 或 `core + reactivity`')
    expect(boundary).toContain('scoped slots / dynamic slots')
    expect(boundary).toContain('transition / keep-alive')
  })
})

/**
 * 读取项目内文本文件。
 */
function readProjectFile(relativePath: string): string {
  return readFileSync(projectPath(relativePath), 'utf8')
}

/**
 * 判断项目内文件是否存在。
 */
function existsProjectFile(relativePath: string): boolean {
  return existsSync(projectPath(relativePath))
}

/**
 * 拼接项目绝对路径。
 */
function projectPath(relativePath: string): string {
  return join(process.cwd(), relativePath)
}

/**
 * 从 Markdown 内容中提取测试文件引用。
 */
function extractTestRefs(content: string): string[] {
  return Array.from(new Set(content.match(/tests\/[\w/-]+\.test\.ts/g) ?? [])).sort()
}

/**
 * 查找包含指定片段的 Markdown 表格行。
 */
function findLineContaining(content: string, needle: string): string | undefined {
  return content.split('\n').find(line => line.startsWith('|') && line.includes(needle))
}
