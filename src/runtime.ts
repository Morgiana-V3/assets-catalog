import type { AssetTree, AssetMeta } from './types.js'
import { getMimeType, guessAssetType } from './utils.js'

/**
 * 处理 import.meta.glob 返回的文件对象，转换为资源树
 */
function processGlobFiles(files: Record<string, any>, baseDir: string): { metaTree: AssetTree; assetsTree: AssetTree } {
  const metaTree: any = {}
  const assetsTree: any = {}

  for (const filePath of Object.keys(files)) {
    // 移除 baseDir 前缀和开头的 /
    let relativePath = filePath
    if (baseDir && filePath.startsWith(baseDir)) {
      relativePath = filePath.slice(baseDir.length)
    }
    relativePath = relativePath.replace(/^\/+/, '')

    // 分割路径
    const parts = relativePath.split('/')
    const fileWithExt = parts.pop()!
    
    // 去掉扩展名作为 key
    const lastDot = fileWithExt.lastIndexOf('.')
    const fileKey = lastDot === -1 ? fileWithExt : fileWithExt.slice(0, lastDot)
    const ext = lastDot === -1 ? '' : fileWithExt.slice(lastDot)

    const segments = [...parts, fileKey]

    // 构建 meta 信息
    const meta: AssetMeta = {
      type: guessAssetType(ext),
      ext,
      mime: getMimeType(ext),
      path: filePath
    }

    // 设置到树中
    setDeepValue(metaTree, segments, meta)
    setDeepValue(assetsTree, segments, filePath)
  }

  return { metaTree, assetsTree }
}

/**
 * 在嵌套对象中设置值
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

// MIME 类型映射表已移到 utils.ts 中，供 CLI 和运行时共用

/**
 * 创建资源管理对象（运行时方式，仅在 Vite 环境可用）
 * 
 * ⚠️ 注意：由于 import.meta.glob 需要静态字符串字面量，
 * 需要先调用 import.meta.glob，然后将结果传给这个函数
 * 
 * ⚠️ 类型限制：运行时方式的类型推断不如 CLI 方式精确。
 * 如果需要完整的类型安全，建议使用 CLI 方式生成静态文件。
 * 
 * @param globResult - import.meta.glob 的返回结果
 * @param baseDir - 基础目录，用于裁剪路径，例如 '/src/assets'
 * @returns 包含 assetMeta 和 assets 的对象
 * 
 * @example
 * ```ts
 * // 在 Vite 项目中使用
 * import { createAssets } from 'assets-catalog'
 * 
 * // 必须使用字面量字符串调用 import.meta.glob
 * const globResult = import.meta.glob('/src/assets/**\/*', { eager: true, as: 'url' })
 * const result = createAssets(globResult, '/src/assets')
 * 
 * // 导出并标记为 const（改善类型推断）
 * export const assets = result.assets as Record<string, any>
 * export const assetMeta = result.assetMeta as Record<string, any>
 * 
 * // 使用资源（需要类型断言）
 * console.log((assets as any).logo) // '/src/assets/logo.png'
 * // 或者使用类型保护
 * console.log(assets.logo as string)
 * ```
 */
export function createAssets(globResult: Record<string, any>, baseDir: string = '') {
  const { metaTree, assetsTree } = processGlobFiles(globResult, baseDir)

  // 返回类型使用 as const 以获得更好的类型推断
  return {
    assetMeta: metaTree as Record<string, any>,
    assets: assetsTree as Record<string, any>
  } as const
}

/**
 * 类型辅助：从 createAssets 返回值中提取类型
 */
export type InferAssets<T> = T extends { assets: infer A } ? A : never
export type InferAssetMeta<T> = T extends { assetMeta: infer M } ? M : never

