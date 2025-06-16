// 调试路径处理逻辑
import { resolve, relative } from 'path'

function normalizePath(path) {
  return path.replace(/\\/g, '/')
}

function getRelativePath(from, to) {
  return normalizePath(relative(from, to))
}

function resolvePath(...paths) {
  return resolve(...paths)
}

function getOutputPath(inputPath, inputDir, outputDir, newExt) {
  const relativePath = getRelativePath(inputDir, inputPath)
  let outputPath = resolvePath(outputDir, relativePath)
  
  if (newExt) {
    const ext = path.extname(outputPath)
    outputPath = outputPath.replace(new RegExp(`${ext}$`), newExt)
  }
  
  return outputPath
}

function isPageComponent(filePath) {
  const normalizedPath = normalizePath(filePath)
  return normalizedPath.includes('/pages/') || normalizedPath.includes('\\pages\\')
}

// 测试用例
const testDir = '/Users/bing/Projects/vue3-wx/tests/temp'
const testFiles = [
  '/Users/bing/Projects/vue3-wx/tests/temp/app.vue',
  '/Users/bing/Projects/vue3-wx/tests/temp/pages/index/index.vue',
  '/Users/bing/Projects/vue3-wx/tests/temp/pages/profile/index.vue',
  '/Users/bing/Projects/vue3-wx/tests/temp/components/UserCard.vue',
  '/Users/bing/Projects/vue3-wx/tests/temp/components/TodoList.vue'
]

console.log('=== 路径处理测试 ===')
console.log('测试目录:', testDir)
console.log()

testFiles.forEach(file => {
  const isPage = isPageComponent(file)
  console.log(`文件: ${file}`)
  console.log(`是否为页面: ${isPage}`)
  
  if (isPage) {
    const outputPath = getOutputPath(file, testDir, '').replace(/^\//, '').replace(/\.vue$/, '')
    console.log(`输出路径: ${outputPath}`)
  }
  console.log('---')
})

console.log('\n=== 页面路径收集测试 ===')
const pageFiles = testFiles.filter(file => isPageComponent(file))
console.log('页面文件:', pageFiles)

const pages = pageFiles.map(file => {
  const outputPath = getOutputPath(file, testDir, '').replace(/^\//, '').replace(/\.vue$/, '')
  console.log(`页面路径转换: ${file} -> ${outputPath}`)
  return outputPath
})

console.log('最终页面路径:', pages)
