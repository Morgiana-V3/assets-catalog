import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { setDeep, toTsLiteral, mapMetaToPaths, buildMeta, parseArgs } from './utils.js'

/**
 * Generate asset manifest file
 */
export async function generateAssetsTs(options?: { inputDir?: string; outFile?: string; silent?: boolean }) {
  const parsedArgs = parseArgs(process.argv)
  const inputDir = options?.inputDir || parsedArgs.inputDir
  const outFile = options?.outFile || parsedArgs.outFile
  const silent = options?.silent || false
  
  const projectRoot = process.cwd()

  const rootDir = path.resolve(projectRoot, inputDir)
  const outPath = path.resolve(projectRoot, outFile)

  // Stores the assetMeta tree (leaves are meta objects)
  const metaTree: Record<string, any> = {}

  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const full = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        await walk(full)
        continue
      }

      // File
      const relFromRoot = path
        .relative(rootDir, full)
        .replace(/\\/g, '/')

      const normalizedPrefix = inputDir
        .replace(/\\/g, '/')
        .replace(/\/+$/, '')

      const pathWithRoot = `${normalizedPrefix}/${relFromRoot}`

      // Construct segments
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
    console.log('🔍 Scanning directory:', rootDir)
  }
  
  await walk(rootDir)

  // Map metaTree to assets tree containing only paths
  const assetsTree = mapMetaToPaths(metaTree)

  const header =
    `// Generated asset manifest - Do not modify manually. Regenerate when assets change.\n` +
    `// Generated at: ${new Date().toLocaleString('en-US')}\n\n`

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
    console.log('✓ Generated manifest:', outPath)
  }
}

/**
 * Watch mode: Monitor file changes and auto-regenerate
 */
export async function watchAndGenerate() {
  const { inputDir, outFile } = parseArgs(process.argv)
  const projectRoot = process.cwd()
  const rootDir = path.resolve(projectRoot, inputDir)

  console.log('👀 Watch mode started')
  console.log('📁 Watching directory:', rootDir)
  console.log('📝 Output file:', path.resolve(projectRoot, outFile))
  console.log('💡 Tip: Press Ctrl+C to stop watching\n')

  // Initial generation
  await generateAssetsTs({ inputDir, outFile })

  // Debounce: Avoid multiple triggers in a short time
  let timer: NodeJS.Timeout | null = null
  const debounceDelay = 300

  const regenerate = async () => {
    if (timer) {
      clearTimeout(timer)
    }
    
    timer = setTimeout(async () => {
      try {
        const now = new Date().toLocaleString('en-US')
        console.log(`\n[${now}] 🔄 File change detected, regenerating...`)
        await generateAssetsTs({ inputDir, outFile, silent: true })
        console.log(`[${now}] ✓ Manifest updated`)
      } catch (err) {
        console.error('✗ Generation failed:', err)
      }
    }, debounceDelay)
  }

  // Watch directory using fs.watch
  const watcher = fsSync.watch(rootDir, { recursive: true }, (eventType, filename) => {
    if (filename) {
      // Filter out temporary and hidden files
      if (filename.startsWith('.') || filename.includes('~')) {
        return
      }
      regenerate()
    }
  })

  // Graceful exit
  process.on('SIGINT', () => {
    console.log('\n\n Stopped watching')
    watcher.close()
    process.exit(0)
  })
}

// CLI entry logic
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('cli.js')) {
  const { watch } = parseArgs(process.argv)
  
  if (watch) {
    // Watch mode
    watchAndGenerate().catch((err) => {
      console.error('✗ Watch failed:')
      console.error(err)
      process.exit(1)
    })
  } else {
    // Normal generation mode
    generateAssetsTs().catch((err) => {
      console.error('✗ Generation failed:')
      console.error(err)
      process.exit(1)
    })
  }
}

