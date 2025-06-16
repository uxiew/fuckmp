import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/cli/index.ts'
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  splitting: false,
  treeshake: true,
  target: 'node18',
  outDir: 'dist',
  external: [
    'vue'
  ],
  esbuildOptions(options) {
    options.conditions = ['module']
  }
})
