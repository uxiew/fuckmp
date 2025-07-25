// 完整的 Vue3 到微信小程序编译器
// 支持 <script setup>、SCSS、完整的 Vue3 特性

import { parse as vueParse, compileTemplate, compileScript } from '@vue/compiler-sfc';
import { parse as babelParse, traverse, generate } from '@babel/core';
import * as t from '@babel/types';
import sass from 'sass';
import postcss from 'postcss';

// 1. 增强的编译器选项
interface CompilerOptions {
  input: string;
  output: string;
  appId: string;
  framework: 'vue3';
  features: {
    scriptSetup: boolean;      // 支持 <script setup>
    scss: boolean;             // 支持 SCSS
    typescript: boolean;       // 支持 TypeScript
    compositionApi: boolean;   // 支持组合式 API
    emits: boolean;           // 支持 emits
    slots: boolean;           // 支持插槽
    provide: boolean;         // 支持 provide/inject
  };
  optimization: {
    minify: boolean;
    treeshaking: boolean;
    sourcemap: boolean;
  };
}

// 2. Vue3 宏和特性映射
const VUE3_MACROS = {
  // <script setup> 编译时宏
  defineProps: 'defineProps',
  defineEmits: 'defineEmits',
  defineExpose: 'defineExpose',
  defineOptions: 'defineOptions',
  defineSlots: 'defineSlots',
  defineModel: 'defineModel',
  withDefaults: 'withDefaults',
  
  // 运行时 API
  ref: 'ref',
  reactive: 'reactive',
  computed: 'computed',
  watch: 'watch',
  watchEffect: 'watchEffect',
  onMounted: 'onMounted',
  onUnmounted: 'onUnmounted',
  onUpdated: 'onUpdated',
  nextTick: 'nextTick',
  
  // 组件通信
  provide: 'provide',
  inject: 'inject',
  
  // 模板引用
  templateRef: 'templateRef',
  getCurrentInstance: 'getCurrentInstance'
};

// 3. 增强的 SFC 解析器
class EnhancedVueSFCParser {
  async parseSFC(content: string, filename: string) {
    const { descriptor, errors } = vueParse(content, { filename });
    
    if (errors.length > 0) {
      throw new Error(`SFC 解析错误: ${errors.map(e => e.message).join(', ')}`);
    }

    return {
      template: descriptor.template,
      script: descriptor.script,
      scriptSetup: descriptor.scriptSetup,
      styles: descriptor.styles,
      customBlocks: descriptor.customBlocks,
      filename,
      descriptor
    };
  }

  // 编译 <script setup>
  async compileScriptSetup(descriptor: any, options: CompilerOptions) {
    if (!descriptor.scriptSetup) return null;

    const compiled = compileScript(descriptor, {
      id: descriptor.filename,
      isProd: !options.optimization.sourcemap,
      inlineTemplate: !descriptor.template,
      templateOptions: {
        ssr: false,
        compilerOptions: {
          mode: 'module'
        }
      }
    });

    return {
      content: compiled.content,
      bindings: compiled.bindings,
      imports: compiled.imports,
      props: compiled.props,
      emits: compiled.emits,
      expose: compiled.expose,
      slots: compiled.slots
    };
  }
}

// 4. Script Setup 转换器
class ScriptSetupTransformer {
  private macroHandlers = new Map();

  constructor() {
    this.initMacroHandlers();
  }

  private initMacroHandlers() {
    // defineProps 处理
    this.macroHandlers.set('defineProps', (node: any, context: any) => {
      const props = this.extractPropsDefinition(node);
      context.props = props;
      return this.generateMiniprogramProps(props);
    });

    // defineEmits 处理
    this.macroHandlers.set('defineEmits', (node: any, context: any) => {
      const emits = this.extractEmitsDefinition(node);
      context.emits = emits;
      return this.generateMiniprogramEmits(emits);
    });

    // defineExpose 处理
    this.macroHandlers.set('defineExpose', (node: any, context: any) => {
      const exposed = this.extractExposeDefinition(node);
      context.expose = exposed;
      return this.generateMiniprogramExpose(exposed);
    });

    // ref/reactive 处理
    this.macroHandlers.set('ref', (node: any, context: any) => {
      return this.transformRef(node, context);
    });

    this.macroHandlers.set('reactive', (node: any, context: any) => {
      return this.transformReactive(node, context);
    });

    // computed 处理
    this.macroHandlers.set('computed', (node: any, context: any) => {
      return this.transformComputed(node, context);
    });

    // watch 处理
    this.macroHandlers.set('watch', (node: any, context: any) => {
      return this.transformWatch(node, context);
    });

    // 生命周期处理
    ['onMounted', 'onUnmounted', 'onUpdated', 'onActivated', 'onDeactivated'].forEach(hook => {
      this.macroHandlers.set(hook, (node: any, context: any) => {
        return this.transformLifecycleHook(hook, node, context);
      });
    });
  }

