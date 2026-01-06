# assets-catalog
> Type-safe static asset manager · Auto-generate asset manifests · Support CLI and Vite runtime

[![GitHub](https://img.shields.io/badge/GitHub-Morgiana--V3%2Fassets--catalog-blue?logo=github)](https://github.com/Morgiana-V3/assets-catalog)
[![npm](https://img.shields.io/npm/v/assets-catalog)](https://www.npmjs.com/package/assets-catalog)

[中文文档](./README_ZH.md) | [GitHub Repository](https://github.com/Morgiana-V3/assets-catalog)

## Features

- **Type Safe**: Auto-generate TypeScript type definitions with full editor IntelliSense
- **Multiple Approaches**: Support CLI static file generation or Vite runtime dynamic loading
- **Asset Metadata**: Auto-detect MIME types, extensions, and asset types

## Quick Start

```bash
# 1. Install
npm install assets-catalog

# 2. Generate asset manifest
npx gen-assets

# 3. Use in your code
import { assets } from './lib/assets'
const logo = assets.images.logo  // Full type hints
```

## Installation

```bash
npm install assets-catalog
yarn add assets-catalog
pnpm add assets-catalog
```

**Dependencies:**
- [mime-types](https://www.npmjs.com/package/mime-types): MIME type detection

---

## Data Structure

> ⚠️ **Important**: To avoid file overwrites, don't use the same filename with different extensions in the same directory (e.g. `logo.png` and `logo.jpg`)

The tool traverses all files in the specified directory and generates two JSON structures: `assets` (paths) and `assetMeta` (metadata).

**Directory structure example:**

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

**Generated data structure:**

```typescript
// assetMeta - Complete metadata
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

// assets - Concise path tree
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

## Usage

Two approaches available, choose based on your project needs:

### Approach 1: CLI (Recommended)

Generate static asset manifest files using terminal commands.

**✅ Advantages:**
- Complete TypeScript type hints, editor-friendly IntelliSense
- Works with any project (Vue, React, Svelte, etc.)

**⚠️ Disadvantages:**
- Generates additional code files
- Requires re-running command when assets change (can be solved with watch mode)

**Basic usage:**

```bash
# Use default config (input: src/assets, output: src/lib/assets.ts)
npx gen-assets

# Custom input/output paths
npx gen-assets --input src/assets --out src/lib/assets.ts

# Watch mode (auto-regenerate on file changes)
npx gen-assets --watch
npx gen-assets -w

# Combined usage
npx gen-assets --input public/images --out src/catalog.ts --watch
```

**Generated file:**

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

**Use in code:**

```typescript
import { assets, assetMeta } from './lib/assets'

// Use asset path (full type hints)
const logoPath = assets.logo // 'src/assets/logo.png'

// Get asset metadata
const logoMeta = assetMeta.logo
console.log(logoMeta.type)  // 'image'
console.log(logoMeta.mime)  // 'image/png'
```

---

### Approach 2: Vite Runtime

Dynamically generate asset objects in Vite projects.

**✅ Advantages:**
- No additional code files needed
- Assets auto-sync, no regeneration needed

**⚠️ Disadvantages:**
- Only works with Vite projects
- Weaker type hints (`Record<string, any>`), less precise editor IntelliSense

**Usage example:**

```typescript
import { createAssets } from 'assets-catalog'

// Import assets using import.meta.glob
const globResult = import.meta.glob('/src/assets/**/*', { 
  eager: true, 
  as: 'url' 
})

// Create asset object
const { assets, assetMeta } = createAssets(globResult, '/src/assets')

// Use assets
console.log(assets.logo)      // URL path
console.log(assetMeta.logo)   // { type, ext, mime, path }
```

**About `baseDir` parameter:**

`baseDir` is used to trim path prefixes for a cleaner object structure.

```typescript
// File: /src/assets/images/logo.png

// ❌ Without baseDir (or empty string)
createAssets(globResult, '')
// Generates: assets.src.assets.images.logo  // verbose

// ✅ With '/src/assets' (recommended)
createAssets(globResult, '/src/assets')
// Generates: assets.images.logo  // concise
```

---

### Flexible Usage: Multiple Asset Catalogs

You can generate multiple fine-grained asset catalogs as needed.

```typescript
// Manage images and fonts separately
const { assets: imageAssets, assetMeta: imageAssetMeta } = createAssets(
  import.meta.glob('/src/assets/images/**/*', { eager: true, as: 'url' }),
  '/src/assets/images'
)

const { assets: fontAssets, assetMeta: fontAssetMeta } = createAssets(
  import.meta.glob('/src/assets/fonts/**/*', { eager: true, as: 'url' }),
  '/src/assets/fonts'
)

// Use
const logo = imageAssets.logo
const font = fontAssets.custom
```

Or use CLI to generate multiple files:

```bash
npx gen-assets --input src/assets/images --out src/lib/images.ts
npx gen-assets --input src/assets/fonts --out src/lib/fonts.ts
```

---

## API Documentation

### CLI Command

#### `gen-assets [options]`

Generate static asset manifest file.

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--input` | `string` | `src/assets` | Input directory path |
| `--out` | `string` | `src/lib/assets.ts` | Output file path |
| `--watch`, `-w` | `boolean` | `false` | Watch mode, auto-regenerate on file changes |

**Examples:**

```bash
# Default config
npx gen-assets

# Custom paths
npx gen-assets --input public/images --out src/catalog.ts

# Watch mode (recommended for development)
npx gen-assets --watch

# Full config
npx gen-assets --input src/assets --out src/lib/assets.ts --watch
```

---

### Vite Runtime API

#### `createAssets(globResult, baseDir?)`

Create asset object (Vite environment only).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `globResult` | `Record<string, any>` | Yes | Result from `import.meta.glob` |
| `baseDir` | `string` | No | Base directory for trimming path prefixes |

**Return value:**

```typescript
{
  assets: Record<string, any>,      // Asset path tree
  assetMeta: Record<string, any>    // Asset metadata tree
}
```

**Complete example:**

```typescript
import { createAssets } from 'assets-catalog'

const { assets, assetMeta } = createAssets(
  import.meta.glob('/src/assets/**/*', { eager: true, as: 'url' }),
  '/src/assets'  // Optional, recommended for cleaner paths
)

// Use
const logo = assets.images.logo
const logoInfo = assetMeta.images.logo
```

---

## Type Definitions

### AssetMeta

Asset metadata object.

```typescript
interface AssetMeta {
  type: AssetType    // Asset type
  ext: string        // Extension (e.g. '.png')
  mime: string       // MIME type (e.g. 'image/png')
  path: string       // Asset path
}

type AssetType = 
  | 'image'        // Image
  | 'audio'        // Audio
  | 'video'        // Video
  | 'font'         // Font
  | 'application'  // Application
  | 'text'         // Text
  | 'other'        // Other
```

### Supported Asset Types

| Type | Extensions |
|------|------------|
| **Image** | `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`, `.ico`, `.bmp` |
| **Audio** | `.mp3`, `.wav`, `.ogg`, `.m4a`, `.flac` |
| **Video** | `.mp4`, `.webm`, `.ogv`, `.mov`, `.avi` |
| **Font** | `.woff`, `.woff2`, `.ttf`, `.otf`, `.eot` |
| **Text** | `.json`, `.xml`, `.txt` |
| **Other** | All other file types |

---

## Use Cases

### 1. Avoid Multiple Imports

```typescript
// ❌ Before: Individual imports for each asset
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

// ✅ Now: Centralized management, single import
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

### 2. Dynamic Asset Switching

Dynamically get assets based on current language.

**Directory structure:**

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

**Usage example:**

```typescript
import { assets } from './lib/assets'
import { useI18n } from 'vue-i18n'

function MyComponent() {
  const { locale } = useI18n()
  
  // Dynamically get assets based on language
  return <img src={assets.i18n[locale.value].banner} />
  
  // locale='zh': assets.i18n.zh.banner
  // locale='en': assets.i18n.en.banner
  // locale='ja': assets.i18n.ja.banner
}
```

---

### 3. Batch Asset Processing

Use `assetMeta` for asset filtering and grouping.

```typescript
import { assetMeta } from './lib/assets'

// Get all image assets
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

// Group by MIME type
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

// Use
const allImages = getAllImages()
const jpegImages = groupByMimeType()['image/jpeg']
console.log(`Found ${allImages.length} images`)
console.log(`Including ${jpegImages.length} JPEG images`)
```

---

### 4. Asset Preloading Management

Organize assets by level for smart preloading.

**Directory structure:**

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

**Preloading implementation:**

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

  // Use assets to render scene
  const bg = assets.game[level].bg
  const hero = assets.game[level].hero

  scene.setBackground(bg)
  scene.spawnHero(hero)
}

enterLevel('level1')
```

---

## License

MIT

## Author

Created with ❤️ for better asset management
