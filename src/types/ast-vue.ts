/**
 * Vue 专属 AST 节点类型定义。
 */

import type { ASTNode } from './ast-base.js'

/**
 * Vue响应式节点
 */
export interface VueReactiveNode extends ASTNode {
  type: 'VueReactive'
  apiType: 'ref' | 'reactive' | 'computed' | 'watch' | 'watchEffect'
  initialValue?: ASTNode
  getter?: ASTNode
  setter?: ASTNode
}

/**
 * Vue指令节点
 */
export interface VueDirectiveNode extends ASTNode {
  type: 'VueDirective'
  name: string
  expression?: ASTNode
  modifiers: string[]
  argument?: string
}

/**
 * Vue插槽节点
 */
export interface VueSlotNode extends ASTNode {
  type: 'VueSlot'
  name: string
  props?: Record<string, ASTNode>
  fallback?: ASTNode[]
}

/**
 * Vue组件节点
 */
export interface VueComponentNode extends ASTNode {
  type: 'VueComponent'
  name: string
  props: Record<string, ASTNode>
  slots: VueSlotNode[]
  directives: VueDirectiveNode[]
}

/**
 * Vue宏节点
 */
export interface VueMacroNode extends ASTNode {
  type: 'VueMacro'
  macroType: 'defineProps' | 'defineEmits' | 'defineExpose' | 'withDefaults'
  arguments: ASTNode[]
}
