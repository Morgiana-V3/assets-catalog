import fs from 'node:fs/promises'
import path from 'node:path'
import { setDeep, toTsLiteral, mapMetaToPaths, buildMeta, parseArgs } from './utils.js'

/**
 * 生成资源清单文件
 */
export async function generateAssetsTs() {
  const { inputDir, outFile } = parseArgs(process.argv)
  const projectRoot = process.cwd()

  const rootDir = path.resolve(projectRoot, inputDir)
  const outPath = path.resolve(projectRoot, outFile)

  // 这里存的是 assetMeta 的树（叶子是 meta 对象）
  const metaTree: Record<string, any> = {}

  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const full = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        await walk(full)
        continue
      }

      // 文件
      const relFromRoot = path
        .relative(rootDir, full)
        .replace(/\\/g, '/')

      const normalizedPrefix = inputDir
        .replace(/\\/g, '/')
        .replace(/\/+$/, '')

      const pathWithRoot = `${normalizedPrefix}/${relFromRoot}`

      // 构造 segments
      const pathParts = pathWithRoot.split('/')
      const fileWithExt = pathParts.pop()!

      const lastDot = fileWithExt.lastIndexOf('.')
      const fileKey =
        lastDot === -1 ? fileWithExt : fileWithExt.slice(0, lastDot)

      const segments = [...pathParts, fileKey]

      const assetsIndex = segments.indexOf('assets')
      const usedSegments =
        assetsIndex >= 0 ? segments.slice(assetsIndex + 1) : segments

      const meta = buildMeta(pathWithRoot)
      setDeep(metaTree, usedSegments, meta)
    }
  }

  console.log('🔍 扫描目录:', rootDir)
  await walk(rootDir)

  // 从 metaTree 映射出只含 path 的 assets 树
  const assetsTree = mapMetaToPaths(metaTree)

  const header =
    `// 生成的资源清单 —— 不要手动更改 资源更新需重新生成一份\n` +
    `// 生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`

  const assetMetaCode =
    'export const assetMeta = ' + toTsLiteral(metaTree, 0) + ' as const\n\n'

  const assetsCode =
    'export const assets = ' + toTsLiteral(assetsTree, 0) + ' as const\n\n'

  const typesCode =
    'export type AssetMeta = typeof assetMeta\n' +
    'export type Assets = typeof assets\n'

  const content = header + assetMetaCode + assetsCode + typesCode

  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, content, 'utf8')

  console.log('✓ 生成清单:', outPath)
}

// 注意：CLI 入口在 bin/cli.js 中

