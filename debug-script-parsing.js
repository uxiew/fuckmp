// 调试脚本解析和转换
import { ScriptParser } from './src/parser/script-parser.ts'
import { ScriptTransformer } from './src/transformer/script-transformer.ts'
import { readFileSync } from 'fs'

async function debugScriptParsing() {
  console.log('=== 调试脚本解析和转换 ===')

  const parser = new ScriptParser()
  const transformer = new ScriptTransformer()

  // 读取测试组件
  const componentPath = './test-project/components/UserCard.vue'
  const content = readFileSync(componentPath, 'utf-8')

  // 提取 script 部分
  const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/)
  if (!scriptMatch) {
    console.log('❌ 没有找到 script 标签')
    return
  }

  const scriptContent = scriptMatch[1]
  console.log('📝 Script 内容:')
  console.log(scriptContent)
  console.log('\n' + '='.repeat(50) + '\n')

  try {
    // 解析脚本
    console.log('🔍 开始解析脚本...')
    const parseResult = await parser.parseScript(scriptContent, componentPath)

    console.log('📊 解析结果:')
    console.log('- 导入:', parseResult.imports.size)
    parseResult.imports.forEach((imp, source) => {
      console.log(`  ${source}: ${imp.specifiers.map(s => s.local).join(', ')}`)
    })

    console.log('- 宏调用:', parseResult.macros.size)
    parseResult.macros.forEach((calls, macro) => {
      console.log(`  ${macro}: ${calls.length} 次调用`)
      calls.forEach(call => {
        console.log(`    参数: ${JSON.stringify(call.arguments)}`)
        console.log(`    泛型: ${call.typeParameters ? 'YES' : 'NO'}`)
        if (call.typeParameters) {
          console.log(`    泛型详情: ${JSON.stringify(call.typeParameters, null, 2)}`)
        }
      })
    })

    console.log('- 变量:', parseResult.variables.size)
    parseResult.variables.forEach((variable, name) => {
      console.log(`  ${name}: ${variable.type}, reactive: ${variable.isReactive}, type: ${variable.macroType}`)
    })

    console.log('- 函数:', parseResult.functions.size)
    parseResult.functions.forEach((func, name) => {
      console.log(`  ${name}: params: ${func.params.join(', ')}, async: ${func.isAsync}`)
    })

    console.log('\n' + '='.repeat(50) + '\n')

    // 转换脚本
    console.log('🔄 开始转换脚本...')
    const transformResult = await transformer.transformScript(parseResult, componentPath, false)

    console.log('📊 转换结果:')
    console.log('- Props:', Object.keys(transformResult.context.props).length)
    console.log('- Emits:', transformResult.context.emits.length)
    console.log('- Data:', Object.keys(transformResult.context.data).length)
    console.log('- Methods:', Object.keys(transformResult.context.methods).length)
    console.log('- Computed:', Object.keys(transformResult.context.computed).length)
    console.log('- Lifecycle:', Object.keys(transformResult.context.lifecycle).length)

    console.log('\n📝 转换后的上下文数据:')
    console.log('Props:', transformResult.context.props)
    console.log('Emits:', transformResult.context.emits)
    console.log('Data:', transformResult.context.data)
    console.log('Methods:', Object.keys(transformResult.context.methods))
    console.log('Computed:', Object.keys(transformResult.context.computed))
    console.log('Lifecycle:', Object.keys(transformResult.context.lifecycle))

  } catch (error) {
    console.error('❌ 解析/转换失败:', error.message)
    console.error(error.stack)
  }
}

debugScriptParsing().catch(console.error)
