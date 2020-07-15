"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findScripts = void 0;
function findScripts(node) {
    if (node.tagName === 'script')
        return [node];
    return (node.childNodes || []).reduce((result, node) => {
        result.push(...findScripts(node));
        return result;
    }, []);
}
exports.findScripts = findScripts;
//# sourceMappingURL=html-helper.js.map