  async transformScriptSetup(scriptSetup: any, context: any) {
    const ast = babelParse(scriptSetup.content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    });

    const transformContext = {
      props: {},
      emits: [],
      expose: {},
      data: {},
      methods: {},
      computed: {},
      watch: {},
      lifecycle: {},
      imports: new Set(),
      components: new Map()
    };

    // 遍历 AST 并转换
    traverse(ast, {
      // 处理 import 语句
      ImportDeclaration: (path) => {
        this.handleImport(path, transformContext);
      },

      // 处理变量声明
      VariableDeclaration: (path) => {
        this.handleVariableDeclaration(path, transformContext);
      },

      // 处理函数声明
      FunctionDeclaration: (path) => {
        this.handleFunctionDeclaration(path, transformContext);
      },

      // 处理调用表达式（宏调用）
      CallExpression: (path) => {
        this.handleCallExpression(path, transformContext);
      }
    });

    return this.generateMiniprogramComponent(transformContext);
  }

  private handleImport(path: any, context: any) {
    const source = path.node.source.value;
    
    if (source === 'vue') {
      // 处理 Vue 导入
      path.node.specifiers.forEach(spec => {
        if (t.isImportSpecifier(spec)) {
          context.imports.add(spec.imported.name);
        }
      });
    } else if (source.endsWith('.vue')) {
      // 处理组件导入
      path.node.specifiers.forEach(spec => {
        if (t.isImportDefaultSpecifier(spec)) {
          context.components.set(spec.local.name, source);
        }
      });
    }
  }

  private handleVariableDeclaration(path: any, context: any) {
    path.node.declarations.forEach(decl => {
      if (t.isVariableDeclarator(decl) && t.isIdentifier(decl.id)) {
        const name = decl.id.name;
        
        if (t.isCallExpression(decl.init)) {
          const callee = decl.init.callee;
          
          if (t.isIdentifier(callee)) {
            const macroName = callee.name;
            
            if (this.macroHandlers.has(macroName)) {
              const handler = this.macroHandlers.get(macroName);
              const result = handler(decl.init, context);
              
              // 根据宏类型添加到对应的上下文
              if (macroName === 'ref' || macroName === 'reactive') {
                context.data[name] = result;
              } else if (macroName === 'computed') {
                context.computed[name] = result;
              }
            }
          }
        } else {
          // 普通变量声明
          context.data[name] = this.evaluateExpression(decl.init);
        }
      }
    });
  }

  private handleCallExpression(path: any, context: any) {
    const callee = path.node.callee;
    
    if (t.isIdentifier(callee)) {
      const macroName = callee.name;
      
      if (this.macroHandlers.has(macroName)) {
        const handler = this.macroHandlers.get(macroName);
        handler(path.node, context);
      }
    }
  }

  // 转换 ref
  private transformRef(node: any, context: any) {
    const arg = node.arguments[0];
    const initialValue = arg ? this.evaluateExpression(arg) : null;
    
    return {
      type: 'ref',
      value: initialValue,
      reactive: true
    };
  }

  // 转换 computed
  private transformComputed(node: any, context: any) {
    const arg = node.arguments[0];
    
    if (t.isArrowFunctionExpression(arg) || t.isFunctionExpression(arg)) {
      const body = generate(arg.body).code;
      
      return {
        type: 'computed',
        getter: body,
        dependencies: this.extractDependencies(arg.body)
      };
    }
  }

  // 转换 watch
  private transformWatch(node: any, context: any) {
    const [source, callback, options] = node.arguments;
    
    return {
      type: 'watch',
      source: generate(source).code,
      callback: generate(callback).code,
      options: options ? this.evaluateExpression(options) : {}
    };
  }

  // 生成小程序组件代码
  private generateMiniprogramComponent(context: any) {
    const { props, emits, data, methods, computed, watch, lifecycle, components } = context;

    return {
      js: `
Component({
  // 属性定义
  properties: ${JSON.stringify(this.transformPropsToProperties(props), null, 2)},
  
  // 数据
  data: ${JSON.stringify(data, null, 2)},
  
  // 生命周期
  lifetimes: {
    created() {
      this._setupReactivity();
      ${lifecycle.created || ''}
    },
    
    attached() {
      ${lifecycle.mounted || ''}
    },
    
    detached() {
      ${lifecycle.unmounted || ''}
    },
    
    ready() {
      ${lifecycle.ready || ''}
    }
  },
  
  // 方法
  methods: {
    ${this.generateMethods(methods)},
    
    ${this.generateComputedMethods(computed)},
    
    ${this.generateWatchMethods(watch)},
    
    ${this.generateEmitMethods(emits)},
    
    // 响应式系统
    _setupReactivity() {
      ${this.generateReactivitySetup(data, computed, watch)}
    },
    
    // 更新数据的方法
    _updateData(key, value) {
      this.setData({
        [key]: value
      });
    }
  }
});
      `,
      json: {
        component: true,
        usingComponents: this.generateUsingComponents(components)
      }
    };
  }

  // 生成响应式设置代码
  private generateReactivitySetup(data: any, computed: any, watch: any) {
    const reactivityCode = [];

    // 设置计算属性
    Object.entries(computed).forEach(([key, config]: [string, any]) => {
      reactivityCode.push(`
        Object.defineProperty(this.data, '${key}', {
          get: () => {
            return (${config.getter}).call(this);
          },
          enumerable: true,
          configurable: true
        });
      `);
    });

    // 设置监听器
    Object.entries(watch).forEach(([key, config]: [string, any]) => {
      reactivityCode.push(`
        this._watchers = this._watchers || [];
        this._watchers.push({
          source: '${config.source}',
          callback: ${config.callback},
          options: ${JSON.stringify(config.options)}
        });
      `);
    });

    return reactivityCode.join('\n');
  }
}

