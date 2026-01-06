import path from 'node:path'
import mime from 'mime-types'
import type { AssetMeta, AssetType, AssetTree } from './types.js'

/**
 * Common MIME type mappings (for browser environment, avoiding full mime-db)
 */
export const COMMON_MIME_TYPES: Record<string, string> = {
  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  // Audio
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.flac': 'audio/flac',
  // Video
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogv': 'video/ogg',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  // Fonts
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  // Text
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.ts': 'application/typescript',
}

/**
 * Get MIME type by extension (browser-friendly version)
 */
export function getMimeType(ext: string): string {
  return COMMON_MIME_TYPES[ext.toLowerCase()] || 'application/octet-stream'
}

/**
 * Guess asset type by extension
 */
export function guessAssetType(ext: string): AssetType {
  ext = ext.toLowerCase()
  
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.bmp']
  const audioExts = ['.mp3', '.wav', '.ogg', '.m4a', '.flac']
  const videoExts = ['.mp4', '.webm', '.ogv', '.mov', '.avi']
  const fontExts = ['.woff', '.woff2', '.ttf', '.otf', '.eot']
  
  if (imageExts.includes(ext)) return 'image'
  if (audioExts.includes(ext)) return 'audio'
  if (videoExts.includes(ext)) return 'video'
  if (fontExts.includes(ext)) return 'font'
  if (ext === '.json' || ext === '.xml' || ext === '.txt') return 'text'
  
  return 'other'
}

/**
 * Set deep property in nested object
 */
export function setDeep(obj: any, segments: string[], value: any) {
  let cur = obj

  for (let i = 0; i < segments.length; i++) {
    const key = segments[i]
    const isLast = i === segments.length - 1

    if (isLast) {
      cur[key] = value
    } else {
      if (!cur[key] || typeof cur[key] !== 'object') {
        cur[key] = {}
      }
      cur = cur[key]
    }
  }
}

/**
 * Convert JS value to TypeScript source code string
 */
export function toTsLiteral(value: any, indent = 0): string {
  const pad = (n: number) => '  '.repeat(n)

  if (value === null) return 'null'
  const t = typeof value

  if (t === 'string') {
    const escaped = value
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
    return `'${escaped}'`
  }

  if (t === 'number' || t === 'boolean') {
    return String(value)
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const items = value
      .map((v) => pad(indent + 1) + toTsLiteral(v, indent + 1))
      .join(',\n')
    return `[\n${items}\n${pad(indent)}]`
  }

  if (t === 'object') {
    const entries = Object.entries(value)
    if (entries.length === 0) return '{}'

    const lines: string[] = []

    for (const [k, v] of entries) {
      const isValidId = /^[A-Za-z_$][\w$]*$/.test(k)
      const keyCode = isValidId ? k : toTsLiteral(k, 0)
      const valCode = toTsLiteral(v, indent + 1)
      lines.push(`${pad(indent + 1)}${keyCode}: ${valCode}`)
    }

    return `{\n${lines.join(',\n')}\n${pad(indent)}}`
  }

  return toTsLiteral(String(value), indent)
}

/**
 * Map all leaves { path, ... } in assetMeta tree to path strings
 */
export function mapMetaToPaths(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj

  // Leaf: has path field
  if ('path' in obj && typeof (obj as any).path === 'string') {
    return (obj as any).path
  }

  const result: any = Array.isArray(obj) ? [] : {}
  for (const [k, v] of Object.entries(obj)) {
    result[k] = mapMetaToPaths(v)
  }
  return result
}

/**
 * Build meta information from file path (Node.js environment, using full mime-types library)
 */
export function buildMeta(pathWithRoot: string): AssetMeta {
  const ext = path.extname(pathWithRoot).toLowerCase()
  // Prefer full mime-types library (supports more types)
  const mimeType = (mime.lookup(pathWithRoot) || getMimeType(ext)) as string
  const major = mimeType.split('/')[0]

  let type: AssetType
  if (major === 'image' || major === 'audio' || major === 'video' || major === 'font' || major === 'application' || major === 'text') {
    type = major as AssetType
  } else {
    type = 'other'
  }

  return {
    type,
    ext,
    mime: mimeType,
    path: pathWithRoot
  }
}

/**
 * Parse CLI arguments
 */
export function parseArgs(argv: string[]): { inputDir: string; outFile: string; watch: boolean } {
  const args = argv.slice(2)

  let inputDir = 'src/assets'
  let outFile = 'src/lib/assets.ts'
  let watch = false

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    const next = args[i + 1]

    if (arg === '--input' && next) {
      inputDir = next
      i++
    } else if (arg === '--out' && next) {
      outFile = next
      i++
    } else if (arg === '--watch' || arg === '-w') {
      watch = true
    }
  }

  return { inputDir, outFile, watch }
}

