import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { setDeep, toTsLiteral, mapMetaToPaths, buildMeta, parseArgs } from './utils.js'

/**
 * 生成资源清单文件
 */
export async function generateAssetsTs(options?: { inputDir?: string; outFile?: string; silent?: boolean }) {
  const parsedArgs = parseArgs(process.argv)
  const inputDir = options?.inputDir || parsedArgs.inputDir
  const outFile = options?.outFile || parsedArgs.outFile
  const silent = options?.silent || false
  
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

  if (!silent) {
    console.log('🔍 扫描目录:', rootDir)
  }
  
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

  if (!silent) {
    console.log('✓ 生成清单:', outPath)
  }
}

/**
 * 监听模式：监听文件变化并自动重新生成
 */
export async function watchAndGenerate() {
  const { inputDir, outFile } = parseArgs(process.argv)
  const projectRoot = process.cwd()
  const rootDir = path.resolve(projectRoot, inputDir)

  console.log('👀 监听模式已启动')
  console.log('📁 监听目录:', rootDir)
  console.log('📝 输出文件:', path.resolve(projectRoot, outFile))
  console.log('💡 提示: 按 Ctrl+C 停止监听\n')

  // 初始生成
  await generateAssetsTs({ inputDir, outFile })

  // 防抖：避免短时间内多次触发
  let timer: NodeJS.Timeout | null = null
  const debounceDelay = 300

  const regenerate = async () => {
    if (timer) {
      clearTimeout(timer)
    }
    
    timer = setTimeout(async () => {
      try {
        const now = new Date().toLocaleString('zh-CN')
        console.log(`\n[${now}] 🔄 检测到文件变化，重新生成...`)
        await generateAssetsTs({ inputDir, outFile, silent: true })
        console.log(`[${now}] ✓ 清单已更新`)
      } catch (err) {
        console.error('✗ 生成失败:', err)
      }
    }, debounceDelay)
  }

  // 使用 fs.watch 监听目录
  const watcher = fsSync.watch(rootDir, { recursive: true }, (eventType, filename) => {
    if (filename) {
      // 过滤掉临时文件和隐藏文件
      if (filename.startsWith('.') || filename.includes('~')) {
        return
      }
      regenerate()
    }
  })

  // 优雅退出
  process.on('SIGINT', () => {
    console.log('\n\n👋 停止监听')
    watcher.close()
    process.exit(0)
  })
}

// CLI 入口逻辑
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('cli.js')) {
  const { watch } = parseArgs(process.argv)
  
  if (watch) {
    // 监听模式
    watchAndGenerate().catch((err) => {
      console.error('✗ 监听失败:')
      console.error(err)
      process.exit(1)
    })
  } else {
    // 普通生成模式
    generateAssetsTs().catch((err) => {
      console.error('✗ 生成失败:')
      console.error(err)
      process.exit(1)
    })
  }
}

