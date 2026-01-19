import type { AssetTree, AssetMeta } from './types.js'
import { setDeep, getMimeType, guessAssetType } from './utils.js'

/**
 * Process import.meta.glob file objects and convert to asset tree
 */
function processGlobFiles(files: Record<string, any>, baseDir: string): { metaTree: AssetTree; assetsTree: AssetTree } {
  let metaTree: any = {}
  let assetsTree: any = {}

  for (const filePath of Object.keys(files)) {
    // Remove baseDir prefix and leading /
    let relativePath = filePath
    if (baseDir && filePath.startsWith(baseDir)) {
      relativePath = filePath.slice(baseDir.length)
    }
    relativePath = relativePath.replace(/^\/+/, '')

    // Split path
    const parts = relativePath.split('/')
    const fileWithExt = parts.pop()!
    
    // Remove extension as key
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

    // Use pure function to set in tree
    metaTree = setDeep(metaTree, segments, meta)
    assetsTree = setDeep(assetsTree, segments, filePath)
  }

  return { metaTree, assetsTree }
}

/**
 * Create asset management object (runtime approach, Vite environment only)
 * 
 * Since import.meta.glob requires static string literals,
 * you need to call import.meta.glob first, then pass the result to this function
 * 
 * @param globResult - Return value of import.meta.glob
 * @param baseDir - Base directory for trimming paths, e.g. '/src/assets'
 * @returns Object containing assetMeta and assets
 * 
 * @example
 * ```ts
 * // Use in Vite project
 * import { createAssets } from 'assets-catalog'
 * 
 * // Must use literal string to call import.meta.glob
 * const globResult = import.meta.glob('/src/assets/**\/*', { query: '?url', import: 'default' })
 * const result = createAssets(globResult, '/src/assets')
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

export type InferAssets<T> = T extends { assets: infer A } ? A : never
export type InferAssetMeta<T> = T extends { assetMeta: infer M } ? M : never

