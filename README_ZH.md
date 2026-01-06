# assets-catalog

> 类型安全的静态资源管理工具 · 自动生成资源清单 · 支持 CLI 和 Vite 运行时

[![GitHub](https://img.shields.io/badge/GitHub-Morgiana--V3%2Fassets--catalog-blue?logo=github)](https://github.com/Morgiana-V3/assets-catalog)
[![npm](https://img.shields.io/npm/v/assets-catalog)](https://www.npmjs.com/package/assets-catalog)

[English Documentation](./README.md) | [GitHub 仓库](https://github.com/Morgiana-V3/assets-catalog)

## 特性

- **类型安全**：自动生成 TypeScript 类型定义，完整的编辑器智能提示
- **多种方式**：支持 CLI 生成静态文件或 Vite 运行时动态加载
- **资源元信息**：自动识别 MIME 类型、扩展名、资源类型

## 快速开始

```bash
# 1. 安装
npm install assets-catalog

# 2. 生成资源清单
npx gen-assets

# 3. 在代码中使用
import { assets } from './lib/assets'
const logo = assets.images.logo  // 完整类型提示
```

## 安装

```bash
npm install assets-catalog
yarn add assets-catalog
pnpm add assets-catalog
```

**依赖：**
- [mime-types](https://www.npmjs.com/package/mime-types)： MIME 类型识别


---

## 数据结构

> ⚠️ **重要**：为避免同名文件覆盖，同一目录下不要出现相同名称但不同扩展名的文件（如 `logo.png` 和 `logo.jpg`）

工具会遍历指定目录下的所有文件，生成两个 JSON 数据：`assets`（路径）和 `assetMeta`（元信息）。

**目录结构示例：**

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

**生成的数据结构：**

```typescript
// assetMeta - 完整的元信息
const assetMeta = {
  images: {
    logo: {
      type: 'image',
      ext: '.png',
      mime: 'image/png',
      path: 'src/assets/images/logo.png'
    },
    bg: {
      type: 'image',
      ext: '.jpg',
      mime: 'image/jpeg',
      path: 'src/assets/images/bg.jpg'
    }
  },
  audio: {
    bgm: {
      type: 'audio',
      ext: '.mp3',
      mime: 'audio/mpeg',
      path: 'src/assets/audio/bgm.mp3'
    }
  },
  fonts: {
    custom: {
      type: 'font',
      ext: '.woff2',
      mime: 'font/woff2',
      path: 'src/assets/fonts/custom.woff2'
    }
  }
}

// assets - 简洁的路径树
const assets = {
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

---

## 使用方式

提供两种使用方式，根据项目需求选择：

### 方式一：CLI 命令行（推荐）

在终端使用命令生成静态资源清单文件。

**✅ 优点：**
- 完整的 TypeScript 类型提示，编辑器智能提示友好
- 适用于任何项目（Vue、React、Svelte 等）

**⚠️ 缺点：**
- 需要生成额外的代码文件
- 资源更新需要重新执行命令（可使用监听模式解决）

**基本用法：**

```bash
# 使用默认配置（输入：src/assets，输出：src/lib/assets.ts）
npx gen-assets

# 自定义输入输出路径
npx gen-assets --input src/assets --out src/lib/assets.ts

# 监听模式（文件变化自动重新生成）
npx gen-assets --watch
npx gen-assets -w

# 组合使用
npx gen-assets --input public/images --out src/catalog.ts --watch
```

**生成的文件：**

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

**在代码中使用：**

```typescript
import { assets, assetMeta } from './lib/assets'

// 使用资源路径（完整类型提示）
const logoPath = assets.logo // 'src/assets/logo.png'

// 获取资源元信息
const logoMeta = assetMeta.logo
console.log(logoMeta.type)  // 'image'
console.log(logoMeta.mime)  // 'image/png'
```

---

### 方式二：Vite 运行时

在 Vite 项目中动态生成资源对象。

**✅ 优点：**
- 无需生成额外的代码文件
- 资源自动同步，无需重新生成

**⚠️ 缺点：**
- 仅支持 Vite 项目
- 类型提示较弱（`Record<string, any>`），编辑器无法精确提示

**使用示例：**

```typescript
import { createAssets } from 'assets-catalog'

// 使用 import.meta.glob 导入资源
const globResult = import.meta.glob('/src/assets/**/*', { 
  eager: true, 
  as: 'url' 
})

// 创建资源对象
const { assets, assetMeta } = createAssets(globResult, '/src/assets')

// 使用资源
console.log(assets.logo)      // URL 路径
console.log(assetMeta.logo)   // { type, ext, mime, path }
```

**关于 `baseDir` 参数：**

`baseDir` 用于裁剪路径前缀，让生成的对象结构更简洁。

```typescript
// 文件：/src/assets/images/logo.png

// ❌ 不传 baseDir（或传空字符串）
createAssets(globResult, '')
// 生成：assets.src.assets.images.logo  // 冗长

// ✅ 传 '/src/assets'（推荐）
createAssets(globResult, '/src/assets')
// 生成：assets.images.logo  // 简洁
```

---

### 灵活使用：多个资源清单

你可以根据需要生成多个颗粒度更细的资源清单。

```typescript
// 分别管理图片和字体
const { assets: imageAssets, assetMeta: imageAssetMeta } = createAssets(
  import.meta.glob('/src/assets/images/**/*', { eager: true, as: 'url' }),
  '/src/assets/images'
)

const { assets: fontAssets, assetMeta: fontAssetMeta } = createAssets(
  import.meta.glob('/src/assets/fonts/**/*', { eager: true, as: 'url' }),
  '/src/assets/fonts'
)

// 使用
const logo = imageAssets.logo
const font = fontAssets.custom
```

或者使用 CLI 生成多个文件：

```bash
npx gen-assets --input src/assets/images --out src/lib/images.ts
npx gen-assets --input src/assets/fonts --out src/lib/fonts.ts
```

---

## API 文档

### CLI 命令

#### `gen-assets [options]`

生成静态资源清单文件。

**选项：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `--input` | `string` | `src/assets` | 输入目录路径 |
| `--out` | `string` | `src/lib/assets.ts` | 输出文件路径 |
| `--watch`, `-w` | `boolean` | `false` | 监听模式，文件变化自动重新生成 |

**示例：**

```bash
# 默认配置
npx gen-assets

# 自定义路径
npx gen-assets --input public/images --out src/catalog.ts

# 监听模式（推荐开发时使用）
npx gen-assets --watch

# 完整配置
npx gen-assets --input src/assets --out src/lib/assets.ts --watch
```

---

### Vite 运行时 API

#### `createAssets(globResult, baseDir?)`

创建资源对象（仅 Vite 环境）。

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `globResult` | `Record<string, any>` | 是 | `import.meta.glob` 的返回结果 |
| `baseDir` | `string` | 否 | 基础目录，用于裁剪路径前缀 |

**返回值：**

```typescript
{
  assets: Record<string, any>,      // 资源路径树
  assetMeta: Record<string, any>    // 资源元信息树
}
```

**完整示例：**

```typescript
import { createAssets } from 'assets-catalog'

const { assets, assetMeta } = createAssets(
  import.meta.glob('/src/assets/**/*', { eager: true, as: 'url' }),
  '/src/assets'  // 可选，推荐传入以简化路径
)

// 使用
const logo = assets.images.logo
const logoInfo = assetMeta.images.logo
```

---

## 类型定义

### AssetMeta

资源元信息对象。

```typescript
interface AssetMeta {
  type: AssetType    // 资源类型
  ext: string        // 扩展名（如 '.png'）
  mime: string       // MIME 类型（如 'image/png'）
  path: string       // 资源路径
}

type AssetType = 
  | 'image'        // 图片
  | 'audio'        // 音频
  | 'video'        // 视频
  | 'font'         // 字体
  | 'application'  // 应用程序
  | 'text'         // 文本
  | 'other'        // 其他
```

### 支持的资源类型

| 类型 | 扩展名 |
|------|--------|
| **图片** | `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`, `.ico`, `.bmp` |
| **音频** | `.mp3`, `.wav`, `.ogg`, `.m4a`, `.flac` |
| **视频** | `.mp4`, `.webm`, `.ogv`, `.mov`, `.avi` |
| **字体** | `.woff`, `.woff2`, `.ttf`, `.otf`, `.eot` |
| **文本** | `.json`, `.xml`, `.txt` |
| **其他** | 所有其他文件类型 |

---

## 使用场景

### 1. 避免多次 import 资源

```typescript
// ❌ 之前：每个资源都要单独 import
import Logo from '@/assets/images/logo.png'
import Bg from '@/assets/images/bg.jpg'
import Bgm from '@/assets/audio/bgm.mp3'

function Gallery() {
  return (
    <div>
      <img src={Logo} alt="Logo" />
      <img src={Bg} alt="Background" />
      <audio src={Bgm} />
    </div>
  )
}

// ✅ 现在：统一管理，一次导入
import { assets } from './lib/assets'

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

---

### 2. 控制资源切换

如根据当前语言动态获取对应的资源。

**目录结构：**

```
src/assets/
  └── i18n/
      ├── zh/
      │   ├── banner.png
      │   └── logo.png
      ├── en/
      │   ├── banner.png
      │   └── logo.png
      └── ja/
          ├── banner.png
          └── logo.png
```

**使用示例：**

```typescript
import { assets } from './lib/assets'
import { useI18n } from 'vue-i18n'

function MyComponent() {
  const { locale } = useI18n()
  
  // 根据语言动态获取资源
  return <img src={assets.i18n[locale.value].banner} />
  
  // locale='zh': assets.i18n.zh.banner
  // locale='en': assets.i18n.en.banner
  // locale='ja': assets.i18n.ja.banner
}
```

---

### 3. 批量资源处理

使用 `assetMeta` 进行资源过滤和分组处理。

```typescript
import { assetMeta } from './lib/assets'

// 获取所有图片资源
function getAllImages() {
  const images: string[] = []
  
  function traverse(obj: any) {
    for (const value of Object.values(obj)) {
      if (value && typeof value === 'object') {
        if ('type' in value && value.type === 'image') {
          images.push(value.path)
        } else {
          traverse(value)
        }
      }
    }
  }
  
  traverse(assetMeta)
  return images
}

// 根据 MIME 类型分组
function groupByMimeType() {
  const groups: Record<string, string[]> = {}
  
  function traverse(obj: any) {
    for (const value of Object.values(obj)) {
      if (value && typeof value === 'object') {
        if ('mime' in value) {
          const mime = value.mime
          if (!groups[mime]) groups[mime] = []
          groups[mime].push(value.path)
        } else {
          traverse(value)
        }
      }
    }
  }
  
  traverse(assetMeta)
  return groups
}

// 使用
const allImages = getAllImages()
const jpegImages = groupByMimeType()['image/jpeg']
console.log(`找到 ${allImages.length} 张图片`)
console.log(`其中 ${jpegImages.length} 张 JPEG 格式`)
```

---

### 4. 管理资源预加载

如按关卡组织资源，实现智能预加载。

**目录结构：**

```
src/assets/
  └── game/
      ├── level1/
      │   ├── bg.jpg
      │   ├── hero.png
      │   └── enemy.png
      ├── level2/
      │   ├── bg.jpg
      │   ├── hero.png
      │   └── boss.png
      └── common/
          ├── ui.png
          └── icon.png
```

**预加载实现：**

```typescript
import { assets, assetMeta } from './lib/assets'

type LevelKey = keyof typeof assetMeta.game  // 'level1' | 'level2' | 'common'

async function preloadLevelImages(level: LevelKey) {
  const levelMeta = assetMeta.game[level]

  const images = Object.values(levelMeta).filter(
    (item) => item.type === 'image'
  )

  await Promise.all(
    images.map((asset) => {
      const img = new Image()
      img.src = asset.path
      return img.decode()
    })
  )
}

async function enterLevel(level: Exclude<LevelKey, 'common'>) {
  await preloadLevelImages('common')
  await preloadLevelImages(level)

  // 使用资源渲染场景
  const bg = assets.game[level].bg
  const hero = assets.game[level].hero

  scene.setBackground(bg)
  scene.spawnHero(hero)
}

enterLevel('level1')
```

---

