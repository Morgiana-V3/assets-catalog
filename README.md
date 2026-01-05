# assets-manager

静态资源管理工具，支持 **CLI 生成** 和 **运行时** 两种方式。

## ✨ 特性

- 🚀 **CLI 方式**：适用于任何项目，手动生成资源清单
- ⚡ **运行时方式**：在 Vite 项目中使用，开发时自动响应文件变化
- 📦 **零依赖 Vite**：运行时方式使用项目自己的 Vite 环境
- 🔒 **完整类型支持**：自动生成 TypeScript 类型定义
- 📊 **元信息支持**：包含文件类型、MIME、扩展名等信息

## 📥 安装

```bash
npm install assets-manager
# 或
pnpm add assets-manager
# 或
yarn add assets-manager
```

## 🚀 快速开始

### 方式一：CLI 命令（推荐用于生产环境）

适用于任何项目，生成静态资源清单文件。

```bash
# 使用默认配置
npx gen-assets

# 自定义输入输出
npx gen-assets --input src/assets --out src/lib/assets.ts
```

生成的文件：

```typescript
// src/lib/assets.ts
export const assetMeta = {
  logo: {
    type: 'image',
    ext: '.png',
    mime: 'image/png',
    path: 'src/assets/logo.png'
  }
} as const

export const assets = {
  logo: 'src/assets/logo.png'
} as const

export type AssetMeta = typeof assetMeta
export type Assets = typeof assets
```

使用资源：

```typescript
import { assets, assetMeta } from './lib/assets'

// 使用路径
console.log(assets.logo) // 'src/assets/logo.png'

// 使用元信息
console.log(assetMeta.logo.type) // 'image'
console.log(assetMeta.logo.mime) // 'image/png'
```

### 方式二：运行时方式（推荐用于开发环境）

仅适用于 Vite 项目，开发时自动响应文件变化。

⚠️ **重要提示**：
- `import.meta.glob` 必须使用字面量字符串，不能使用变量
- 运行时方式的类型推断不如 CLI 方式精确
- 访问深层属性时需要使用类型断言（如 `as any` 或 `as string`）

```typescript
// src/lib/assets.ts
import { createAssets } from 'assets-manager'

// 1. 使用字面量字符串调用 import.meta.glob
const globResult = import.meta.glob('/src/assets/**/*', { 
  eager: true, 
  as: 'url' 
})

// 2. 将结果传给 createAssets 处理
const result = createAssets(globResult, '/src/assets')

// 3. 导出（使用 any 类型以避免类型错误）
export const assets = result.assets as any
export const assetMeta = result.assetMeta as any
```

使用资源：

```typescript
import { assets, assetMeta } from './lib/assets'

// 在 React 中使用（直接访问）
function App() {
  return (
    <div>
      <img src={assets.logo} alt="Logo" />
      <img src={assets.images.bg} alt="Background" />
    </div>
  )
}

// 检查类型
if (assetMeta.logo.type === 'image') {
  console.log('这是图片资源')
}
```

## 📖 详细示例

### 嵌套目录结构

假设目录结构：

```
src/assets/
  ├── images/
  │   ├── logo.png
  │   └── bg.jpg
  ├── audio/
  │   └── bgm.mp3
  └── fonts/
      └── custom.woff2
```

生成的对象结构：

```typescript
{
  images: {
    logo: 'src/assets/images/logo.png',
    bg: 'src/assets/images/bg.jpg'
  },
  audio: {
    bgm: 'src/assets/audio/bgm.mp3'
  },
  fonts: {
    custom: 'src/assets/fonts/custom.woff2'
  }
}
```

### 在 React 中使用

```tsx
import { assets, assetMeta } from './lib/assets'

function Gallery() {
  return (
    <div>
      <img src={assets.images.logo} alt="Logo" />
      <img src={assets.images.bg} alt="Background" />
      <audio src={assets.audio.bgm} />
    </div>
  )
}
```

### 在 Vue 中使用

```vue
<template>
  <div>
    <img :src="assets.images.logo" alt="Logo" />
    <p>{{ assetMeta.images.logo.mime }}</p>
  </div>
</template>

<script setup lang="ts">
import { assets, assetMeta } from './lib/assets'
</script>
```

### 在 package.json 中添加脚本

