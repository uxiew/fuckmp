/**
 * create 命令项目模板定义与文件内容生成。
 */

import {
  createBasicTemplateFiles,
  type CreateTemplateFeatures
} from './create-basic-template-files.js'
import {
  createAdvancedTemplateFiles,
  createEcommerceTemplateFiles
} from './create-business-template-files.js'

/**
 * 项目模板。
 */
export interface ProjectTemplate {
  name: string
  description: string
  features: string[]
  files: Record<string, string>
}

/**
 * 获取项目模板
 */
export function getProjectTemplate(templateName: string, features: CreateTemplateFeatures): ProjectTemplate {
  const templates: Record<string, ProjectTemplate> = {
    basic: createBasicTemplate(features),
    advanced: createAdvancedTemplate(features),
    ecommerce: createEcommerceTemplate(features)
  }

  const template = templates[templateName]
  if (!template) {
    throw new Error(`未知的模板: ${templateName}`)
  }

  return template
}

/**
 * 创建基础模板
 */
function createBasicTemplate(features: CreateTemplateFeatures): ProjectTemplate {
  return {
    name: 'basic',
    description: '基础 Vue3 小程序模板',
    features: [
      'Vue3',
      'Composition API',
      ...(features.typescript ? ['TypeScript'] : []),
      ...(features.scss ? ['SCSS'] : [])
    ],
    files: createBasicTemplateFiles(features)
  }
}

/**
 * 创建高级模板
 */
function createAdvancedTemplate(features: CreateTemplateFeatures): ProjectTemplate {
  const basicTemplate = createBasicTemplate(features)

  return {
    ...basicTemplate,
    name: 'advanced',
    description: '高级 Vue3 小程序模板',
    features: [...basicTemplate.features, 'Pinia', 'Router', 'Utils'],
    files: {
      ...basicTemplate.files,
      ...createAdvancedTemplateFiles()
    }
  }
}

/**
 * 创建电商模板
 */
function createEcommerceTemplate(features: CreateTemplateFeatures): ProjectTemplate {
  const advancedTemplate = createAdvancedTemplate(features)

  return {
    ...advancedTemplate,
    name: 'ecommerce',
    description: '电商 Vue3 小程序模板',
    features: [...advancedTemplate.features, 'Product List', 'Shopping Cart', 'Order'],
    files: {
      ...advancedTemplate.files,
      ...createEcommerceTemplateFiles()
    }
  }
}
