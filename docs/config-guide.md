# Vue3 微信小程序编译器配置指南

## 配置文件概述

Vue3 微信小程序编译器支持通过配置文件自定义编译行为和生成的小程序配置。配置文件采用 JSON 格式，提供了丰富的配置选项。

## 配置文件查找顺序

编译器会按以下顺序查找配置文件（优先级从高到低）：

1. `vue3mp.config.js` - JavaScript 配置文件（暂不支持）
2. `vue3mp.config.ts` - TypeScript 配置文件（暂不支持）
3. `vue3mp.config.json` - JSON 配置文件 ✅
4. `.vue3mprc.js` - JavaScript RC 文件（暂不支持）
5. `.vue3mprc.ts` - TypeScript RC 文件（暂不支持）
6. `.vue3mprc.json` - JSON RC 文件 ✅

> **注意**: 目前只支持 JSON 格式的配置文件，JavaScript/TypeScript 配置文件将在后续版本中支持。

## 配置文件结构

```json
{
  "app": {
    // 应用级配置
  },
  "pages": {
    // 页面级配置
  },
  "components": {
    // 组件级配置
  },
  "project": {
    // 项目配置
  }
}
```

## 详细配置选项

### 应用配置 (app)

应用配置对应小程序的 `app.json` 文件：

```json
{
  "app": {
    "appid": "wx1234567890abcdef",
    "window": {
      "navigationBarBackgroundColor": "#007bff",
      "navigationBarTextStyle": "white",
      "navigationBarTitleText": "我的小程序",
      "backgroundColor": "#f8f9fa",
      "backgroundTextStyle": "light",
      "enablePullDownRefresh": true,
      "onReachBottomDistance": 100
    },
    "tabBar": {
      "color": "#666666",
      "selectedColor": "#007bff",
      "backgroundColor": "#ffffff",
      "borderStyle": "white",
      "defaultIcons": {
        "iconPath": "images/icon_default.png",
        "selectedIconPath": "images/icon_selected.png"
      },
      "list": [
        {
          "pagePath": "pages/index/index",
          "text": "首页",
          "iconPath": "images/home.png",
          "selectedIconPath": "images/home-active.png"
        }
      ]
    },
    "networkTimeout": {
      "request": 10000,
      "downloadFile": 10000,
      "uploadFile": 10000,
      "connectSocket": 10000
    },
    "debug": true,
    "subpackages": [
      {
        "root": "packageA",
        "name": "pack1",
        "pages": [
          "pages/cat",
          "pages/dog"
        ],
        "independent": false
      }
    ]
  }
}
```

#### window 配置选项

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| navigationBarBackgroundColor | string | #ffffff | 导航栏背景颜色 |
| navigationBarTextStyle | string | black | 导航栏标题颜色，仅支持 black / white |
| navigationBarTitleText | string | - | 导航栏标题文字内容 |
| backgroundColor | string | #ffffff | 窗口的背景色 |
| backgroundTextStyle | string | dark | 下拉 loading 的样式，仅支持 dark / light |
| enablePullDownRefresh | boolean | false | 是否开启当前页面下拉刷新 |
| onReachBottomDistance | number | 50 | 页面上拉触底事件触发时距页面底部距离 |

#### tabBar 配置选项

| 属性 | 类型 | 说明 |
|------|------|------|
| color | string | tab 上的文字默认颜色 |
| selectedColor | string | tab 上的文字选中时的颜色 |
| backgroundColor | string | tab 的背景色 |
| borderStyle | string | tabbar 上边框的颜色，仅支持 black / white |
| defaultIcons | Object | 默认图标配置，为没有指定图标的 tab 项目提供默认图标 |
| list | Array | tab 的列表，最少 2 个、最多 5 个 tab |

**defaultIcons 配置选项**：

| 属性 | 类型 | 说明 |
|------|------|------|
| iconPath | string | 默认图标路径 |
| selectedIconPath | string | 默认选中状态图标路径 |

**修复说明**：移除了硬编码的图标路径，现在用户可以通过 `defaultIcons` 配置自定义默认图标。编译器会自动为检测到的页面生成 tabBar 项目，使用这些默认图标。

### 页面标题映射 (pageTitles)

配置页面名称到中文标题的映射，用于自动生成 tabBar 和页面配置：

```json
{
  "pageTitles": {
    "index": "首页",
    "home": "首页",
    "profile": "个人中心",
    "user": "用户",
    "mine": "我的",
    "setting": "设置",
    "about": "关于",
    "help": "帮助",
    "feedback": "反馈"
  }
}
```

**修复说明**：移除了硬编码的页面标题映射，现在用户可以通过配置文件自定义页面标题。编译器会根据页面文件名自动查找对应的中文标题。

### 页面配置 (pages)

页面配置对应各个页面的 `.json` 文件：

```json
{
  "pages": {
    "pages/index/index": {
      "navigationBarTitleText": "首页",
      "enablePullDownRefresh": true,
      "backgroundColor": "#f5f7fa",
      "disableScroll": false,
      "usingComponents": {
        "custom-component": "../../components/custom/index"
      }
    },
    "pages/profile/index": {
      "navigationBarTitleText": "个人中心",
      "enablePullDownRefresh": false,
      "backgroundColor": "#ffffff"
    }
  }
}
```

