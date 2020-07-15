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
exports.updateSource = void 0;
const ts = __importStar(require("typescript"));
function updateSource(sourceFile, update) {
    sourceFile = ts.updateSourceFileNode(sourceFile, update);
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const tempFile = ts.createSourceFile(sourceFile.fileName, '', ts.ScriptTarget.Latest, 
    /*setParentNodes*/ false, ts.ScriptKind.TS);
    const result = printer.printNode(ts.EmitHint.Unspecified, sourceFile, tempFile);
    return ts.createSourceFile(sourceFile.fileName, result, ts.ScriptTarget.Latest, 
    /*setParentNodes*/ false, ts.ScriptKind.TS);
}
exports.updateSource = updateSource;
//# sourceMappingURL=ts-helper.js.map