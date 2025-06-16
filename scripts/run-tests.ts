#!/usr/bin/env tsx

/**
 * 测试运行脚本
 */

import { spawn } from 'child_process'
import { join } from 'path'

interface TestSuite {
  name: string
  pattern: string
  description: string
}

const testSuites: TestSuite[] = [
  {
    name: 'e2e-vue-component',
    pattern: 'tests/e2e/vue-to-miniprogram.test.ts',
    description: 'Vue3 组件到小程序组件的完整编译测试'
  },
  {
    name: 'e2e-template-directives',
    pattern: 'tests/e2e/template-directives.test.ts',
    description: 'Vue 模板指令转换测试'
  },
  {
    name: 'e2e-style-transformation',
    pattern: 'tests/e2e/style-transformation.test.ts',
    description: 'SCSS 到 WXSS 样式转换测试'
  },
  {
    name: 'e2e-project-compilation',
    pattern: 'tests/e2e/project-compilation.test.ts',
    description: '完整项目编译测试'
  }
]

/**
 * 运行单个测试套件
 */
async function runTestSuite(suite: TestSuite): Promise<boolean> {
  console.log(`\n🧪 运行测试: ${suite.name}`)
  console.log(`📝 描述: ${suite.description}`)
  console.log(`📁 文件: ${suite.pattern}`)
  console.log('─'.repeat(60))

  return new Promise((resolve) => {
    const child = spawn('npx', ['vitest', 'run', suite.pattern], {
      stdio: 'inherit',
      cwd: process.cwd()
    })

    child.on('close', (code) => {
      const success = code === 0
      console.log(`\n${success ? '✅' : '❌'} 测试 ${suite.name} ${success ? '通过' : '失败'}`)
      resolve(success)
    })

    child.on('error', (error) => {
      console.error(`❌ 测试运行错误: ${error.message}`)
      resolve(false)
    })
  })
}

/**
 * 运行所有测试
 */
async function runAllTests(): Promise<void> {
  console.log('🚀 Vue3 微信小程序编译器 - 端到端测试')
  console.log('=' * 60)

  const results: Array<{ suite: TestSuite; success: boolean }> = []

  for (const suite of testSuites) {
    const success = await runTestSuite(suite)
    results.push({ suite, success })
  }

  // 显示测试总结
  console.log('\n📊 测试总结')
  console.log('=' * 60)

  const passed = results.filter(r => r.success).length
  const total = results.length

  results.forEach(({ suite, success }) => {
    console.log(`${success ? '✅' : '❌'} ${suite.name}: ${suite.description}`)
  })

  console.log('\n📈 统计信息')
  console.log(`总测试套件: ${total}`)
  console.log(`通过: ${passed}`)
  console.log(`失败: ${total - passed}`)
  console.log(`成功率: ${((passed / total) * 100).toFixed(1)}%`)

  if (passed === total) {
    console.log('\n🎉 所有测试都通过了！编译器功能正常。')
    process.exit(0)
  } else {
    console.log('\n⚠️  有测试失败，请检查编译器实现。')
    process.exit(1)
  }
}

/**
 * 运行覆盖率测试
 */
async function runCoverageTest(): Promise<void> {
  console.log('\n📊 运行覆盖率测试...')
  
  return new Promise((resolve) => {
    const child = spawn('npx', ['vitest', 'run', '--coverage'], {
      stdio: 'inherit',
      cwd: process.cwd()
    })

    child.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ 覆盖率测试完成')
      } else {
        console.log('\n❌ 覆盖率测试失败')
      }
      resolve()
    })
  })
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2)
  
  if (args.includes('--coverage')) {
    await runCoverageTest()
    return
  }

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Vue3 微信小程序编译器测试运行器

用法:
  tsx scripts/run-tests.ts [选项]

选项:
  --coverage    运行覆盖率测试
  --help, -h    显示帮助信息

测试套件:
${testSuites.map(suite => `  ${suite.name}: ${suite.description}`).join('\n')}
`)
    return
  }

  await runAllTests()
}

// 运行主函数
main().catch((error) => {
  console.error('❌ 测试运行器错误:', error)
  process.exit(1)
})