#### 页面配置选项

| 属性 | 类型 | 说明 |
|------|------|------|
| navigationBarBackgroundColor | string | 导航栏背景颜色 |
| navigationBarTextStyle | string | 导航栏标题颜色 |
| navigationBarTitleText | string | 导航栏标题文字内容 |
| backgroundColor | string | 窗口的背景色 |
| backgroundTextStyle | string | 下拉 loading 的样式 |
| enablePullDownRefresh | boolean | 是否开启下拉刷新 |
| onReachBottomDistance | number | 上拉触底事件触发时距页面底部距离 |
| disableScroll | boolean | 设置为 true 则页面整体不能上下滚动 |
| usingComponents | Object | 页面自定义组件配置 |

### 组件配置 (components)

组件配置对应各个组件的 `.json` 文件：

```json
{
  "components": {
    "components/UserCard": {
      "component": true,
      "styleIsolation": "isolated",
      "usingComponents": {
        "sub-component": "../SubComponent/index"
      },
      "options": {
        "multipleSlots": true,
        "addGlobalClass": false,
        "styleIsolation": "isolated",
        "virtualHost": false
      }
    },
    "components/LoadingSpinner": {
      "component": true,
      "styleIsolation": "shared",
      "options": {
        "multipleSlots": false,
        "addGlobalClass": true,
        "styleIsolation": "shared",
        "virtualHost": true
      }
    }
  }
}
```

#### 组件配置选项

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| component | boolean | true | 声明这是一个自定义组件 |
| styleIsolation | string | isolated | 样式隔离选项 |
| usingComponents | Object | {} | 组件所使用的自定义组件 |
| options | Object | {} | 组件选项配置 |

#### options 配置选项

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| multipleSlots | boolean | false | 在组件定义时的选项中启用多slot支持 |
| addGlobalClass | boolean | false | 表示页面样式将影响到自定义组件 |
| styleIsolation | string | isolated | 样式隔离选项 |
| virtualHost | boolean | false | 使自定义组件内部的第一层节点能够响应 flex 布局 |

#### styleIsolation 选项

- `isolated` - 表示启用样式隔离，在自定义组件内外，使用 class 指定的样式将不会相互影响
- `apply-shared` - 表示页面 wxss 样式将影响到自定义组件，但自定义组件 wxss 中指定的样式不会影响页面
- `shared` - 表示页面 wxss 样式将影响到自定义组件，自定义组件 wxss 中指定的样式也会影响页面和其他设置了该选项的自定义组件

### 项目配置 (project)

项目配置对应 `project.config.json` 文件：

```json
{
  "project": {
    "description": "Vue3 微信小程序项目",
    "projectname": "my-miniprogram",
    "packOptions": {
      "ignore": [
        {
          "type": "file",
          "value": ".eslintrc.js"
        }
      ]
    },
    "setting": {
      "urlCheck": false,
      "es6": true,
      "enhance": true,
      "postcss": true,
      "minified": false,
      "newFeature": true,
      "coverView": true,
      "autoAudits": false,
      "showShadowRootInWxmlPanel": true,
      "scopeDataCheck": false,
      "checkInvalidKey": true,
      "checkSiteMap": true,
      "uploadWithSourceMap": true,
      "compileHotReLoad": true,
      "useMultiFrameRuntime": true,
      "useApiHook": true,
      "useApiHostProcess": true
    },
    "compileType": "miniprogram",
    "libVersion": "2.19.4",
    "condition": {
      "miniprogram": {
        "list": [
          {
            "desc": "首页",
            "pathName": "pages/index/index",
            "query": "",
            "scene": 1001
          }
        ]
      }
    }
  }
}
```

## 配置示例

### 基础配置示例

```json
{
  "app": {
    "window": {
      "navigationBarBackgroundColor": "#007bff",
      "navigationBarTextStyle": "white",
      "navigationBarTitleText": "我的应用"
    }
  }
}
```

### 完整配置示例

参考项目根目录下的 `vue3mp.config.example.json` 文件。

## 配置优先级

1. **用户配置优先**: 用户配置文件中的设置会覆盖默认配置
2. **页面级覆盖应用级**: 页面配置会覆盖应用配置中的相同选项
3. **组件级独立**: 组件配置独立生效，不会被其他配置覆盖

## 注意事项

1. **路径格式**: 所有路径都使用相对路径，以项目根目录为基准
2. **JSON 格式**: 配置文件必须是有效的 JSON 格式
3. **编码格式**: 配置文件必须使用 UTF-8 编码
4. **大小写敏感**: 所有配置项名称都是大小写敏感的

## 常见问题

### Q: 配置文件不生效怎么办？

A: 请检查：
1. 配置文件是否在项目根目录
2. JSON 格式是否正确
3. 配置项名称是否正确
4. 重新编译项目

### Q: 如何调试配置问题？

A: 使用 `--verbose` 参数运行编译器，查看详细的配置加载日志：

```bash
npx vue3mp build --verbose
```

### Q: 支持哪些配置文件格式？

A: 目前只支持 JSON 格式，JavaScript/TypeScript 配置文件将在后续版本中支持。