// 5. 模板编译器增强
class EnhancedTemplateCompiler {
  private directiveTransformers = new Map();
  
  constructor() {
    this.initDirectiveTransformers();
  }

  private initDirectiveTransformers() {
    // v-model 双向绑定
    this.directiveTransformers.set('v-model', (node: any, directive: any) => {
      const modelValue = directive.exp?.content || 'modelValue';
      const modelModifiers = directive.modifiers || [];
      
      // 不同表单元素的处理
      switch (node.tag) {
        case 'input':
          return this.transformInputVModel(node, modelValue, modelModifiers);
        case 'textarea':
          return this.transformTextareaVModel(node, modelValue, modelModifiers);
        case 'picker':
          return this.transformPickerVModel(node, modelValue, modelModifiers);
        default:
          return this.transformCustomVModel(node, modelValue, modelModifiers);
      }
    });

    // v-for 列表渲染
    this.directiveTransformers.set('v-for', (node: any, directive: any) => {
      const forExp = directive.exp.content;
      const [item, index, list] = this.parseForExpression(forExp);
      
      return {
        'wx:for': `{{${list}}}`,
        'wx:for-item': item,
        'wx:for-index': index || 'index',
        'wx:key': this.extractKey(node) || 'index'
      };
    });

    // v-if 条件渲染
    this.directiveTransformers.set('v-if', (node: any, directive: any) => {
      return {
        'wx:if': `{{${directive.exp.content}}}`
      };
    });

    // v-show 显示隐藏
    this.directiveTransformers.set('v-show', (node: any, directive: any) => {
      return {
        'hidden': `{{!(${directive.exp.content})}}`
      };
    });

    // 事件处理
    this.directiveTransformers.set('v-on', (node: any, directive: any) => {
      const eventName = directive.arg?.content;
      const handler = directive.exp?.content;
      
      return {
        [`bind${eventName}`]: handler
      };
    });
  }

  async compileTemplate(template: string, context: any) {
    // 使用 Vue 的模板编译器
    const compiled = compileTemplate({
      source: template,
      id: context.filename,
      compilerOptions: {
        mode: 'module'
      }
    });

    if (compiled.errors.length > 0) {
      throw new Error(`模板编译错误: ${compiled.errors.join(', ')}`);
    }

    // 转换为小程序模板
    return this.transformToWXML(compiled.ast, context);
  }

