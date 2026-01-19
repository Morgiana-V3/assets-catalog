import path from 'node:path'
import mime from 'mime-types'
import type { AssetMeta, AssetType } from './types.js'

/**
 * Generate meta information from file path (Node.js environment, using full mime-types library)
 */
export function buildMeta(pathWithRoot: string): AssetMeta {
  const ext = path.extname(pathWithRoot).toLowerCase()
  const mimeType = mime.lookup(pathWithRoot) || 'application/octet-stream'
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
 * Convert all paths in asset tree to relative paths (pure function, returns new object)
 * @param metaTree - Asset metadata tree
 * @param outFilePath - Absolute path of output file
 * @returns New tree object with converted paths
 */
export function convertToRelativePaths(metaTree: Record<string, any>, outFilePath: string): Record<string, any> {
  const fromDir = path.dirname(outFilePath)
  
  function traverse(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj
    }
    
    // Leaf node: has path and type fields
    if ('path' in obj && 'type' in obj) {
      const absolutePath = obj.path as string
      let relativePath = path.relative(fromDir, absolutePath)
      // Use forward slashes uniformly (ES modules requirement)
      relativePath = relativePath.replace(/\\/g, '/')
      // Ensure relative path starts with ./ or ../
      if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath
      }
      
      // Return new object, don't modify original
      return {
        ...obj,
        path: relativePath
      }
    }
    
    // Intermediate node: recursively process all child nodes
    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = traverse(value)
    }
    return result
  }
  
  return traverse(metaTree)
}

