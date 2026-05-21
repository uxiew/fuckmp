/**
 * TransformContext 创建工具。
 */

import type { TransformContext } from '@/types/index.js'
import { isPageComponent } from '@/utils/index.js'

/**
 * 创建编译单文件所需的初始转换上下文。
 */
export function createInitialTransformContext(
  filePath: string,
  hasScoped: boolean
): TransformContext {
  return {
    filename: filePath,
    isPage: isPageComponent(filePath),
    hasScoped,
    props: {},
    emits: [],
    expose: {},
    defineOptions: {},
    defineSlots: {},
    watcherEffects: {},
    templateRefs: {},
    useIds: {},
    provideInject: {},
    data: {},
    methods: {},
    computed: {},
    watch: {},
    lifecycle: {},
    imports: new Set(),
    components: new Map()
  }
}
