# assets-catalog

> Type-safe static asset manager · Auto-generate asset manifests · Support CLI and Vite runtime

[![GitHub](https://img.shields.io/badge/GitHub-Morgiana--V3%2Fassets--catalog-blue?logo=github)](https://github.com/Morgiana-V3/assets-catalog)
[![npm](https://img.shields.io/npm/v/assets-catalog)](https://www.npmjs.com/package/assets-catalog)

[中文文档](./README_ZH.md) | [GitHub Repository](https://github.com/Morgiana-V3/assets-catalog)

## Installation

```bash
npm install assets-catalog
yarn add assets-catalog
pnpm add assets-catalog
```

---

## Important Notes

- **ESM Projects Only**: The code depends on `import.meta` and cannot be used in CommonJS projects
- **Avoid Same Filename**: Duplicate filenames will overwrite each other (e.g. `logo.png` and `logo.jpg`)
- **All Assets Bundled**: All assets in the manifest will be bundled into the build output, please manage unused assets manually

---

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

**Dependencies:**
- [mime-types](https://www.npmjs.com/package/mime-types): MIME type detection

---

## Data Structure

The tool traverses all files in the specified directory and generates two JSON structures: `assets` (paths) and `assetMeta` (metadata).

---

## Usage

Two approaches available, choose based on your project needs:

### Approach 1: CLI Command Line (Recommended)

Generate static asset manifest files using terminal commands.

**✅ Pros:**
- Full TypeScript type hints with friendly editor IntelliSense
- Works with major bundlers (Vite, Webpack, Rollup, Parcel 2, etc.)
- Assets correctly bundled to production

**⚠️ Cons:**
- Requires generating additional code files
- Asset updates require re-running the command (use watch mode to solve this)

**Basic Usage:**

```bash
# Use default config (input: src/assets, output: src/lib/assets.ts)
npx gen-assets

# Custom input/output paths
npx gen-assets --input src/assets --out src/lib/assets.ts

# Watch mode (auto-regenerate on file changes)
npx gen-assets --watch
npx gen-assets -w

# Combined usage
npx gen-assets --input src/assets --out src/lib/assets.ts --watch
```

**Directory Structure Example:**

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

**Generated Data Structure:**

```typescript
// Asset metadata tree
export const assetMeta = {
  images: {
    logo: {
      type: 'image' as const,
      ext: '.png',
      mime: 'image/png',
      path: new URL("../assets/images/logo.png", import.meta.url).href,
    },
    bg: {
      type: 'image' as const,
      ext: '.jpg',
      mime: 'image/jpeg',
      path: new URL("../assets/images/bg.jpg", import.meta.url).href,
    }
  },
  audio: {
    bgm: {
      type: 'audio' as const,
      ext: '.mp3',
      mime: 'audio/mpeg',
      path: new URL("../assets/audio/bgm.mp3", import.meta.url).href,
    }
  },
  fonts: {
    custom: {
      type: 'font' as const,
      ext: '.woff2',
      mime: 'font/woff2',
      path: new URL("../assets/fonts/custom.woff2", import.meta.url).href,
    }
  }
} as const

// Asset path tree
export const assets = {
  images: {
    logo: assetMeta.images.logo.path,
    bg: assetMeta.images.bg.path
  },
  audio: {
    bgm: assetMeta.audio.bgm.path
  },
  fonts: {
    custom: assetMeta.fonts.custom.path
  }
} as const

// Type exports
export type AssetMeta = typeof assetMeta
export type Assets = typeof assets
```

**Usage in Code:**

```typescript
import { assets, assetMeta } from './lib/assets'

// Use asset paths (full type hints)
const logoPath = assets.images.logo

// Get asset metadata
const logoMeta = assetMeta.images.logo
console.log(logoMeta.type)  // 'image'
console.log(logoMeta.mime)  // 'image/png'
```

---

### Approach 2: Vite Runtime

Dynamically generate asset objects in Vite projects.

**✅ Pros:**
- No additional code files needed
- Assets auto-sync, no need to regenerate

**⚠️ Cons:**
- Vite bundler only
- Weaker type hints (`Record<string, any>`), no precise editor IntelliSense

**Usage Example:**

> assets and assetMeta object structure same as above example

```typescript
import { createAssets } from 'assets-catalog'

// Use import.meta.glob to import assets (note: use new Vite glob syntax)
const globResult = import.meta.glob('/src/assets/**/*', { 
  query: '?url',
  import: 'default'
})

// Create asset objects
const { assets, assetMeta } = createAssets(globResult, '/src/assets')

// Use assets
console.log(assets.images.logo)      // URL path
console.log(assetMeta.images.logo)   // { type, ext, mime, path }
```

**About `baseDir` Parameter:**

`baseDir` is used to trim path prefixes, making the generated object structure more concise.

```typescript
// File: /src/assets/images/logo.png

// ❌ Not passing baseDir (or empty string)
createAssets(globResult, '')
// Generates: assets.src.assets.images.logo  // Verbose

// ✅ Pass '/src/assets' (recommended)
createAssets(globResult, '/src/assets')
// Generates: assets.images.logo  // Concise
```

---

### Flexible Usage: Multiple Asset Manifests

You can generate multiple fine-grained asset manifests as needed.

```typescript
// Manage images and fonts separately
const { assets: imageAssets } = createAssets(
  import.meta.glob('/src/assets/images/**/*', { query: '?url', import: 'default' }),
  '/src/assets/images'
)

const { assets: fontAssets } = createAssets(
  import.meta.glob('/src/assets/fonts/**/*', { query: '?url', import: 'default' }),
  '/src/assets/fonts'
)

// Usage
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

### CLI Commands

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

# Watch mode (recommended during development)
npx gen-assets --watch

# Full config
npx gen-assets --input src/assets --out src/lib/assets.ts --watch
```

---

### Vite Runtime API

#### `createAssets(globResult, baseDir?)`

Create asset objects (Vite environment only).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `globResult` | `Record<string, any>` | Yes | Return value of `import.meta.glob` |
| `baseDir` | `string` | No | Base directory for trimming path prefix |

**Return Value:**

```typescript
{
  assets: Record<string, any>,      // Asset path tree
  assetMeta: Record<string, any>    // Asset metadata tree
}
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
  | 'image'        // Images
  | 'audio'        // Audio
  | 'video'        // Video
  | 'font'         // Fonts
  | 'application'  // Applications
  | 'text'         // Text
  | 'other'        // Other
```

### Supported Asset Types

| Type | Extensions |
|------|------------|
| **Images** | `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`, `.ico`, `.bmp` |
| **Audio** | `.mp3`, `.wav`, `.ogg`, `.m4a`, `.flac` |
| **Video** | `.mp4`, `.webm`, `.ogv`, `.mov`, `.avi` |
| **Fonts** | `.woff`, `.woff2`, `.ttf`, `.otf`, `.eot` |
| **Text** | `.json`, `.xml`, `.txt` |
| **Other** | All other file types |

---

## Use Cases

### 1. Avoid Multiple Imports

```typescript
// ❌ Before: Each asset needs separate import
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

// ✅ Now: Unified management, single import
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

**Directory Structure:**

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

**Usage Example:**

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

// Usage
const allImages = getAllImages()
const jpegImages = groupByMimeType()['image/jpeg']
console.log(`Found ${allImages.length} images`)
console.log(`Including ${jpegImages.length} JPEG format`)
```

---

### 4. Asset Preloading Management

Organize assets by game levels for smart preloading.

**Directory Structure:**

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

**Preloading Implementation:**

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

  // Render scene using assets
  const bg = assets.game[level].bg
  const hero = assets.game[level].hero

  scene.setBackground(bg)
  scene.spawnHero(hero)
}

enterLevel('level1')
```

---

## Development

1. Clone repository: `git clone https://github.com/Morgiana-V3/assets-catalog.git`
2. Install dependencies: `npm install`
3. Build: `npm run build`
4. Link globally: `npm link`
5. Link in test project: `npm link assets-catalog`

---

## License

MIT
