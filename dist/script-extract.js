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
const parse5 = require('parse5');
function transform(fileName, sourceContent, exporter) {
    const node = parse5.parse(sourceContent);
    const html = node.childNodes.find((node) => node.tagName === 'html');
    const mainModuleName = path.basename(fileName, '.html');
    const scriptNodes = html_helper_1.findScripts(html);
    const hasMainModuleScript = scriptNodes.some((node) => {
        return (node.attrs.length &&
            node.attrs.some((attr) => {
                return attr.name === 'src' && attr.value === mainModuleName + '.js';
            }));
    });
    const bodyfulScripts = scriptNodes.filter((node) => {
        return (node.tagName === 'script' && !node.attrs.length && node.childNodes.length);
    });
    if (hasMainModuleScript && bodyfulScripts.length) {
        console.warn('Invariance violated: JavaScript/TypeScript with the same filename detected. Do not know where to put the content of script tag:', fileName);
        return;
    }
    if (!bodyfulScripts.length) {
        return;
    }
    const content = bodyfulScripts
        .map((node) => {
        return node.childNodes
            .filter((node) => node.nodeName === '#text')
            .map((node) => node.value)
            .join('\n');
    })
        .join('\n');
    const newFileName = mainModuleName + '.ts';
    const sourceFile = ts.createSourceFile(newFileName, content, ts.ScriptTarget.ES2015, 
    /*setParentNodes */ true);
    const newFilePath = path.join(path.dirname(fileName), newFileName);
    exporter.writeFile(newFilePath, [helper_1.getPreamble(content), '\n', sourceFile.getText()].join('\n'));
}
exports.transform = transform;
//# sourceMappingURL=script-extract.js.map