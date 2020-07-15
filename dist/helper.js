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
exports.renameExt = exports.fs = exports.Exporter = exports.getPreamble = exports.TS_LICENSE = void 0;
const ts = __importStar(require("typescript"));
const fs_1 = require("fs");
const path_1 = require("path");
const chalk = require('chalk');
const mkdirp = require('mkdirp');
exports.TS_LICENSE = `/* Copyright 2020 The TensorFlow Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/
`;
function getPreamble(content) {
    const range = ts.getLeadingCommentRanges(content, 0);
    const preamble = range
        ? range.map(({ pos, end }) => content.slice(pos, end)).join('\n')
        : exports.TS_LICENSE;
    return preamble + '\n';
}
exports.getPreamble = getPreamble;
function centerText(text, character = '=', fillAll = false) {
    const prettyText = text.length ? ' ' + text + ' ' : '';
    const padding = (process.stdout.columns || 40) - prettyText.length;
    if (padding <= 0) {
        return text;
    }
    const leftPad = Math.floor(padding / 2);
    const rightPad = Math.ceil(padding / 2);
    if (fillAll) {
        const left = Array(leftPad)
            .fill(character)
            .join('');
        const right = Array(rightPad)
            .fill(character)
            .join('');
        return `${left}${prettyText}${right}`;
    }
    else {
        const left = leftPad > 1
            ? character +
                Array(leftPad - 1)
                    .fill(' ')
                    .join('')
            : character;
        const right = rightPad > 1
            ? Array(rightPad - 1)
                .fill(' ')
                .join('') + character
            : character;
        return `${left}${prettyText}${right}`;
    }
}
class Exporter {
    constructor(logContents, destDir, write, rename) {
        this.logContents = false;
        this.logContents = logContents;
        this.destDir = destDir;
        this.writer = write;
        this.renamer = rename;
    }
    writeFile(fileName, content) {
        const destFilePath = path_1.resolve(this.destDir, fileName);
        if (this.logContents) {
            console.log(`
${chalk.blue(centerText('File Write', undefined, true))}
${chalk.blue(centerText(destFilePath, undefined, false))}
${chalk.blue(centerText('', '=', true))}
${content}
${chalk.blue(centerText('', '<', true))}`);
        }
        this.writer(destFilePath, content);
    }
    rename(srcPath, destPath) {
        if (this.logContents) {
            console.log(`
${chalk.yellow(centerText('File Rename', undefined, true))}
${chalk.yellow(centerText(`${srcPath} -> ${destPath}`, undefined, false))}
${chalk.yellow(centerText('', '=', true))}`);
        }
        this.renamer(srcPath, destPath);
    }
}
exports.Exporter = Exporter;
class FileSystem {
    constructor() {
        this.cache = new Map();
    }
    getExporter(dryRun, destDir) {
        return new Exporter(dryRun, destDir, dryRun
            ? (path, content) => {
                path = path_1.resolve(path);
                this.cache.set(path, content);
            }
            : (path, content) => {
                this.writeFile(path, content);
            }, dryRun
            ? (srcPath, destPath) => {
                this.cache.set(destPath, this.readFile(srcPath));
                this.cache.delete(srcPath);
            }
            : this.renameFile);
    }
    readFile(filePath) {
        filePath = path_1.resolve(filePath);
        if (this.cache.has(filePath)) {
            return this.cache.get(filePath);
        }
        if (!this.hasFile(filePath)) {
            return '';
        }
        const content = fs_1.readFileSync(filePath).toString();
        this.cache.set(filePath, content);
        return content;
    }
    listdir(dirName) {
        const files = fs_1.readdirSync(dirName).concat(Array.from(this.cache.keys())
            .filter((filePath) => path_1.dirname(filePath) === dirName)
            .map((filePath) => path_1.basename(filePath)));
        return Array.from(new Set(files)).sort();
    }
    hasFile(filePath) {
        filePath = path_1.resolve(filePath);
        try {
            return this.cache.has(filePath) || Boolean(fs_1.statSync(filePath));
        }
        catch (e) {
            return false;
        }
    }
    writeFile(filePath, content) {
        filePath = path_1.resolve(filePath);
        this.cache.set(filePath, content);
        mkdirp.sync(path_1.dirname(filePath));
        fs_1.writeFileSync(filePath, content);
    }
    renameFile(srcPath, destPath) {
        fs_1.renameSync(srcPath, destPath);
        this.cache.set(destPath, this.readFile(srcPath));
        this.cache.delete(srcPath);
    }
}
exports.fs = new FileSystem();
function renameExt(fileName, newExt) {
    const pathObj = path_1.parse(fileName);
    pathObj.base = null;
    pathObj.ext = newExt;
    return path_1.format(pathObj);
}
exports.renameExt = renameExt;
//# sourceMappingURL=helper.js.map