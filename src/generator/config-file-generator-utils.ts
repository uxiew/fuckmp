/**
 * 小程序静态配置文件生成工具函数。
 */

/**
 * 生成 project.config.json 配置对象。
 */
export function buildProjectConfig(appId: string, userProjectConfig: any): Record<string, any> {
  return {
    description: userProjectConfig?.description || '由 Vue3 微信小程序编译器生成的项目',
    packOptions: {
      ignore: [
        {
          type: 'file',
          value: '.eslintrc.js'
        },
        {
          type: 'file',
          value: '.gitignore'
        },
        {
          type: 'file',
          value: 'README.md'
        }
      ]
    },
    setting: {
      urlCheck: false,
      es6: true,
      enhance: true,
      postcss: true,
      preloadBackgroundData: false,
      minified: true,
      newFeature: true,
      coverView: true,
      nodeModules: false,
      autoAudits: false,
      showShadowRootInWxmlPanel: true,
      scopeDataCheck: false,
      uglifyFileName: false,
      checkInvalidKey: true,
      checkSiteMap: true,
      uploadWithSourceMap: true,
      compileHotReLoad: false,
      lazyloadPlaceholderEnable: false,
      useMultiFrameRuntime: true,
      useApiHook: true,
      useApiHostProcess: true,
      babelSetting: {
        ignore: [],
        disablePlugins: [],
        outputPath: ''
      },
      enableEngineNative: false,
      useIsolateContext: true,
      userConfirmedBundleSwitch: false,
      packNpmManually: false,
      packNpmRelationList: [],
      minifyWXSS: true,
      disableUseStrict: false,
      minifyWXML: true,
      showES6CompileOption: false,
      useCompilerPlugins: false
    },
    compileType: userProjectConfig?.compileType || 'miniprogram',
    libVersion: userProjectConfig?.libVersion || '2.19.4',
    appid: appId,
    projectname: userProjectConfig?.projectname || 'vue3-miniprogram',
    debugOptions: {
      hidedInDevtools: []
    },
    scripts: {},
    staticServerOptions: {
      baseURL: '',
      servePath: ''
    },
    isGameTourist: false,
    condition: {
      search: {
        list: []
      },
      conversation: {
        list: []
      },
      game: {
        list: []
      },
      plugin: {
        list: []
      },
      gamePlugin: {
        list: []
      },
      miniprogram: {
        list: []
      }
    }
  }
}

/**
 * 生成 sitemap.json 配置对象。
 */
export function buildSitemapConfig(): Record<string, any> {
  return {
    desc: 'sitemap 配置文件',
    rules: [
      {
        action: 'allow',
        page: '*'
      }
    ]
  }
}

/**
 * 生成小程序 TypeScript 配置对象。
 */
export function buildTSConfig(): Record<string, any> {
  return {
    compilerOptions: {
      target: 'ES2018',
      lib: ['ES2018'],
      allowJs: true,
      skipLibCheck: true,
      experimentalDecorators: true,
      noImplicitAny: false,
      allowSyntheticDefaultImports: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      moduleResolution: 'node',
      baseUrl: '.',
      typeRoots: [
        './typings'
      ],
      types: [
        'miniprogram-api-typings'
      ],
      paths: {
        '*': ['./typings/*']
      }
    },
    include: [
      './**/*.ts'
    ],
    exclude: [
      'node_modules'
    ]
  }
}
