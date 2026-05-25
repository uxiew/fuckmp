/**
 * 对象字面量序列化器。
 *
 * 负责把编译上下文中的对象、函数串和表达式串转换为小程序可执行的
 * JavaScript 对象字面量，保持 CodeGenerator 输出格式稳定。
 */
import {
  convertEventHandlerFunction,
  convertObjectMethodArrowFunctions,
  deepCloneWithSerializerPlaceholders,
  stringifyObjectLiteral
} from './object-serializer-utils.js'

export class ObjectLiteralSerializer {
  /**
   * 将对象序列化为字符串，保留函数。
   */
  stringifyWithFunctions(obj: any): string {
    const functionPlaceholders = new Map<string, string>()
    const placeholderState = { index: 0 }

    const processedObj = deepCloneWithSerializerPlaceholders(
      obj,
      functionPlaceholders,
      placeholderState
    )

    let result = stringifyObjectLiteral(processedObj, 2)

    for (const [placeholder, functionCode] of functionPlaceholders) {
      result = result.split(`"${placeholder}"`).join(functionCode)
    }

    return convertObjectMethodArrowFunctions(result)
  }

  /**
   * 将对象序列化为 JavaScript 对象字面量格式（不给属性名加引号）。
   */
  stringifyObjectLiteral(obj: any, indent: number = 0): string {
    return stringifyObjectLiteral(obj, indent)
  }

  /**
   * 检测并转换事件处理函数，使其能够从 dataset 中获取参数。
   */
  convertEventHandlerFunction(functionName: string, functionStr: string): string {
    return convertEventHandlerFunction(functionName, functionStr)
  }
}
