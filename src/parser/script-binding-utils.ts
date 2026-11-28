import type { NodePath, Scope } from '@babel/traverse'
import * as t from '@babel/types'
import { VUE3_MACROS } from '@/types/index.js'

const vueNames = new Set<string>(Object.values(VUE3_MACROS))

export function getVueCallName(call: t.CallExpression, scope: Scope): string | null {
  const callee = call.callee
  if (!t.isIdentifier(callee)) return null

  const binding = scope.getBinding(callee.name)
  if (!binding) return vueNames.has(callee.name) ? callee.name : null

  const specifier = binding.path
  const declaration = specifier.parentPath
  if (!specifier.isImportSpecifier() || !declaration?.isImportDeclaration() ||
    declaration.node.source.value !== 'vue' || declaration.node.importKind === 'type' ||
    specifier.node.importKind === 'type') {
    return null
  }

  const { imported } = specifier.node
  const name = t.isIdentifier(imported) ? imported.name : imported.value
  return vueNames.has(name) ? name : null
}

export function isSetupDeclaration(path: NodePath): boolean {
  const parent = path.parentPath
  return Boolean(parent?.isProgram() ||
    ((parent?.isExportNamedDeclaration() || parent?.isExportDefaultDeclaration()) && parent.parentPath?.isProgram()))
}

export function isSetupCall(path: NodePath<t.CallExpression>): boolean {
  const parent = path.parentPath
  if (parent?.isExpressionStatement()) return parent.parentPath?.isProgram() === true
  if (parent?.isVariableDeclarator() && parent.node.init === path.node && parent.parentPath) {
    return isSetupDeclaration(parent.parentPath)
  }
  return parent?.isCallExpression() && parent.node.arguments[0] === path.node &&
    getVueCallName(parent.node, parent.scope) === 'withDefaults' &&
    isSetupCall(parent)
}
