import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { setDeep, parseArgs, generateAssetsCode } from './utils.js'
import { buildMeta, convertToRelativePaths } from './node-utils.js'

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

  // Collect all file information (pure data collection)
  const files: Array<{ segments: string[]; meta: any }> = []

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

      // Build segments
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
      files.push({ segments: usedSegments, meta })
    }
  }

  if (!silent) {
    console.log('Scanning directory:', rootDir)
  }
  
  await walk(rootDir)

  // Build tree using pure function (don't modify any objects)
  let metaTree: Record<string, any> = {}
  for (const { segments, meta } of files) {
    metaTree = setDeep(metaTree, segments, meta)
  }

  // Convert all paths to relative paths (pure function, returns new object)
  const metaTreeWithRelativePaths = convertToRelativePaths(metaTree, outPath)

  const header = `// Generated at: ${new Date().toLocaleString('en-US')}\n\n`
  const code = generateAssetsCode(metaTreeWithRelativePaths)
  const content = header + code

  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, content, 'utf8')

  if (!silent) {
    console.log('✓ Generated manifest:', outPath)
  }
}

/**
 * Watch mode: watch file changes and auto-regenerate
 */
export async function watchAndGenerate() {
  const { inputDir, outFile } = parseArgs(process.argv)
  const projectRoot = process.cwd()
  const rootDir = path.resolve(projectRoot, inputDir)

  console.log('Watch mode started')
  console.log('Watching directory:', rootDir)
  console.log('Output file:', path.resolve(projectRoot, outFile))
  console.log('Tip: Press Ctrl+C to stop watching\n')

  // Initial generation
  await generateAssetsTs({ inputDir, outFile })

 
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

  // Use fs.watch to watch directory
  const watcher = fsSync.watch(rootDir, { recursive: true }, (_eventType, filename) => {
    if (filename) {
      // Filter out temporary and hidden files
      if (filename.startsWith('.') || filename.includes('~')) {
        return
      }
      regenerate()
    }
  })

  
  process.on('SIGINT', () => {
    console.log('\n\nStopping watch mode')
    watcher.close()
    process.exit(0)
  })
}

// CLI entry logic
// Check if running as main module (supports direct run and npm link/npx)
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.endsWith('cli.js') ||
                     process.argv[1]?.includes('gen-assets')

if (isMainModule) {
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

