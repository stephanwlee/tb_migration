"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transform = void 0;
const ts = __importStar(require("typescript"));
const path = __importStar(require("path"));
const helper_1 = require("./helper");
const html_helper_1 = require("./html-helper");
const ts_helper_1 = require("./ts-helper");
const parse5 = require('parse5');
const Kind = ts.SyntaxKind;
function transform(filePath, sourceContent, exporter) {
    const { links, scripts } = getDependencies(filePath, sourceContent);
    const tsDeps = new Set(scripts);
    const tsScript = helper_1.renameExt(filePath, '.ts');
    [tsScript, ...scripts]
        .filter((tsScriptPath) => {
        const hasFile = helper_1.fs.hasFile(tsScriptPath);
        if (!hasFile) {
            console.error(`Expected to read "${tsScriptPath}" but the file is not found.`);
        }
        return hasFile;
    })
        .forEach((tsScriptPath) => {
        const sourceContent = helper_1.fs.readFile(tsScriptPath);
        let sourceFile = ts.createSourceFile(filePath, sourceContent, ts.ScriptTarget.ES2015, 
        /*setParentNodes */ true);
        const moduleDeps = new Set(tsDeps);
        moduleDeps.delete(tsScriptPath);
        sourceFile = addImports(sourceFile, [
            ...links,
            ...Array.from(moduleDeps).map((filePath) => {
                const fileObject = path.parse(filePath);
                fileObject.base = null;
                fileObject.ext = null;
                return path.relative(path.dirname(tsScriptPath), path.format(fileObject));
            }),
        ]);
        const result = helper_1.getPreamble(sourceContent) + sourceFile.getText();
        exporter.writeFile(tsScriptPath, result);
    });
}
exports.transform = transform;
function remapDependencyToNpm(dep) {
    let clause = undefined;
    if (!dep.includes('paper-') && !dep.includes('iron-')) {
        clause = ts.createImportClause(undefined, ts.createNamedImports([
            ts.createImportSpecifier(undefined, ts.createIdentifier('DO_NOT_SUBMIT')),
        ]));
    }
    else {
        const polymericImport = dep
            .split('/')
            .find((frag) => frag.startsWith('paper') || frag.startsWith('iron'));
        dep = `@polymer/${polymericImport}`;
    }
    return ts.createImportDeclaration(undefined, undefined, clause, ts.createStringLiteral(dep));
}
function addImports(sourceFile, deps) {
    const importStatements = deps
        .filter((dep) => {
        return (!dep.endsWith('polymer/polymer.html') &&
            !dep.endsWith('tf-import/polymer.html'));
    })
        .map(remapDependencyToNpm);
    const nonImportIndex = sourceFile.statements.findIndex((statement) => statement.kind !== Kind.ImportDeclaration);
    const statements = [
        ...sourceFile.statements.slice(0, nonImportIndex),
        ...importStatements,
        ...sourceFile.statements.slice(nonImportIndex),
    ];
    const update = ts.setTextRange(ts.createNodeArray(statements), sourceFile.statements);
    return ts_helper_1.updateSource(sourceFile, update);
}
function getDependencies(filePath, sourceContent) {
    const node = parse5.parse(sourceContent);
    const html = node.childNodes.find((node) => node.tagName === 'html');
    const head = html.childNodes.find((node) => node.tagName === 'head');
    const links = (head ? head.childNodes : [])
        .filter((node) => {
        return (node.tagName === 'link' &&
            node.attrs.find((attr) => {
                return attr.name === 'rel' && attr.value === 'import';
            }));
    })
        .map((node) => {
        return node.attrs.find((attr) => attr.name === 'href').value;
    });
    const scriptNodes = html_helper_1.findScripts(html);
    const externalScripts = scriptNodes.filter((node) => {
        return (node.tagName === 'script' &&
            !node.childNodes.length &&
            node.attrs.length &&
            node.attrs.find(({ name }) => name === 'src'));
    });
    const tsPaths = externalScripts.map((script) => {
        const srcVal = script.attrs.find(({ name }) => name === 'src').value;
        if (path.extname(srcVal) !== '.js') {
            console.warn(`[WARN] "src" of script does not end with .js. ${srcVal}`);
            return;
        }
        const jsPath = path.resolve(path.dirname(filePath), srcVal);
        const fileNameObject = path.parse(jsPath);
        fileNameObject.base = null;
        fileNameObject.ext = '.ts';
        return path.format(fileNameObject);
    });
    if (tsPaths.length < scriptNodes.length) {
        const fileNameObject = path.parse(filePath);
        fileNameObject.base = null;
        fileNameObject.ext = '.ts';
        tsPaths.push(path.format(fileNameObject));
    }
    return { links, scripts: tsPaths };
}
//# sourceMappingURL=transfer-import.js.map