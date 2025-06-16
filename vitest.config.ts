import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    testTimeout: 30000, // 增加超时时间，因为端到端测试需要更多时间
    hookTimeout: 30000,
    // 端到端测试配置
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true // 端到端测试使用单线程避免文件冲突
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/parser': resolve(__dirname, 'src/parser'),
      '@/transformer': resolve(__dirname, 'src/transformer'),
      '@/generator': resolve(__dirname, 'src/generator'),
      '@/runtime': resolve(__dirname, 'src/runtime'),
      '@/compiler': resolve(__dirname, 'src/compiler'),
      '@/cli': resolve(__dirname, 'src/cli'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/types': resolve(__dirname, 'src/types')
    }
  }
})
