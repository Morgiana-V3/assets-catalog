import type { AssetType } from './types.js'

/**
 * Common MIME type mapping table (browser environment)
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
 * Get MIME type by extension (browser environment)
 */
export function getMimeType(ext: string): string {
  return COMMON_MIME_TYPES[ext.toLowerCase()] || 'application/octet-stream'
}

/**
 * Guess asset type by extension (browser environment)
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
 * Set deep property in nested object (pure function, returns new object)
 * @param obj - Source object
 * @param segments - Path segments array
 * @param value - Value to set
 * @returns New object
 */
export function setDeep(obj: Record<string, any>, segments: string[], value: any): Record<string, any> {
  if (segments.length === 0) {
    return obj
  }

  const [first, ...rest] = segments
  
  if (rest.length === 0) {
    // Last segment, set value
    return {
      ...obj,
      [first]: value
    }
  }
  
  // Recursively handle nested paths
  const nested = obj[first] && typeof obj[first] === 'object' ? obj[first] : {}
  return {
    ...obj,
    [first]: setDeep(nested, rest, value)
  }
}



/**
 * Check if string is a valid JavaScript identifier
 */
function isValidIdentifier(str: string): boolean {
  // JavaScript identifier rules:
  // - Can only contain letters, numbers, underscore, $
  // - Cannot start with a number
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str)
}

/**
 * Generate asset manifest code
 * @param metaTree - Asset metadata tree, where path should be relative paths
 */
export function generateAssetsCode(metaTree: Record<string, any>): string {
  // Build assetMeta and assets tree directly (inline object definitions)
  function rebuildTree(obj: any, path: string[] = [], indent: number = 1): { metaNode: string; assetNode: string } {
    const metaEntries: string[] = []
    const assetEntries: string[] = []
    const indentStr = '  '.repeat(indent)
    
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...path, key]
      
      // Only add quotes for invalid identifiers
      const keyStr = isValidIdentifier(key) ? key : `'${key}'`
      
      if (value && typeof value === 'object' && 'path' in value && 'type' in value) {
        // Leaf node: inline object definition
        const meta = value as any
        const relativePath = meta.path // Already relative path
        
        // Use new URL() for better compatibility
        const urlExpression = `new URL("${relativePath}", import.meta.url).href`
        
        // Inline object definition
        const objDef = `{\n${indentStr}  type: '${meta.type}',\n${indentStr}  ext: '${meta.ext}',\n${indentStr}  mime: '${meta.mime}',\n${indentStr}  path: ${urlExpression},\n${indentStr}}`
        metaEntries.push(`${indentStr}${keyStr}: ${objDef}`)
        
        // Build assets by accessing assetMeta paths
        const accessPath = currentPath
          .map(k => isValidIdentifier(k) ? `.${k}` : `['${k}']`)
          .join('')
          .replace(/^\./, '') // Remove leading dot
        assetEntries.push(`${indentStr}${keyStr}: assetMeta.${accessPath}.path`)
      } else if (value && typeof value === 'object') {
        // Intermediate node: recursively build subtree
        const { metaNode, assetNode } = rebuildTree(value, currentPath, indent + 1)
        metaEntries.push(`${indentStr}${keyStr}: ${metaNode}`)
        assetEntries.push(`${indentStr}${keyStr}: ${assetNode}`)
      }
    }
    
    const closeIndent = '  '.repeat(indent - 1)
    const metaNode = `{\n${metaEntries.join(',\n')}\n${closeIndent}}`
    const assetNode = `{\n${assetEntries.join(',\n')}\n${closeIndent}}`
    
    return { metaNode, assetNode }
  }

  // Build tree structure
  const { metaNode, assetNode } = rebuildTree(metaTree)

  // Assemble final code
  let code = '// Asset metadata tree\n'
  code += `export const assetMeta = ${metaNode} as const\n\n`
  
  code += '// Asset path tree\n'
  code += `export const assets = ${assetNode} as const\n\n`
  
  code += '// Type exports\n'
  code += 'export type AssetMeta = typeof assetMeta\n'
  code += 'export type Assets = typeof assets\n'

  return code
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