```json
{
  "scripts": {
    "gen-assets": "gen-assets --input src/assets --out src/lib/assets.ts",
    "prebuild": "npm run gen-assets"
  }
}
```

这样在每次构建前会自动生成资源清单。

### 预加载所有图片

```typescript
import { assets, assetMeta } from './lib/assets'

function preloadImages() {
  const imageUrls: string[] = []
  
  // 递归收集所有图片路径
  function collect(obj: any) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        imageUrls.push(value)
      } else if (value && typeof value === 'object') {
        collect(value)
      }
    }
  }
  
  collect(assets)
  
  // 预加载
  return Promise.all(
    imageUrls.map(src => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = resolve
        img.onerror = reject
        img.src = src
      })
    })
  )
}

// 使用
preloadImages().then(() => {
  console.log('所有图片加载完成')
})
```

## 📚 API 参考

### CLI

```bash
gen-assets [options]
```

**选项：**

- `--input <dir>` - 输入目录（默认：`src/assets`）
- `--out <file>` - 输出文件（默认：`src/lib/assets.ts`）

### createAssets(globResult, baseDir?)

创建资源管理对象（仅在 Vite 环境可用）。

**参数：**

- `globResult` - `import.meta.glob` 的返回结果
- `baseDir` - 基础目录，用于裁剪路径前缀（可选）

**返回：**

```typescript
{
  assets: Record<string, any>,      // 资源路径树
  assetMeta: Record<string, any>    // 资源元信息树
}
```

**类型定义：**

```typescript
interface AssetMeta {
  type: 'image' | 'audio' | 'video' | 'font' | 'application' | 'text' | 'other'
  ext: string      // 扩展名，如 '.png'
  mime: string     // MIME 类型，如 'image/png'
  path: string     // 文件路径
}
```

## 🔄 使用场景对比

| 特性 | CLI 方式 | 运行时方式 |
|------|---------|------------|
| 适用环境 | 任何项目 | 仅 Vite 项目 |
| 文件变化响应 | 需手动重新生成 | 自动响应 |
| 构建工具依赖 | 无 | Vite（使用项目已有） |
| 设置复杂度 | 一行命令 | 3行代码 |
| 性能 | 静态文件，快 | 依赖 Vite HMR |
| 类型安全 | ✅ 完整类型推断 | ⚠️ 需要类型断言 |
| 推荐场景 | 生产构建、需要类型安全 | Vite 开发环境、快速迭代 |

## ⚠️ 注意事项

1. **路径格式**：所有路径使用正斜杠 `/`，兼容 Windows 和 Unix
2. **文件名冲突**：同一目录下不要有相同文件名但不同扩展名的文件
3. **字面量限制**：`import.meta.glob` 必须使用字符串字面量，不能用变量
4. **带点文件名**：`icon.avatar.png` 会被处理为 key `'icon.avatar'`（需要用方括号访问）
5. **类型推断限制**：运行时方式的类型推断不够精确，建议导出时使用 `as any`，或在生产环境使用 CLI 方式获得完整类型安全

## ❓ 常见问题

### Q: 如何处理带特殊字符的文件名？

```typescript
// 文件: icon.avatar.png
assets['icon.avatar']  // ✓ 正确
// assets.icon.avatar  // ✗ 错误
```

### Q: CLI 和运行时可以混用吗？

可以！开发时用运行时方式（自动更新），生产构建前用 CLI 生成静态文件（性能更好）。

### Q: 为什么 import.meta.glob 不能用变量？

因为 Vite 需要在编译时静态分析文件，必须使用字面量字符串。

### Q: 如何在非 Vite 项目使用？

请使用 CLI 方式：`npx gen-assets`

### Q: 运行时方式报类型错误怎么办？

运行时方式的类型推断有限制，有两种解决方案：

**方案 1：使用 `as any`（推荐）**
```typescript
// src/lib/assets.ts
export const assets = result.assets as any
export const assetMeta = result.assetMeta as any
```

**方案 2：使用 CLI 方式（完整类型安全）**
```bash
npx gen-assets --input src/assets --out src/lib/assets.ts
```

CLI 生成的文件使用 `as const`，提供完美的类型推断。

## 📄 License

MIT

---

**欢迎贡献和反馈！** 如有问题请提 Issue。
