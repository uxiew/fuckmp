// 分析生成的 WXML 结构
import { readFileSync } from 'fs'

const wxml = readFileSync('/Users/bing/Projects/vue3-wx/test-output/components/UserCard.wxml', 'utf8')

console.log('原始 WXML:')
console.log(wxml)

console.log('\n格式化后的 WXML:')
// 简单的格式化
let formatted = wxml
  .replace(/></g, '>\n<')
  .replace(/\s+/g, ' ')
  .split('\n')
  .map((line, index) => `${index + 1}: ${line.trim()}`)
  .join('\n')

console.log(formatted)

console.log('\n查找问题标签:')
// 查找自闭合的 view 标签
const selfClosingViews = wxml.match(/<view[^>]*\/>/g)
if (selfClosingViews) {
  console.log('发现自闭合的 view 标签:')
  selfClosingViews.forEach((tag, index) => {
    console.log(`${index + 1}: ${tag}`)
  })
}

// 查找 status-text
const statusTextMatches = wxml.match(/<text[^>]*class="status-text"[^>]*>[^<]*<\/text>/g)
if (statusTextMatches) {
  console.log('\n发现 status-text 元素:')
  statusTextMatches.forEach((tag, index) => {
    console.log(`${index + 1}: ${tag}`)
  })
}
