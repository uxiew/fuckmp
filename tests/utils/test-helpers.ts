/**
 * 测试辅助工具
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { SFCParser } from '@/parser/sfc-parser.js'
import { ScriptParser } from '@/parser/script-parser.js'
import { ScriptTransformer } from '@/transformer/script-transformer.js'
import { DEFAULT_COMPILER_OPTIONS } from '@/compiler/options.js'

/**
 * 读取测试fixture文件
 */
export function readFixture(filename: string): string {
  const fixturePath = resolve(__dirname, '../fixtures', filename)
  return readFileSync(fixturePath, 'utf-8')
}

/**
 * 解析Vue文件的script部分
 */
export async function parseVueScript(vueContent: string) {
  const sfcParser = new SFCParser(DEFAULT_COMPILER_OPTIONS)
  const parseResult = await sfcParser.parseSFC(vueContent, 'test.vue')

  if (!parseResult.script) {
    throw new Error('Vue文件中没有找到script部分')
  }

  const scriptParser = new ScriptParser()
  return scriptParser.parseScript(parseResult.script.content, 'test.vue')
}

/**
 * 转换脚本
 */
export async function transformScript(vueContent: string, isPage: boolean = false) {
  const scriptParseResult = await parseVueScript(vueContent)
  const scriptTransformer = new ScriptTransformer()
  return scriptTransformer.transformScript(scriptParseResult, 'test.vue', isPage)
}

/**
 * 创建测试用的Vue文件内容
 */
export function createTestVue(scriptContent: string, templateContent: string = '<template><view></view></template>'): string {
  return `${templateContent}

<script setup lang="ts">
${scriptContent}
</script>

<style scoped>
.test { color: red; }
</style>`
}

/**
 * 断言对象包含指定属性
 */
export function assertObjectContains(obj: any, expectedProps: Record<string, any>) {
  for (const [key, expectedValue] of Object.entries(expectedProps)) {
    if (!(key in obj)) {
      throw new Error(`对象缺少属性: ${key}`)
    }

    if (typeof expectedValue === 'object' && expectedValue !== null) {
      assertObjectContains(obj[key], expectedValue)
    } else if (obj[key] !== expectedValue) {
      throw new Error(`属性 ${key} 的值不匹配。期望: ${expectedValue}, 实际: ${obj[key]}`)
    }
  }
}

/**
 * 断言函数体包含指定内容
 */
export function assertFunctionBodyContains(functionBody: string, expectedContent: string[]) {
  for (const content of expectedContent) {
    if (!functionBody.includes(content)) {
      throw new Error(`函数体缺少内容: ${content}`)
    }
  }
}

/**
 * 格式化错误信息
 */
export function formatError(message: string, actual: any, expected: any): string {
  return `${message}
实际值: ${JSON.stringify(actual, null, 2)}
期望值: ${JSON.stringify(expected, null, 2)}`
}