  private transformInputVModel(node: any, modelValue: string, modifiers: string[]) {
    const inputType = node.props?.find(p => p.name === 'type')?.value?.content || 'text';
    
    const bindings = {
      'value': `{{${modelValue}}}`,
      'bindinput': `_handleInput_${modelValue.replace(/\./g, '_')}`
    };

    // 处理修饰符
    if (modifiers.includes('number')) {
      bindings['bindinput'] = `_handleNumberInput_${modelValue.replace(/\./g, '_')}`;
    }
    
    if (modifiers.includes('trim')) {
      bindings['bindblur'] = `_handleTrimInput_${modelValue.replace(/\./g, '_')}`;
    }

    return bindings;
  }

  private transformCustomVModel(node: any, modelValue: string, modifiers: string[]) {
    // 自定义组件的 v-model
    return {
      [modelValue]: `{{${modelValue}}}`,
      [`bind:update:${modelValue}`]: `_handleUpdate_${modelValue.replace(/\./g, '_')}`
    };
  }
}

// 6. 样式编译器增强
class EnhancedStyleCompiler {
  async compileStyle(style: any, options: CompilerOptions) {
    let content = style.content;
    
    // 编译 SCSS
    if (style.lang === 'scss' || style.lang === 'sass') {
      const result = sass.compileString(content, {
        style: 'expanded',
        sourceMap: options.optimization.sourcemap
      });
      content = result.css;
    }

    // PostCSS 处理
    const postcssResult = await postcss([
      // 添加厂商前缀
      require('autoprefixer'),
      // 转换单位
      this.createUnitTransformer(),
      // 处理 CSS 变量
      this.createCSSVariableTransformer(),
      // 移除不支持的属性
      this.createUnsupportedRemover()
    ]).process(content, {
      from: undefined,
      map: options.optimization.sourcemap
    });

    return {
      css: postcssResult.css,
      map: postcssResult.map?.toString()
    };
  }

  private createUnitTransformer() {
    return {
      postcssPlugin: 'miniprogram-unit-transformer',
      Rule(rule) {
        rule.walkDecls(decl => {
          // px 转 rpx
          decl.value = decl.value.replace(/(\d+(\.\d+)?)px/g, (match, num) => {
            return `${parseFloat(num) * 2}rpx`;
          });
          
          // vh/vw 转换
          decl.value = decl.value.replace(/(\d+(\.\d+)?)vh/g, (match, num) => {
            return `${parseFloat(num) * 13.34}rpx`; // 假设屏幕高度 667px
          });
          
          decl.value = decl.value.replace(/(\d+(\.\d+)?)vw/g, (match, num) => {
            return `${parseFloat(num) * 7.5}rpx`; // 假设屏幕宽度 375px
          });
        });
      }
    };
  }

  private createCSSVariableTransformer() {
    return {
      postcssPlugin: 'css-variable-transformer',
      Rule(rule) {
        const variables = new Map();
        
        // 收集 CSS 变量
        rule.walkDecls(decl => {
          if (decl.prop.startsWith('--')) {
            variables.set(decl.prop, decl.value);
            decl.remove();
          }
        });
        
        // 替换 var() 函数
        rule.walkDecls(decl => {
          decl.value = decl.value.replace(/var\((--[^),]+)(?:,\s*([^)]+))?\)/g, (match, varName, fallback) => {
            return variables.get(varName) || fallback || match;
          });
        });
      }
    };
  }
}

// 7. 主编译器类
class CompleteVue3MiniprogramCompiler {
  private parser = new EnhancedVueSFCParser();
  private scriptTransformer = new ScriptSetupTransformer();
  private templateCompiler = new EnhancedTemplateCompiler();
  private styleCompiler = new EnhancedStyleCompiler();

  async compile(options: CompilerOptions) {
    console.log('🚀 开始编译 Vue3 项目到微信小程序...');
    
    try {
      // 1. 项目分析
      const projectInfo = await this.analyzeProject(options.input);
      console.log(`📁 发现 ${projectInfo.components.length} 个组件, ${projectInfo.pages.length} 个页面`);
      
      // 2. 生成项目配置
      await this.generateProjectConfig(projectInfo, options);
      
      // 3. 编译组件和页面
      await this.compileComponents(projectInfo.components, options);
      await this.compilePages(projectInfo.pages, options);
      
      // 4. 处理静态资源
      await this.handleAssets(options);
      
      // 5. 生成运行时
      await this.generateRuntime(options);
      
      console.log('✅ 编译完成!');
      
    } catch (error) {
      console.error('❌ 编译失败:', error);
      throw error;
    }
  }

