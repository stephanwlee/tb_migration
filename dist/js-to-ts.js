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
const path = __importStar(require("path"));
const helper_1 = require("./helper");
const html_helper_1 = require("./html-helper");
const parse5 = require('parse5');
function transform(fileName, sourceContent, exporter) {
    const node = parse5.parse(sourceContent);
    const html = node.childNodes.find((node) => node.tagName === 'html');
    const scriptNodes = html_helper_1.findScripts(html);
    const externalScripts = scriptNodes.filter((node) => {
        return (node.tagName === 'script' &&
            !node.childNodes.length &&
            node.attrs.length &&
            node.attrs.find(({ name }) => name === 'src'));
    });
    externalScripts.forEach((script) => {
        const srcVal = script.attrs.find(({ name }) => name === 'src').value;
        if (path.extname(srcVal) !== '.js') {
            console.warn(`[WARN] "src" of script does not end with .js. ${srcVal}`);
            return;
        }
        const jsPath = path.resolve(path.dirname(fileName), srcVal);
        const fileNameObject = path.parse(jsPath);
        fileNameObject.base = null;
        fileNameObject.ext = '.ts';
        const tsPath = path.format(fileNameObject);
        if (helper_1.fs.hasFile(jsPath) && helper_1.fs.hasFile(tsPath)) {
            console.warn(`[WARN] Both TypeScript and JavaScript with the same file name exists. ${jsPath}`);
        }
        else if (helper_1.fs.hasFile(jsPath)) {
            exporter.rename(jsPath, tsPath);
        }
    });
}
exports.transform = transform;
//# sourceMappingURL=js-to-ts.js.map