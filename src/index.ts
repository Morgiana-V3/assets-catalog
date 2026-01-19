// Export runtime functions (for browser/Vite environment)
export { createAssets, type InferAssets, type InferAssetMeta } from './runtime.js'

// Export browser environment utility functions
export { getMimeType, guessAssetType, COMMON_MIME_TYPES } from './utils.js'

// Export types
export type { AssetType, AssetMeta, AssetTree, CliOptions } from './types.js'