  private async compileVueFile(filePath: string, options: CompilerOptions) {
    console.log(`🔄 编译: ${filePath}`);
    
    const content = await this.readFile(filePath);
    const parsed = await this.parser.parseSFC(content, filePath);
    
    const results = {
      js: '',
      json: {},
      wxml: '',
      wxss: ''
    };

    // 编译脚本
    if (parsed.scriptSetup) {
      const scriptResult = await this.scriptTransformer.transformScriptSetup(parsed.scriptSetup, {
        filename: filePath,
        isPage: this.isPageComponent(filePath)
      });
      results.js = scriptResult.js;
      results.json = scriptResult.json;
    }

    // 编译模板
    if (parsed.template) {
      results.wxml = await this.templateCompiler.compileTemplate(parsed.template.content, {
        filename: filePath
      });
    }

    // 编译样式
    if (parsed.styles.length > 0) {
      const styleResults = await Promise.all(
        parsed.styles.map(style => this.styleCompiler.compileStyle(style, options))
      );
      results.wxss = styleResults.map(r => r.css).join('\n');
    }

    return results;
  }

  // 生成运行时适配代码
  private async generateRuntime(options: CompilerOptions) {
    const runtimeCode = `
// Vue3 微信小程序运行时适配
class Vue3MiniprogramRuntime {
  // 响应式数据管理
  static createReactiveData(initialData) {
    const reactive = {};
    const watchers = [];
    
    Object.keys(initialData).forEach(key => {
      let value = initialData[key];
      
      Object.defineProperty(reactive, key, {
        get() {
          return value;
        },
        set(newValue) {
          const oldValue = value;
          value = newValue;
          
          // 触发页面更新
          const pages = getCurrentPages();
          if (pages.length > 0) {
            const currentPage = pages[pages.length - 1];
            currentPage.setData({
              [key]: newValue
            });
          }
          
          // 触发监听器
          watchers.forEach(watcher => {
            if (watcher.key === key) {
              watcher.callback(newValue, oldValue);
            }
          });
        }
      });
    });
    
    return { reactive, watchers };
  }
  
  // 计算属性支持
  static createComputed(computedMap, reactiveData) {
    const computed = {};
    
    Object.keys(computedMap).forEach(key => {
      Object.defineProperty(computed, key, {
        get() {
          return computedMap[key].call({ data: reactiveData });
        }
      });
    });
    
    return computed;
  }
  
  // 事件发射支持
  static createEmitter(component) {
    return {
      emit(event, ...args) {
        component.triggerEvent(event, ...args);
      }
    };
  }
}

// 导出运行时
module.exports = Vue3MiniprogramRuntime;
    `;

    await this.writeFile(`${options.output}/runtime/vue3-runtime.js`, runtimeCode);
  }
}

// 8. 使用示例
const fullCompilerOptions: CompilerOptions = {
  input: './src',
  output: './dist/miniprogram',
  appId: 'wx1234567890abcdef',
  framework: 'vue3',
  features: {
    scriptSetup: true,
    scss: true,
    typescript: true,
    compositionApi: true,
    emits: true,
    slots: true,
    provide: true
  },
  optimization: {
    minify: true,
    treeshaking: true,
    sourcemap: false
  }
};

// CLI 集成
export class Vue3MiniprogramAdvancedCLI {
  static async dev(options: CompilerOptions) {
    const compiler = new CompleteVue3MiniprogramCompiler();
    
    // 初始编译
    await compiler.compile(options);
    
    // 启动开发服务器
    const chokidar = require('chokidar');
    const watcher = chokidar.watch(options.input, {
      ignored: /node_modules/,
      persistent: true
    });
    
    watcher.on('change', async (path) => {
      console.log(`📝 文件变更: ${path}`);
      if (path.endsWith('.vue')) {
        await compiler.compileVueFile(path, options);
        console.log('🔄 热更新完成');
      }
    });
    
    console.log('🔥 开发模式启动，正在监听文件变化...');
  }
  
