import type { AssetTree, AssetMeta } from './types.js'
import { getMimeType, guessAssetType } from './utils.js'

/**
 * Process import.meta.glob result files and convert to asset tree
 */
function processGlobFiles(files: Record<string, any>, baseDir: string): { metaTree: AssetTree; assetsTree: AssetTree } {
  const metaTree: any = {}
  const assetsTree: any = {}

  for (const filePath of Object.keys(files)) {
    // Remove baseDir prefix and leading slashes
    let relativePath = filePath
    if (baseDir && filePath.startsWith(baseDir)) {
      relativePath = filePath.slice(baseDir.length)
    }
    relativePath = relativePath.replace(/^\/+/, '')

    // Split path
    const parts = relativePath.split('/')
    const fileWithExt = parts.pop()!
    
    // Remove extension to use as key
    const lastDot = fileWithExt.lastIndexOf('.')
    const fileKey = lastDot === -1 ? fileWithExt : fileWithExt.slice(0, lastDot)
    const ext = lastDot === -1 ? '' : fileWithExt.slice(lastDot)

    const segments = [...parts, fileKey]

    // Build meta information
    const meta: AssetMeta = {
      type: guessAssetType(ext),
      ext,
      mime: getMimeType(ext),
      path: filePath
    }

    // Set into tree
    setDeepValue(metaTree, segments, meta)
    setDeepValue(assetsTree, segments, filePath)
  }

  return { metaTree, assetsTree }
}

/**
 * Set value in nested object
 */
function setDeepValue(obj: any, segments: string[], value: any) {
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

// MIME type mapping table has been moved to utils.ts for shared use by CLI and runtime

/**
 * Create asset management object (runtime approach, only available in Vite environment)
 * 
 * ⚠️ Note: Since import.meta.glob requires static string literals,
 * you need to call import.meta.glob first, then pass the result to this function
 * 
 * ⚠️ Type limitation: Runtime approach has less precise type inference than CLI approach.
 * For complete type safety, use CLI approach to generate static files.
 * 
 * @param globResult - Result from import.meta.glob
 * @param baseDir - Base directory for trimming paths, e.g. '/src/assets'
 * @returns Object containing assetMeta and assets
 * 
 * @example
 * ```ts
 * // Use in Vite project
 * import { createAssets } from 'assets-catalog'
 * 
 * // Must call import.meta.glob with literal string
 * const globResult = import.meta.glob('/src/assets/**\/*', { eager: true, as: 'url' })
 * const result = createAssets(globResult, '/src/assets')
 * 
 * // Export and mark as const (improves type inference)
 * export const assets = result.assets as Record<string, any>
 * export const assetMeta = result.assetMeta as Record<string, any>
 * 
 * // Use assets (requires type assertion)
 * console.log((assets as any).logo) // '/src/assets/logo.png'
 * // Or use type guard
 * console.log(assets.logo as string)
 * ```
 */
export function createAssets(globResult: Record<string, any>, baseDir: string = '') {
  const { metaTree, assetsTree } = processGlobFiles(globResult, baseDir)

  // Use as const for better type inference
  return {
    assetMeta: metaTree as Record<string, any>,
    assets: assetsTree as Record<string, any>
  } as const
}

/**
 * Type helper: Extract types from createAssets return value
 */
export type InferAssets<T> = T extends { assets: infer A } ? A : never
export type InferAssetMeta<T> = T extends { assetMeta: infer M } ? M : never

