import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('延迟初始化测试', () => {
  let mockPage: any
  let mockComponent: any
  let createPage: any
  let createComponent: any

  beforeEach(() => {
    // 重置模拟对象
    mockPage = {
      setData: vi.fn(),
      data: {}
    }

    mockComponent = {
      setData: vi.fn(),
      data: {},
      properties: {}
    }

    // 模拟运行时注入代码
    const runtimeCode = `
      let isInitialized = false;
      let runtime = null;

      function getRuntime() {
        return runtime;
      }

      function createPage(pageConfig) {
        // 如果运行时未初始化，返回延迟初始化的页面
        if (!isInitialized) {
          return {
            ...pageConfig,
            onLoad() {
              // 在页面加载时检查运行时是否已初始化
              if (isInitialized) {
                const runtime = getRuntime();
                
                // 手动执行运行时的页面初始化逻辑
                // 创建响应式系统
                const reactiveSystem = runtime.createReactiveSystem(this);

                // 将响应式 API 添加到页面实例
                this.ref = reactiveSystem.ref.bind(reactiveSystem);
                this.reactive = reactiveSystem.reactive.bind(reactiveSystem);
                this.computed = reactiveSystem.computed.bind(reactiveSystem);

                // 根据页面配置创建响应式变量
                if (pageConfig._reactiveVariables) {
                  pageConfig._reactiveVariables.forEach(varInfo => {
                    if (varInfo.type === 'ref') {
                      this[varInfo.name] = this.ref(varInfo.initialValue);
                    } else if (varInfo.type === 'reactive') {
                      this[varInfo.name] = this.reactive(varInfo.initialValue);
                    } else if (varInfo.type === 'computed') {
                      this[varInfo.name] = this.computed(() => varInfo.initialValue);
                    }
                  });
                }
              } else {
                // 如果运行时仍未初始化，手动创建响应式变量
                if (pageConfig._reactiveVariables) {
                  pageConfig._reactiveVariables.forEach(varInfo => {
                    // 创建具有响应式能力的占位符
                    const self = this;
                    let currentValue = varInfo.initialValue;

                    this[varInfo.name] = {
                      get value() {
                        return currentValue;
                      },
                      set value(newValue) {
                        currentValue = newValue;
                        // 调用 setData 更新界面
                        const updateData = {};
                        updateData[varInfo.name] = newValue;
                        self.setData(updateData);
                      },
                      _isRef: true
                    };

                    // 初始化数据
                    const initData = {};
                    initData[varInfo.name] = varInfo.initialValue;
                    this.setData(initData);
                  });
                }
              }

              // 调用原始的 onLoad
              if (pageConfig.onLoad) {
                pageConfig.onLoad.apply(this, arguments);
              }
            }
          };
        }

        const runtime = getRuntime();
        return runtime.createPage(pageConfig);
      }

      function createComponent(componentConfig) {
        // 如果运行时未初始化，返回延迟初始化的组件
        if (!isInitialized) {
          return {
            ...componentConfig,
            attached() {
              // 在组件附加时检查运行时是否已初始化
              if (isInitialized) {
                const runtime = getRuntime();
                
                // 手动执行运行时的组件初始化逻辑
                // 创建响应式系统
                const reactiveSystem = runtime.createReactiveSystem(this);

                // 将响应式 API 添加到组件实例
                this.ref = reactiveSystem.ref.bind(reactiveSystem);
                this.reactive = reactiveSystem.reactive.bind(reactiveSystem);
                this.computed = reactiveSystem.computed.bind(reactiveSystem);

                // 根据组件配置创建响应式变量
                if (componentConfig._reactiveVariables) {
                  componentConfig._reactiveVariables.forEach(varInfo => {
                    if (varInfo.type === 'ref') {
                      this[varInfo.name] = this.ref(varInfo.initialValue);
                    } else if (varInfo.type === 'reactive') {
                      this[varInfo.name] = this.reactive(varInfo.initialValue);
                    } else if (varInfo.type === 'computed') {
                      this[varInfo.name] = this.computed(() => varInfo.initialValue);
                    }
                  });
                }
              } else {
                // 如果运行时仍未初始化，手动创建响应式变量
                if (componentConfig._reactiveVariables) {
                  componentConfig._reactiveVariables.forEach(varInfo => {
                    // 创建具有响应式能力的占位符
                    const self = this;
                    let currentValue = varInfo.initialValue;

                    this[varInfo.name] = {
                      get value() {
                        return currentValue;
                      },
                      set value(newValue) {
                        currentValue = newValue;
                        // 调用 setData 更新界面
                        const updateData = {};
                        updateData[varInfo.name] = newValue;
                        self.setData(updateData);
                      },
                      _isRef: true
                    };

                    // 初始化数据
                    const initData = {};
                    initData[varInfo.name] = varInfo.initialValue;
                    this.setData(initData);
                  });
                }
              }

              // 调用原始的 attached
              if (componentConfig.attached) {
                componentConfig.attached.apply(this, arguments);
              }
            }
          };
        }

        const runtime = getRuntime();
        return runtime.createComponent(componentConfig);
      }

      return { createPage, createComponent };
    `

    // 执行运行时代码
    const result = eval(`(function() { ${runtimeCode} })()`)
    createPage = result.createPage
    createComponent = result.createComponent
  })

  describe('页面延迟初始化', () => {
    it('应该在运行时未初始化时创建响应式变量占位符', () => {
      // 创建页面配置
      const pageConfig = {
        data: { visitCount: 0 },
        _reactiveVariables: [{
          name: "visitCount",
          type: "ref",
          initialValue: 0
        }],
        incrementVisit: function () {
          this.visitCount.value++
        }
      }

      // 创建页面
      const page = createPage(pageConfig)

      // 模拟页面加载
      page.onLoad.call(mockPage)

      // 验证响应式变量被创建
      expect(mockPage.visitCount).toBeDefined()
      expect(mockPage.visitCount.value).toBe(0)
      expect(mockPage.visitCount._isRef).toBe(true)

      // 验证初始化时调用了 setData
      expect(mockPage.setData).toHaveBeenCalledWith({ visitCount: 0 })

      // 重置 setData 调用记录
      mockPage.setData.mockClear()

      // 验证方法可以正常调用
      expect(() => {
        pageConfig.incrementVisit.call(mockPage)
      }).not.toThrow()

      // 验证响应式变量值被正确修改
      expect(mockPage.visitCount.value).toBe(1)

      // 验证修改时调用了 setData
      expect(mockPage.setData).toHaveBeenCalledWith({ visitCount: 1 })
    })
  })

  describe('组件延迟初始化', () => {
    it('应该在运行时未初始化时创建响应式变量占位符', () => {
      // 创建组件配置
      const componentConfig = {
        data: { showDetails: false },
        _reactiveVariables: [{
          name: "showDetails",
          type: "ref",
          initialValue: false
        }],
        toggleDetails: function () {
          this.showDetails.value = !this.showDetails.value
        }
      }

      // 创建组件
      const component = createComponent(componentConfig)

      // 模拟组件附加
      component.attached.call(mockComponent)

      // 验证响应式变量被创建
      expect(mockComponent.showDetails).toBeDefined()
      expect(mockComponent.showDetails.value).toBe(false)
      expect(mockComponent.showDetails._isRef).toBe(true)

      // 验证初始化时调用了 setData
      expect(mockComponent.setData).toHaveBeenCalledWith({ showDetails: false })

      // 重置 setData 调用记录
      mockComponent.setData.mockClear()

      // 验证方法可以正常调用
      expect(() => {
        componentConfig.toggleDetails.call(mockComponent)
      }).not.toThrow()

      // 验证响应式变量值被正确修改
      expect(mockComponent.showDetails.value).toBe(true)

      // 验证修改时调用了 setData
      expect(mockComponent.setData).toHaveBeenCalledWith({ showDetails: true })
    })
  })
})
