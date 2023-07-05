"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const os = require("os");
const path = require("path");
const Platform_1 = require("./Platform");
function isDir(dirPath) {
    let stats;
    try {
        stats = fs.statSync(dirPath);
    }
    catch (err) {
    }
    return stats && stats.isDirectory() ? true : false;
}
exports.isDir = isDir;
function getAbsolutePath(dirPath) {
    if (path.isAbsolute(dirPath) || Platform_1.isWindows()) {
        return dirPath;
    }
    return dirPath[0] === '~' ? path.join(os.homedir(), dirPath.slice(1)) : path.resolve(dirPath);
}
exports.getAbsolutePath = getAbsolutePath;
function mkdirp(dirPath) {
    const normalizedPath = path.resolve(dirPath);
    try {
        fs.mkdirSync(normalizedPath);
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            mkdirp(path.dirname(normalizedPath));
            return mkdirp(normalizedPath);
        }
        if (isDir(normalizedPath)) {
            return;
        }
        throw err;
    }
}
function ensureDir(dirPath) {
    const normalizedPath = path.resolve(dirPath);
    if (isDir(normalizedPath)) {
        return;
    }
    mkdirp(normalizedPath);
}
exports.ensureDir = ensureDir;
function cleanupDir(targetDir) {
    let files = [];
    try {
        files = fs.readdirSync(targetDir);
    }
    catch (e) {
    }
    for (let i = 0; i < files.length; i++) {
        let filename = path.join(targetDir, files[i]);
        if (fs.statSync(filename).isFile()) {
            try {
                fs.unlinkSync(filename);
            }
            catch (e) {
            }
        }
        else {
            cleanupDir(filename);
        }
    }
    try {
        fs.rmdirSync(targetDir);
    }
    catch (e) {
    }
}
exports.cleanupDir = cleanupDir;
