import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import ts from 'typescript'
import { expect, it } from 'vitest'

it('keeps the Pages middleware import graph free of Astro, Node and import.meta.glob', () => {
  const root = process.cwd()
  const configPath = resolve(root, 'tsconfig.json')
  const config = ts.readConfigFile(configPath, ts.sys.readFile)
  const { options } = ts.parseJsonConfigFileContent(config.config, ts.sys, root)
  const visited = new Set<string>()
  const violations: string[] = []

  const visitFile = (file: string) => {
    if (visited.has(file)) return
    visited.add(file)
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
    const inspect = (node: ts.Node) => {
      if (
        ts.isPropertyAccessExpression(node) &&
        node.expression.getText(source) === 'import.meta' &&
        ['glob', 'globEager'].includes(node.name.text)
      ) {
        violations.push(`${file}: ${node.getText(source)}`)
      }
      let specifier: ts.Expression | undefined
      if (ts.isImportDeclaration(node)) {
        const clause = node.importClause
        const bindings = clause?.namedBindings
        const onlyTypes =
          clause?.phaseModifier === ts.SyntaxKind.TypeKeyword ||
          (!clause?.name &&
            bindings &&
            ts.isNamedImports(bindings) &&
            bindings.elements.length > 0 &&
            bindings.elements.every(element => element.isTypeOnly))
        if (!onlyTypes) specifier = node.moduleSpecifier
      } else if (ts.isExportDeclaration(node) && !node.isTypeOnly) {
        specifier = node.moduleSpecifier
      } else if (
        ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword || node.expression.getText(source) === 'require')
      ) {
        specifier = node.arguments[0]
      }
      if (specifier) {
        if (!ts.isStringLiteral(specifier)) {
          violations.push(`${file}: computed import cannot be checked`)
        } else if (/^(astro:|node:)/.test(specifier.text)) {
          violations.push(`${file}: ${specifier.text}`)
        } else {
          const resolved = ts.resolveModuleName(specifier.text, file, options, ts.sys).resolvedModule
          if (!resolved || resolved.isExternalLibraryImport) {
            violations.push(`${file}: unverified runtime import ${specifier.text}`)
          } else visitFile(resolve(dirname(file), resolved.resolvedFileName))
        }
      }
      ts.forEachChild(node, inspect)
    }
    inspect(source)
  }

  visitFile(resolve(root, 'functions/_middleware.ts'))
  expect(violations).toEqual([])
})
