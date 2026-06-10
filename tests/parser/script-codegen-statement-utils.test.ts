import { describe, expect, it } from 'vitest'
import { parseScript } from '@/utils/index'
import {
  generateBlockStatementCode,
  generateStatementCode
} from '@/parser/script-codegen-statement-utils.js'
import {
  extractArgumentValue,
  generateCodeString
} from '@/parser/script-codegen-utils'

const statementContext = {
  generateCodeString,
  extractArgumentValue
}

function statementsOf(source: string): any[] {
  const ast = parseScript(`function __test__() {\n${source}\n}`)
  const declaration = ast.program.body[0]
  if (declaration?.type !== 'FunctionDeclaration') {
    throw new Error('未找到函数声明')
  }
  return declaration.body.body
}

function statementOf(source: string): any {
  const [statement] = statementsOf(source)
  if (!statement) {
    throw new Error('未找到语句')
  }
  return statement
}

describe('script codegen statement utils', () => {
  it('生成 block 与基础 statement 代码片段', () => {
    const block = statementOf(`if (flag) {
      const total = count + 1
      return total
    }`).consequent

    expect(generateBlockStatementCode(block, statementContext)).toBe(
      '{\n    const total = count + 1\n    return total\n  }'
    )
  })

  it('生成 if/else 与 switch 控制流代码片段', () => {
    const ifStatement = statementOf(`if (flag) {
      return 'ready'
    } else {
      return 'wait'
    }`)
    const switchStatement = statementOf(`switch (status) {
      case 'ready':
        return count
      default:
        break
    }`)

    expect(generateStatementCode(ifStatement, statementContext)).toBe(
      "if (flag) {\n    return 'ready'\n  } else {\n    return 'wait'\n  }"
    )
    expect(generateStatementCode(switchStatement, statementContext)).toBe(
      'switch (status) {\n    case "ready":\n      return count\n    default:\n      break\n  }'
    )
  })

  it('生成 for/while 循环和未知语句 fallback', () => {
    const forStatement = statementOf(`for (let i = 0; i < limit; i++) {
      total += i
    }`)
    const whileStatement = statementOf(`while (ready) {
      continue
    }`)

    expect(generateStatementCode(forStatement, statementContext)).toBe(
      'for (let i = 0; i < limit; i++) {\n    total += i\n  }'
    )
    expect(generateStatementCode(whileStatement, statementContext)).toBe(
      'while (ready) {\n    continue\n  }'
    )
    expect(generateStatementCode({ type: 'DebuggerStatement' }, statementContext)).toBe(
      '// DebuggerStatement'
    )
  })
})
