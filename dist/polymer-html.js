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
const ts_helper_1 = require("./ts-helper");
const parse5 = require('parse5');
const Kind = ts.SyntaxKind;
function changeExt(filePath, ext) {
    const fileObject = path.parse(filePath);
    fileObject.base = null;
    fileObject.ext = ext;
    return path.format(fileObject);
}
function getDomModules(sourceContent) {
    const node = parse5.parse(sourceContent);
    const html = node.childNodes.find((node) => node.tagName === 'html');
    const body = html.childNodes.find((node) => node.tagName === 'body');
    const domModules = (body ? body.childNodes : []).filter((node) => {
        return (node.tagName === 'dom-module' &&
            node.attrs.find((attr) => attr.name === 'id'));
    });
    return domModules
        .map((node) => {
        const id = node.attrs.find((attr) => attr.name === 'id').value;
        const templateNode = node.childNodes.find((node) => node.tagName === 'template');
        if (!templateNode) {
            console.warn('<dom-module> does not contain any <template>');
            return;
        }
        const template = parse5.serialize(templateNode.content).trim();
        return { id, template };
    })
        .filter(Boolean);
}
function findDomModuleStatement(node, moduleId) {
    return node.statements.find((statement) => {
        return (ts.isClassDeclaration(statement) &&
            statement.decorators &&
            statement.decorators.find((decorator) => {
                if (!ts.isCallExpression(decorator.expression))
                    return false;
                if (!ts.isIdentifier(decorator.expression.expression))
                    return false;
                if (decorator.expression.expression.text !== 'customElement')
                    return false;
                return decorator.expression.arguments.some((exp) => {
                    return ts.isStringLiteral(exp) && exp.text === moduleId;
                });
            }));
    });
}
function transform(filePath, sourceContent, exporter) {
    const domModules = getDomModules(sourceContent);
    const mainTsPath = changeExt(filePath, '.ts');
    let sourceFile = ts.createSourceFile(mainTsPath, helper_1.fs.readFile(mainTsPath), ts.ScriptTarget.ES2015, 
    /*setParentNodes */ true);
    const replacements = new Map();
    domModules.forEach((mod) => {
        const { id, template } = mod;
        const statement = findDomModuleStatement(sourceFile, id);
        if (!statement) {
            console.warn(`Could not find a Polymer subclass for dom-module id: ${id}`);
            return;
        }
        const newProp = ts.createProperty(undefined, [
            ts.createModifier(Kind.StaticKeyword),
            ts.createModifier(Kind.ReadonlyKeyword),
        ], 'template', undefined, undefined, ts.createTaggedTemplate(ts.createIdentifier('html'), ts.createNoSubstitutionTemplateLiteral(template)));
        const newStatement = ts.getMutableClone(statement);
        newStatement.members = ts.createNodeArray([newProp, ...statement.members]);
        replacements.set(statement, newStatement);
    });
    const statements = sourceFile.statements.map((statement) => replacements.get(statement) || statement);
    const update = ts.setTextRange(ts.createNodeArray(statements), sourceFile.statements);
    sourceFile = ts_helper_1.updateSource(sourceFile, update);
    const result = helper_1.getPreamble(sourceContent) + sourceFile.getText();
    exporter.writeFile(mainTsPath, result);
}
exports.transform = transform;
//# sourceMappingURL=polymer-html.js.map