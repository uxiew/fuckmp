/**
 * TypeScript 类型引用解析工具。
 */

import type { ScriptParseResult } from '@/parser/index.js'
import { existsSync, readFileSync } from 'fs'
import { dirname, extname, resolve } from 'path'
import { parseScript } from '@/utils/index.js'

/**
 * 将宏泛型参数中的本地类型引用解析为实际 AST 类型声明。
 */
export function resolveTypeReferenceParameters(
  typeParameters: any,
  parseResult: ScriptParseResult,
  filename?: string
): any {
  const firstParam = typeParameters?.params?.[0]
  if (!firstParam || firstParam.type !== 'TSTypeReference') {
    return typeParameters
  }

  const typeName = getTypeReferenceName(firstParam)
  const resolvedType = typeName
    ? findLocalTypeDeclaration(parseResult, typeName) || findImportedTypeDeclaration(parseResult, typeName, filename)
    : null
  if (!resolvedType) {
    return typeParameters
  }

  return {
    ...typeParameters,
    params: [resolvedType, ...typeParameters.params.slice(1)]
  }
}

/**
 * 获取简单类型引用名，如 Props。
 */
function getTypeReferenceName(typeNode: any): string {
  const typeName = typeNode.typeName
  return typeName?.type === 'Identifier' ? typeName.name : ''
}

/**
 * 在当前 SFC 脚本中查找本地 interface 或 type alias。
 */
function findLocalTypeDeclaration(parseResult: ScriptParseResult, typeName: string): any | null {
  const body = parseResult.ast?.program?.body || []

  for (const statement of body) {
    const declaration = unwrapTypeDeclaration(statement, typeName)
    if (declaration) return declaration
  }

  return null
}

/**
 * 在相对 import type 文件中查找 interface 或 type alias。
 */
function findImportedTypeDeclaration(parseResult: ScriptParseResult, typeName: string, filename?: string): any | null {
  if (!filename) return null

  for (const [source, importInfo] of parseResult.imports) {
    if (!source.startsWith('.')) continue

    const matchedSpecifier = importInfo.specifiers.find(spec => spec.local === typeName)
    if (!matchedSpecifier) continue

    const importedName = matchedSpecifier.imported || matchedSpecifier.local
    const importedFile = resolveImportFile(filename, source)
    if (!importedFile) continue

    try {
      const ast = parseScript(readFileSync(importedFile, 'utf8'))
      const importedParseResult = { ...parseResult, ast } as ScriptParseResult
      const declaration = findLocalTypeDeclaration(importedParseResult, importedName)
      if (declaration) return declaration
    } catch {
      return null
    }
  }

  return null
}

/**
 * 解析相对类型导入文件路径。
 */
function resolveImportFile(filename: string, source: string): string {
  const basePath = resolve(dirname(filename), source)
  const candidates = extname(basePath)
    ? [basePath]
    : [`${basePath}.ts`, `${basePath}.d.ts`, `${basePath}.tsx`, resolve(basePath, 'index.ts')]

  return candidates.find(candidate => existsSync(candidate)) || ''
}

/**
 * 从普通或 export 包裹的 TS 声明中提取可复用类型节点。
 */
function unwrapTypeDeclaration(statement: any, typeName: string): any | null {
  const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement
  if (declaration?.type === 'TSInterfaceDeclaration' && declaration.id?.name === typeName) {
    return declaration
  }

  if (declaration?.type === 'TSTypeAliasDeclaration' && declaration.id?.name === typeName) {
    return declaration.typeAnnotation
  }

  return null
}