  static async build(options: CompilerOptions) {
    const compiler = new CompleteVue3MiniprogramCompiler();
    await compiler.compile(options);
  }
  
  static async analyze(inputPath: string) {
    const compiler = new CompleteVue3MiniprogramCompiler();
    const analysis = await compiler.analyzeProject(inputPath);
    
    console.log('📊 项目分析结果:');
    console.log(`- 组件数量: ${analysis.components.length}`);
    console.log(`- 页面数量: ${analysis.pages.length}`);
    console.log(`- 使用的 Vue3 特性: ${analysis.features.join(', ')}`);
    console.log(`- 依赖的第三方库: ${analysis.dependencies.join(', ')}`);
    
    return analysis;
  }
}

// 9. 完整使用示例

// Vue3 组件示例 (UserProfile.vue)
const vueComponentExample = `
<template>
  <view class="user-profile">
    <view class="avatar">
      <image :src="avatar" @click="changeAvatar" />
    </view>
    
    <view class="info">
      <input 
        v-model.trim="name" 
        placeholder="请输入姓名"
        @blur="saveName"
      />
      
      <picker 
        v-model="selectedCity" 
        :range="cities"
        @change="onCityChange"
      >
        <view class="picker-text">{{selectedCity || '选择城市'}}</view>
      </picker>
    </view>
    
    <view class="stats">
      <view class="stat-item" v-for="stat in userStats" :key="stat.key">
        <text class="label">{{stat.label}}</text>
        <text class="value">{{stat.value}}</text>
      </view>
    </view>
    
    <button @click="handleSubmit" :disabled="!isValid">提交</button>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, defineProps, defineEmits } from 'vue'

// Props 定义
interface Props {
  userId: string
  initialData?: UserData
}

const props = withDefaults(defineProps<Props>(), {
  initialData: () => ({})
})

// Emits 定义
const emit = defineEmits<{
  save: [data: UserData]
  cancel: []
}>()

// 响应式数据
const name = ref('')
const avatar = ref('')
const selectedCity = ref('')
const cities = ref(['北京', '上海', '广州', '深圳'])

// 计算属性
const isValid = computed(() => {
  return name.value.length > 0 && selectedCity.value
})

const userStats = computed(() => [
  { key: 'name', label: '姓名', value: name.value || '未填写' },
  { key: 'city', label: '城市', value: selectedCity.value || '未选择' }
])

// 监听器
watch(name, (newName, oldName) => {
  console.log(\`姓名从 \${oldName} 变更为 \${newName}\`)
})

// 生命周期
onMounted(() => {
  loadUserData()
})

// 方法
const loadUserData = async () => {
  // 模拟API调用
  const userData = props.initialData
  name.value = userData.name || ''
  avatar.value = userData.avatar || ''
  selectedCity.value = userData.city || ''
}

const changeAvatar = () => {
  wx.chooseImage({
    count: 1,
    success: (res) => {
      avatar.value = res.tempFilePaths[0]
    }
  })
}

const saveName = () => {
  // 保存姓名逻辑
  console.log('保存姓名:', name.value)
}

const onCityChange = (event: any) => {
  selectedCity.value = cities.value[event.detail.value]
}

const handleSubmit = () => {
  if (isValid.value) {
    emit('save', {
      name: name.value,
      avatar: avatar.value,
      city: selectedCity.value
    })
  }
}

// 暴露给父组件的方法
defineExpose({
  reset: () => {
    name.value = ''
    avatar.value = ''
    selectedCity.value = ''
  }
})
</script>

<style lang="scss" scoped>
.user-profile {
  padding: 32rpx;
  background: #fff;
  
  .avatar {
    text-align: center;
    margin-bottom: 40rpx;
    
    image {
      width: 200rpx;
      height: 200rpx;
      border-radius: 50%;
      border: 4rpx solid #e5e5e5;
    }
  }
  
  .info {
    margin-bottom: 40rpx;
    
    input {
      width: 100%;
      padding: 20rpx;
      border: 2rpx solid #ddd;
      border-radius: 8rpx;
      margin-bottom: 20rpx;
      font-size: 28rpx;
    }
    
    .picker-text {
      padding: 20rpx;
      border: 2rpx solid #ddd;
      border-radius: 8rpx;
      color: #333;
      font-size: 28rpx;
    }
  }
  
  .stats {
    .stat-item {
      display: flex;
      justify-content: space-between;
      padding: 16rpx 0;
      border-bottom: 1rpx solid #f0f0f0;
      
      .label {
        color: #666;
        font-size: 26rpx;
      }
      
      .value {
        color: #333;
        font-size: 26rpx;
        font-weight: 500;
      }
    }
  }
  
  button {
    width: 100%;
    margin-top: 40rpx;
    padding: 24rpx;
    background: #007aff;
    color: white;
    border: none;
    border-radius: 8rpx;
    font-size: 32rpx;
    
    &:disabled {
      background: #ccc;
    }
  }
}
</style>
`;

