/**
 * assets-catalog
 * 静态资源目录生成工具，支持 CLI 生成和 Vite 运行时两种方式
 */

// 导出运行时函数（Vite 环境使用）
export { createAssets, type InferAssets, type InferAssetMeta } from './runtime.js'

// 导出类型
export type { AssetType, AssetMeta, AssetTree, CliOptions } from './types.js'

// 导出 CLI 函数（可编程调用）
export { generateAssetsTs } from './cli.js'

