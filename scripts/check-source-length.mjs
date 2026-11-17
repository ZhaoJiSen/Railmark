import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const limit = 300
const ignoredDirectories = new Set(['node_modules', 'out', 'build'])
const sourceFile = /\.(?:go|tsx?|jsx?|mjs|css|scss|sql)$/

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.') || ignoredDirectories.has(entry.name)) return []
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return entry.isFile() && sourceFile.test(entry.name) ? [path] : []
  })
}

let failed = false
let max = 0
for (const path of sourceFiles('.')) {
  const count = readFileSync(path, 'utf8').replace(/\r?\n$/, '').split(/\r?\n/).length
  max = Math.max(max, count)
  if (count > limit) {
    console.error(`${path}: ${count} lines (maximum ${limit})`)
    failed = true
  }
}

console.log(`Longest source file: ${max}/${limit} lines`)
process.exitCode = failed ? 1 : 0
