/**
 * Asset type
 */
export type AssetType = 'image' | 'audio' | 'video' | 'font' | 'application' | 'text' | 'other'

/**
 * Asset metadata
 */
export interface AssetMeta {
  type: AssetType
  ext: string
  mime: string
  path: string
}

/**
 * CLI options
 */
export interface CliOptions {
  inputDir: string
  outFile: string
}

/**
 * Asset tree (nested object, leaves are strings or AssetMeta)
 */
export type AssetTree = {
  [key: string]: AssetTree | string | AssetMeta
}

