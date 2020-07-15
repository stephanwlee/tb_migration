#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path_1 = require("path");
const helper_1 = require("./helper");
const js_to_ts_1 = require("./js-to-ts");
const polymerelementify_1 = require("./polymerelementify");
const script_extract_1 = require("./script-extract");
const transfer_import_1 = require("./transfer-import");
const polymer_html_1 = require("./polymer-html");
const mkdirp = require('mkdirp');
const program = require('commander');
program
    .version('0.0.1')
    .option('-d, --dry-run', 'Dry run')
    .option('--out-dir <path>', 'Ouput directory')
    .parse(process.argv);
program.args.slice(0).forEach((dirName) => {
    const destDir = program.outDir || '/tmp/tbmigrate';
    const equal = path_1.normalize(dirName) === path_1.normalize(destDir);
    const workingDir = equal
        ? dirName
        : path_1.join(destDir, path_1.relative(process.cwd(), dirName));
    const destRelPath = path_1.relative(path_1.normalize(dirName), path_1.normalize(destDir));
    console.log(destRelPath);
    const exporter = helper_1.fs.getExporter(program.dryRun, destRelPath);
    if (!equal) {
        mkdirp.sync(workingDir);
        child_process_1.execSync(['cp', '-r', path_1.join(dirName, '*'), workingDir].join(' '));
    }
    op('.html', script_extract_1.transform)(exporter, workingDir);
    op('.html', js_to_ts_1.transform)(exporter, workingDir);
    op('.ts', polymerelementify_1.transform)(exporter, workingDir);
    op('.html', transfer_import_1.transform)(exporter, workingDir);
    op('.html', polymer_html_1.transform)(exporter, workingDir);
});
function op(fileExt, transform) {
    return (exporter, dirName) => {
        const files = helper_1.fs
            .listdir(dirName)
            .filter((name) => path_1.extname(name) === fileExt);
        files.forEach((fileName) => {
            fileName = path_1.join(dirName, fileName);
            transform(fileName, helper_1.fs.readFile(fileName), exporter);
        });
    };
}
//# sourceMappingURL=cli.js.map