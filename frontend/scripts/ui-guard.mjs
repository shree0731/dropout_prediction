import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default || traverseModule;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');
const srcDir = path.join(frontendDir, 'src');
const allowlistPath = path.join(frontendDir, 'ui-guard-allowlist.json');

let allowlist = {
  allowedNewFiles: [],
  allowedModifiedFiles: [],
  allowedElements: []
};

if (fs.existsSync(allowlistPath)) {
  try {
    allowlist = JSON.parse(fs.readFileSync(allowlistPath, 'utf-8'));
  } catch (err) {
    console.error('Failed to parse ui-guard-allowlist.json:', err.message);
  }
}

function getAllFiles(dir, exts = ['.js', '.jsx']) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, exts));
    } else if (exts.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function getBaselineCode(relPath) {
  const normalizedRel = relPath.replace(/\\/g, '/');
  const tags = ['pre-rename', 'pre-round3'];
  for (const tag of tags) {
    try {
      return execSync(`git show ${tag}:frontend/${normalizedRel}`, {
        cwd: frontendDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch {
      try {
        return execSync(`git show ${tag}:${normalizedRel}`, {
          cwd: frontendDir,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } catch {}
    }
  }
  throw new Error(`Could not load baseline for ${normalizedRel}`);
}

function parseCode(code) {
  return parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'exportDefaultFrom', 'classProperties']
  });
}

function extractReferencedIdentifiers(exprNode) {
  const ids = [];
  if (!exprNode) return ids;

  if (exprNode.type === 'StringLiteral' || exprNode.type === 'NumericLiteral' || exprNode.type === 'BooleanLiteral') {
    return ids;
  }

  // Mini traversal for identifiers
  function walk(node, parent) {
    if (!node || typeof node !== 'object') return;

    if (node.type === 'Identifier') {
      // Check if it's an uncomputed property key in an object
      const isUncomputedKey =
        parent &&
        parent.type === 'ObjectProperty' &&
        parent.key === node &&
        !parent.computed &&
        !parent.shorthand;

      if (!isUncomputedKey) {
        ids.push(node.name);
      }
    }

    for (const key of Object.keys(node)) {
      if (['loc', 'start', 'end', 'range', 'comments', 'extra'].includes(key)) continue;
      const child = node[key];
      if (Array.isArray(child)) {
        for (const c of child) walk(c, node);
      } else if (child && typeof child === 'object') {
        walk(child, node);
      }
    }
  }

  walk(exprNode, null);
  return Array.from(new Set(ids)).sort();
}

function normalizeAST(ast, isWorking = false) {
  // 1. Remove comments
  ast.comments = [];

  traverse(ast, {
    enter(pathNode) {
      const node = pathNode.node;
      if (!node) return;

      // Remove location metadata
      delete node.loc;
      delete node.start;
      delete node.end;
      delete node.range;
      delete node.extra;
      delete node.leadingComments;
      delete node.trailingComments;
      delete node.innerComments;

      // In working AST, filter allowed decorative additions
      // Allowed import removal (e.g., import HeroParallax, ScrollParallax, DemoVideo)
      if (node.type === 'ImportDeclaration') {
        const isAllowedImport = (allowlist.allowedElements || []).some(allowed =>
          node.specifiers.some(s => s.local && s.local.name === allowed) ||
          node.source.value.includes(allowed)
        );
        if (isAllowedImport) {
          pathNode.remove();
          return;
        }
      }

        // Allowed decorative JSXElement removal (e.g. <HeroParallax />, ticker, hero-photo-ring)
        if (node.type === 'JSXElement' && node.openingElement) {
          const tagName = node.openingElement.name && node.openingElement.name.name;
          const isAllowedTag = (allowlist.allowedElements || []).includes(tagName);

          let hasAllowedAttr = false;
          if (node.openingElement.attributes) {
            hasAllowedAttr = node.openingElement.attributes.some(attr => {
              if (attr.type === 'JSXAttribute' && attr.name && (attr.name.name === 'data-allowlist' || attr.name.name === 'data-decorative')) {
                const val = attr.value && (attr.value.value || (attr.value.expression && attr.value.expression.value));
                return (allowlist.allowedElements || []).includes(val);
              }
              return false;
            });
          }

          if (isAllowedTag || hasAllowedAttr) {
            pathNode.remove();
            return;
          }
        }

      // Filter and normalize JSXOpeningElement attributes
      if (node.type === 'JSXOpeningElement') {
        if (Array.isArray(node.attributes)) {
          const filtered = [];
          for (const attr of node.attributes) {
            if (attr.type === 'JSXAttribute' && attr.name) {
              const attrName = attr.name.name;
              // Drop attributes named alt, loading, width, height, role, aria-*, data-*
              if (
                ['alt', 'loading', 'width', 'height', 'role'].includes(attrName) ||
                attrName.startsWith('aria-') ||
                attrName.startsWith('data-')
              ) {
                continue;
              }

              // Normalise style and className
              if (attrName === 'style' || attrName === 'className') {
                let expr = null;
                if (attr.value) {
                  if (attr.value.type === 'JSXExpressionContainer') {
                    expr = attr.value.expression;
                  } else if (attr.value.type === 'StringLiteral') {
                    expr = attr.value;
                  }
                }
                const refs = extractReferencedIdentifiers(expr);
                attr.value = {
                  type: 'StringLiteral',
                  value: `__REFS__:${refs.join(',')}`
                };
              }
            }
            filtered.push(attr);
          }

          // Sort remaining attributes by name for order-independent comparison
          filtered.sort((a, b) => {
            const nameA = a.name && a.name.name ? a.name.name : '';
            const nameB = b.name && b.name.name ? b.name.name : '';
            return nameA.localeCompare(nameB);
          });

          node.attributes = filtered;
        }
      }

      // Normalise JSX children: drop whitespace-only text, normalize internal whitespace, and drop JSX comments ({/* ... */})
      if (node.type === 'JSXElement' || node.type === 'JSXFragment') {
        if (Array.isArray(node.children)) {
          const cleanChildren = [];
          for (const child of node.children) {
            if (child.type === 'JSXText') {
              const trimmed = child.value.trim();
              if (trimmed === '') {
                continue; // drop whitespace-only
              }
              child.value = child.value.replace(/\s+/g, ' ').trim();
            }
            if (child.type === 'JSXExpressionContainer' && (!child.expression || child.expression.type === 'JSXEmptyExpression')) {
              continue; // drop JSX comment containers
            }
            cleanChildren.push(child);
          }
          node.children = cleanChildren;
        }
      }
    }
  });

  return ast;
}

function deepCompare(a, b, currentPath = 'root') {
  if (a === b) return { match: true };

  if (a === null || b === null || a === undefined || b === undefined) {
    if (a !== b) {
      return {
        match: false,
        path: currentPath,
        expected: JSON.stringify(a),
        actual: JSON.stringify(b),
        message: `Value mismatch at ${currentPath}: expected ${JSON.stringify(a)}, got ${JSON.stringify(b)}`
      };
    }
    return { match: true };
  }

  if (typeof a !== typeof b) {
    return {
      match: false,
      path: currentPath,
      expected: typeof a,
      actual: typeof b,
      message: `Type mismatch at ${currentPath}: expected ${typeof a}, got ${typeof b}`
    };
  }

  if (typeof a !== 'object') {
    if (a !== b) {
      return {
        match: false,
        path: currentPath,
        expected: String(a),
        actual: String(b),
        message: `Primitive mismatch at ${currentPath}: expected "${a}", got "${b}"`
      };
    }
    return { match: true };
  }

  if (Array.isArray(a) !== Array.isArray(b)) {
    return {
      match: false,
      path: currentPath,
      expected: Array.isArray(a) ? 'Array' : 'Object',
      actual: Array.isArray(b) ? 'Array' : 'Object',
      message: `Structure mismatch at ${currentPath}: one is array, other is not`
    };
  }

  const ignoreKeys = new Set([
    'loc', 'start', 'end', 'range', 'extra',
    'comments', 'leadingComments', 'trailingComments', 'innerComments'
  ]);

  if (Array.isArray(a)) {
    if (a.length !== b.length) {
      return {
        match: false,
        path: currentPath,
        expected: `Array(length=${a.length})`,
        actual: `Array(length=${b.length})`,
        message: `Array length mismatch at ${currentPath}: baseline has ${a.length} items, working has ${b.length} items`
      };
    }
    for (let i = 0; i < a.length; i++) {
      const res = deepCompare(a[i], b[i], `${currentPath}[${i}]`);
      if (!res.match) return res;
    }
    return { match: true };
  }

  const keysA = Object.keys(a).filter(k => !ignoreKeys.has(k)).sort();
  const keysB = Object.keys(b).filter(k => !ignoreKeys.has(k)).sort();

  // Compare properties
  const allKeys = Array.from(new Set([...keysA, ...keysB]));
  for (const k of allKeys) {
    if (!(k in a)) {
      return {
        match: false,
        path: `${currentPath}.${k}`,
        expected: 'undefined',
        actual: JSON.stringify(b[k]),
        message: `Unexpected property "${k}" at ${currentPath}`
      };
    }
    if (!(k in b)) {
      return {
        match: false,
        path: `${currentPath}.${k}`,
        expected: JSON.stringify(a[k]),
        actual: 'undefined',
        message: `Missing property "${k}" at ${currentPath}`
      };
    }
    const res = deepCompare(a[k], b[k], `${currentPath}.${k}`);
    if (!res.match) return res;
  }

  return { match: true };
}

export function runGuard() {
  console.log('======================================================');
  console.log('🛡️  UI LOGIC FREEZE GUARD');
  console.log('Comparing working tree ASTs with pre-restyle baseline...');
  console.log('======================================================\n');

  const files = getAllFiles(srcDir);
  let allPass = true;
  const results = [];

  for (const file of files) {
    const relPath = path.relative(frontendDir, file).replace(/\\/g, '/');

    // 1. Check if allowed new file
    if ((allowlist.allowedNewFiles || []).includes(relPath)) {
      try {
        const code = fs.readFileSync(file, 'utf-8');
        parseCode(code);
        results.push({ file: relPath, status: 'PASS', note: '(allowed new file)' });
      } catch (err) {
        allPass = false;
        results.push({ file: relPath, status: 'FAIL', error: `Syntax error: ${err.message}` });
      }
      continue;
    }

    // 2. Check if allowed modified component
    const allowedMod = (allowlist.allowedModifiedFiles || []).find(item =>
      typeof item === 'string' ? item === relPath : (item.file === relPath || item.path === relPath)
    );
    if (allowedMod) {
      try {
        const code = fs.readFileSync(file, 'utf-8');
        const ast = parseCode(code);
        // Ensure export is retained
        let hasExport = false;
        traverse(ast, {
          ExportDefaultDeclaration() {
            hasExport = true;
          },
          ExportNamedDeclaration() {
            hasExport = true;
          }
        });
        if (!hasExport) {
          allPass = false;
          results.push({ file: relPath, status: 'FAIL', error: 'Missing required export' });
        } else {
          const reasonNote = typeof allowedMod === 'object' && allowedMod.reason
            ? `(allowed: ${allowedMod.reason})`
            : '(allowed modification)';
          results.push({ file: relPath, status: 'PASS', note: reasonNote });
        }
      } catch (err) {
        allPass = false;
        results.push({ file: relPath, status: 'FAIL', error: `Syntax error: ${err.message}` });
      }
      continue;
    }

    // 3. Normal comparison against pre-restyle baseline
    let baselineCode = '';
    try {
      baselineCode = getBaselineCode(relPath);
    } catch (err) {
      allPass = false;
      results.push({ file: relPath, status: 'FAIL', error: err.message });
      continue;
    }

    const workingCode = fs.readFileSync(file, 'utf-8');

    let baselineAST, workingAST;
    try {
      baselineAST = parseCode(baselineCode);
    } catch (err) {
      allPass = false;
      results.push({ file: relPath, status: 'FAIL', error: `Baseline parse error: ${err.message}` });
      continue;
    }

    try {
      workingAST = parseCode(workingCode);
    } catch (err) {
      allPass = false;
      results.push({ file: relPath, status: 'FAIL', error: `Working tree parse error: ${err.message}` });
      continue;
    }

    normalizeAST(baselineAST, false);
    normalizeAST(workingAST, true);

    const diff = deepCompare(baselineAST, workingAST);
    if (diff.match) {
      results.push({ file: relPath, status: 'PASS' });
    } else {
      allPass = false;
      results.push({
        file: relPath,
        status: 'FAIL',
        error: diff.message,
        path: diff.path,
        expected: diff.expected,
        actual: diff.actual
      });
    }
  }

  // Print summary
  for (const res of results) {
    if (res.status === 'PASS') {
      console.log(`  ✓ PASS: ${res.file} ${res.note || ''}`);
    } else {
      console.log(`  ✗ FAIL: ${res.file}`);
      console.log(`    ↳ Reason: ${res.error}`);
      if (res.path) console.log(`    ↳ At Node: ${res.path}`);
      if (res.expected) console.log(`    ↳ Expected: ${res.expected}`);
      if (res.actual) console.log(`    ↳ Received: ${res.actual}`);
    }
  }

  console.log('\n======================================================');
  if (allPass) {
    console.log('✅ UI Guard: All files PASSED logic freeze verification.');
    console.log('======================================================');
    return true;
  } else {
    console.error('❌ UI Guard: Logic freeze violations detected!');
    console.log('======================================================');
    return false;
  }
}

// When executed directly via node
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const success = runGuard();
  process.exit(success ? 0 : 1);
}