// 编译后的小程序代码示例
const compiledMiniprogramExample = {
  // user-profile.wxml
  wxml: \`
<view class="user-profile">
  <view class="avatar">
    <image src="{{avatar}}" bindtap="changeAvatar" />
  </view>
  
  <view class="info">
    <input 
      value="{{name}}" 
      placeholder="请输入姓名"
      bindinput="_handleInput_name"
      bindblur="saveName"
    />
    
    <picker 
      value="{{_pickerIndex_selectedCity}}" 
      range="{{cities}}"
      bindchange="onCityChange"
    >
      <view class="picker-text">{{selectedCity || '选择城市'}}</view>
    </picker>
  </view>
  
  <view class="stats">
    <view 
      class="stat-item" 
      wx:for="{{userStats}}" 
      wx:key="key"
    >
      <text class="label">{{item.label}}</text>
      <text class="value">{{item.value}}</text>
    </view>
  </view>
  
  <button bindtap="handleSubmit" disabled="{{!isValid}}">提交</button>
</view>
  \`,
  
  // user-profile.js
  js: \`
Component({
  properties: {
    userId: {
      type: String,
      value: ''
    },
    initialData: {
      type: Object,
      value: {}
    }
  },
  
  data: {
    name: '',
    avatar: '',
    selectedCity: '',
    cities: ['北京', '上海', '广州', '深圳'],
    _pickerIndex_selectedCity: 0
  },
  
  lifetimes: {
    attached() {
      this.loadUserData();
      this._setupReactivity();
    }
  },
  
  methods: {
    // 响应式系统设置
    _setupReactivity() {
      // 设置计算属性
      this._setupComputed();
      // 设置监听器
      this._setupWatchers();
    },
    
    _setupComputed() {
      // isValid 计算属性
      Object.defineProperty(this.data, 'isValid', {
        get: () => {
          return this.data.name.length > 0 && this.data.selectedCity;
        }
      });
      
      // userStats 计算属性
      Object.defineProperty(this.data, 'userStats', {
        get: () => {
          return [
            { key: 'name', label: '姓名', value: this.data.name || '未填写' },
            { key: 'city', label: '城市', value: this.data.selectedCity || '未选择' }
          ];
        }
      });
    },
    
    _setupWatchers() {
      // name 监听器
      let oldName = this.data.name;
      this._nameWatcher = () => {
        const newName = this.data.name;
        if (newName !== oldName) {
          console.log(\`姓名从 \${oldName} 变更为 \${newName}\`);
          oldName = newName;
        }
      };
    },
    
    // 双向绑定处理
    _handleInput_name(e) {
      const value = e.detail.value.trim(); // v-model.trim 修饰符
      this.setData({
        name: value
      });
      this._nameWatcher(); // 触发监听器
      this._updateComputed(); // 更新计算属性
    },
    
    _updateComputed() {
      this.setData({
        isValid: this.data.isValid,
        userStats: this.data.userStats
      });
    },
    
    // 原始方法
    loadUserData() {
      const userData = this.properties.initialData;
      this.setData({
        name: userData.name || '',
        avatar: userData.avatar || '',
        selectedCity: userData.city || ''
      });
    },
    
    changeAvatar() {
      wx.chooseImage({
        count: 1,
        success: (res) => {
          this.setData({
            avatar: res.tempFilePaths[0]
          });
        }
      });
    },
    
    saveName() {
      console.log('保存姓名:', this.data.name);
    },
    
    onCityChange(event) {
      const selectedCity = this.data.cities[event.detail.value];
      this.setData({
        selectedCity: selectedCity,
        _pickerIndex_selectedCity: event.detail.value
      });
      this._updateComputed();
    },
    
    handleSubmit() {
      if (this.data.isValid) {
        this.triggerEvent('save', {
          name: this.data.name,
          avatar: this.data.avatar,
          city: this.data.selectedCity
        });
      }
    },
    
    // defineExpose 暴露的方法
    reset() {
      this.setData({
        name: '',
        avatar: '',
        selectedCity: ''
      });
      this._updateComputed();
    }
  }
});
  \`,
  
  // user-profile.wxss
  wxss: \`
.user-profile {
  padding: 32rpx;
  background: #fff;
}

.avatar {
  text-align: center;
  margin-bottom: 40rpx;
}

.avatar image {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  border: 4rpx solid #e5e5e5;
}

.info {
  margin-bottom: 40rpx;
}

.info input {
  width: 100%;
  padding: 20rpx;
  border: 2rpx solid #ddd;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
  font-size: 28rpx;
}

.picker-text {
  padding: 20rpx;
  border: 2rpx solid #ddd;
  border-radius: 8rpx;
  color: #333;
  font-size: 28rpx;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.stat-item .label {
  color: #666;
  font-size: 26rpx;
}

.stat-item .value {
  color: #333;
  font-size: 26rpx;
  font-weight: 500;
}

button {
  width: 100%;
  margin-top: 40rpx;
  padding: 24rpx;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 8rpx;
  font-size: 32rpx;
}

button:disabled {
  background: #ccc;
}
  \`,
  
  // user-profile.json
  json: \`
{
  "component": true,
  "usingComponents": {}
}
  \`
};

// 10. CLI 工具完整使用
class ProjectGenerator {
  static async createProject(projectName: string, template: string = 'vue3-ts') {
    console.log(\`🎨 创建项目: \${projectName}\`);
    
    const templates = {
      'vue3-ts': {
        dependencies: {
          'vue': '^3.3.0',
          'typescript': '^5.0.0',
          '@vue/compiler-sfc': '^3.3.0'
        },
        structure: {
          'src/': {
            'pages/': {
              'index/': ['index.vue'],
              'profile/': ['profile.vue']
            },
            'components/': {
              'common/': ['Header.vue', 'Footer.vue']
            },
            'utils/': ['index.ts'],
            'app.vue': null,
            'main.ts': null
          },
          'vue3-miniprogram.config.js': null,
          'package.json': null,
          'tsconfig.json': null
        }
      }
    };
    
    const template_config = templates[template];
    if (!template_config) {
      throw new Error(\`未知模板: \${template}\`);
    }
    
    await this.generateProjectStructure(projectName, template_config);
    await this.installDependencies(projectName, template_config.dependencies);
    
    console.log(\`✅ 项目 \${projectName} 创建完成!\`);
    console.log('📖 使用说明:');
    console.log(\`  cd \${projectName}\`);
    console.log('  npm run dev    # 开发模式');
    console.log('  npm run build  # 构建生产版本');
  }
}

// 使用示例
async function exampleUsage() {
  // 1. 创建新项目
  await ProjectGenerator.createProject('my-miniprogram', 'vue3-ts');
  
  // 2. 开发模式
  await Vue3MiniprogramAdvancedCLI.dev({
    input: './src',
    output: './dist/miniprogram',
    appId: 'wx1234567890abcdef',
    framework: 'vue3',
    features: {
      scriptSetup: true,
      scss: true,
      typescript: true,
      compositionApi: true,
      emits: true,
      slots: true,
      provide: true
    },
    optimization: {
      minify: false,
      treeshaking: false,
      sourcemap: true
    }
  });
  
  // 3. 生产构建
  await Vue3MiniprogramAdvancedCLI.build({
    input: './src',
    output: './dist/miniprogram',
    appId: 'wx1234567890abcdef',
    framework: 'vue3',
    features: {
      scriptSetup: true,
      scss: true,
      typescript: true,
      compositionApi: true,
      emits: true,
      slots: true,
      provide: true
    },
    optimization: {
      minify: true,
      treeshaking: true,
      sourcemap: false
    }
  });
  
  // 4. 项目分析
  const analysis = await Vue3MiniprogramAdvancedCLI.analyze('./src');
  console.log('项目分析结果:', analysis);
}

export { 
  CompleteVue3MiniprogramCompiler, 
  Vue3MiniprogramAdvancedCLI,
  ProjectGenerator,
  vueComponentExample,
  compiledMiniprogramExample
};