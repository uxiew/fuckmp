import { describe, expect, it } from 'vitest'
import { promises as fs } from 'fs'
import { join } from 'path'
import { exists, writeFile } from '@/utils/index.js'
import {
  getGeneratedOutputFilePaths,
  removeGeneratedOutputFiles
} from '@/compiler/compiler-output-utils.js'

describe('compiler output utils', () => {
  it('计算 Vue 源文件对应的小程序输出产物路径', () => {
    const inputRoot = join(process.cwd(), 'src')
    const outputRoot = join(process.cwd(), 'dist')
    const inputPath = join(inputRoot, 'pages/home/index.vue')

    expect(getGeneratedOutputFilePaths(inputPath, inputRoot, outputRoot)).toEqual([
      join(outputRoot, 'pages/home/index.js'),
      join(outputRoot, 'pages/home/index.json'),
      join(outputRoot, 'pages/home/index.wxml'),
      join(outputRoot, 'pages/home/index.wxss'),
      join(outputRoot, 'pages/home/index.js.map')
    ])
  })

  it('删除确定的编译产物并保留非编译产物', async () => {
    const tempRoot = join(process.cwd(), 'tests/temp/compiler-output-cleanup')
    const inputRoot = join(tempRoot, 'src')
    const outputRoot = join(tempRoot, 'dist')
    const inputPath = join(inputRoot, 'components/UserCard.vue')
    const generatedFiles = getGeneratedOutputFilePaths(inputPath, inputRoot, outputRoot)
    const unrelatedFile = join(outputRoot, 'components/UserCard.custom')

    await fs.rm(tempRoot, { recursive: true, force: true })
    await Promise.all([
      ...generatedFiles.map(file => writeFile(file, 'generated')),
      writeFile(unrelatedFile, 'keep me')
    ])

    await removeGeneratedOutputFiles(inputPath, inputRoot, outputRoot)

    await Promise.all(generatedFiles.map(async file => {
      expect(await exists(file)).toBe(false)
    }))
    expect(await exists(unrelatedFile)).toBe(true)
  })
})
