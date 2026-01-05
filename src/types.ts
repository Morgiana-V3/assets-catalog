/**
 * 资源类型
 */
export type AssetType = 'image' | 'audio' | 'video' | 'font' | 'application' | 'text' | 'other'

/**
 * 资源元信息
 */
export interface AssetMeta {
  type: AssetType
  ext: string
  mime: string
  path: string
}

/**
 * CLI 选项
 */
export interface CliOptions {
  inputDir: string
  outFile: string
}

/**
 * 资源树（嵌套对象，叶子是字符串或 AssetMeta）
 */
export type AssetTree = {
  [key: string]: AssetTree | string | AssetMeta
}

