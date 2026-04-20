import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const SUPPORTED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

const EXCLUDE_DIRS = new Set([
    'node_modules', 'dist', 'build', '.git', '.next', 'coverage',
    '__pycache__', '.cache', 'uploads', 'migrations',
]);

const EXCLUDE_FILES = new Set([
    'remove-comments.mjs',
]);

let processed = 0;
let skipped = 0;
let errors = 0;

function collectCommentRanges(code, filePath) {
    const isJsx = /\.[jt]sx$/.test(filePath);
    const langVariant = isJsx ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard;
    const sourceFile = ts.createSourceFile(filePath, code, ts.ScriptTarget.Latest, true, langVariant);

    const ranges = new Map();
    const add = (list) => {
        if (!list) return;
        for (const r of list) ranges.set(`${r.pos}-${r.end}`, r);
    };

    function visit(node) {
        add(ts.getLeadingCommentRanges(code, node.getFullStart()));
        add(ts.getTrailingCommentRanges(code, node.getEnd()));
        ts.forEachChild(node, visit);
    }
    visit(sourceFile);

    return [...ranges.values()].sort((a, b) => a.pos - b.pos);
}

function removeComments(code, filePath) {
    const commentRanges = collectCommentRanges(code, filePath);
    let result = '';
    let cursor = 0;
    for (const range of commentRanges) {
        result += code.slice(cursor, range.pos);
        let end = range.end;
        if (range.kind === ts.SyntaxKind.SingleLineCommentTrivia && code[end] === '\n') {
            end += 1;
        }
        const removed = code.slice(range.pos, end);
        result += removed.replace(/[^\n]/g, '');
        cursor = end;
    }
    result += code.slice(cursor);
    return result;
}

function cleanFile(filePath) {
    const original = readFileSync(filePath, 'utf8');
    let cleaned = removeComments(original, filePath);
    cleaned = cleaned.replace(/^[ \t]*\{\}[ \t]*\n/gm, '');

    // Collapse 3+ consecutive blank lines → 2
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    if (cleaned !== original) {
        writeFileSync(filePath, cleaned, 'utf8');
        console.log(`✓ Cleaned: ${filePath}`);
        processed++;
    } else {
        skipped++;
    }
}

function walk(dir) {
    let entries;
    try {
        entries = readdirSync(dir);
    } catch {
        return;
    }

    for (const entry of entries) {
        if (EXCLUDE_DIRS.has(entry)) continue;

        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
            walk(fullPath);
        } else if (stat.isFile()) {
            if (!SUPPORTED_EXTENSIONS.has(extname(entry))) continue;
            if (EXCLUDE_FILES.has(entry)) continue;

            try {
                cleanFile(fullPath);
            } catch (err) {
                console.error(`✗ Error processing ${fullPath}: ${err.message}`);
                errors++;
            }
        }
    }
}

const rootDir = process.argv[2] || process.cwd();
console.log(`\nRemoving comments from: ${rootDir}\n`);
walk(rootDir);
console.log(`\nDone — ${processed} file(s) cleaned, ${skipped} unchanged, ${errors} error(s).`);
