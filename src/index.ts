import { MatchPath, createMatchPath, loadConfig } from 'tsconfig-paths'
import getDevPaths = require('get-dev-paths')
import realpath = require('realpath-native')

type MetroContext = {
  originModulePath: string
  moduleCache: any
}

type MetroConfig = {
  projectRoot?: string
  watchFolders?: string[]
  resolver?: {
    sourceExts?: string[]
    resolverMainFields?: string[]
    resolveRequest?: (context: MetroContext, moduleName: string) => any
  }
}

export = (cfg: MetroConfig) => {
  const projectRoot = cfg.projectRoot || process.cwd()
  const devPaths: string[] = getDevPaths(projectRoot, { preserveLinks: false })

  cfg.watchFolders = union(cfg.watchFolders!, devPaths).filter(f => f)
  cfg.resolver = { ...cfg.resolver }

  const roots = [projectRoot].concat(cfg.watchFolders)
  const matchers = loadMatchers(roots, cfg)
  const extensions = (
    cfg.resolver.sourceExts || ['ts', 'tsx', 'js', 'jsx', 'json']
  ).map(ext => '.' + ext)

  hookBefore(cfg.resolver, 'resolveRequest', (context, moduleName) => {
    const { originModulePath, moduleCache } = context
    const originModule = moduleCache.getModule(originModulePath)
    const originPackage = originModule.getPackage()
    const matcher = matchers[originPackage.root]
    if (matcher) {
      let match = matcher(moduleName, undefined, undefined, extensions)
      if (match) {
        try {
          match = realpath.sync(match)
          console.log({ moduleName, originModulePath, match })
          return {
            type: 'sourceFile',
            filePath: match,
          }
        } catch {}
      }
    }
    return null
  })

  return cfg
}

function loadMatchers(roots: string[], cfg: MetroConfig) {
  const { resolverMainFields } = cfg.resolver!
  const matchers: { [root: string]: MatchPath | null } = {}
  roots.forEach(root => {
    const { absoluteBaseUrl, paths } = loadConfig(root) as any
    matchers[root] = paths
      ? createMatchPath(absoluteBaseUrl, paths, resolverMainFields, false)
      : null
  })
  return matchers
}

type OneOrMore<T> = T | readonly T[]

function union<T>(...args: OneOrMore<T>[]) {
  return Array.from(new Set<T>([].concat(...(args as any))))
}

function hookBefore<T extends object, P extends keyof T>(
  obj: T,
  key: P,
  fn: Extract<T[P], (...args: any[]) => any>
) {
  const origFn: any = typeof obj[key] == 'function' ? obj[key] : null
  obj[key] = function(this: any, ...args) {
    const result = fn.apply(this, args)
    return origFn && result == null ? origFn.apply(this, args) : result
  } as typeof fn
}
