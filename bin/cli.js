#!/usr/bin/env node

// CLI 入口文件
import { generateAssetsTs } from '../dist/cli.js'

generateAssetsTs().catch((err) => {
  console.error('✗ 生成失败:')
  console.error(err)
  process.exit(1)
})

