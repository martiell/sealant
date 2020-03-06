#!/usr/bin/env node

const baseUri = 'https://registry.npmjs.org/';
const fs = require('fs'),
    path = require('path'),
    url = require('url'),
    util = require('util'),
    stringify = require('es6-json-stable-stringify'),
    excludes = process.argv.slice(2);

const readFile = util.promisify(fs.readFile);
const stat = util.promisify(fs.stat);
const writeFile = util.promisify(fs.writeFile);

/**
 * Returns the path of a package relative to the root of the repository.
 * @param {String} uri The URI of a package (tgz) file in the repository.
 */
function packagePath(uri) {
    const parsedUrl = url.parse(uri);
    const pathSegments = parsedUrl.path.split(path.sep);
    const scoped =
      (pathSegments.length >= 4) &&
      (pathSegments[pathSegments.length - 4].startsWith('@'));
    const numSegments = scoped ? 4 : 3;
    const packagePath = pathSegments.slice(pathSegments.length - numSegments);
    return path.join.apply(null, packagePath);
}

/**
 * Returns the path of a package relative to the base repository URL.
 * @param {String} uri The URI of a package (tgz) file in the repository.
 */
function normalise(uri) {
    const p = packagePath(uri);
    return baseUri + p;
}

function recurse(deps, path) {
    for (var pkg in deps) {
        var pkgPath = path ? path + '/' + pkg : pkg;
        var dep = deps[pkg];
        if (dep.resolved) {
            var normalised = normalise(dep.resolved);
            dep.resolved = normalised;
        } else if (!dep.bundled) {
            console.log(`No resolved property for ${pkgPath}`)
        }
        if (dep.dependencies) {
            recurse(dep.dependencies, pkgPath);
        }
    }
}

function rewrite(lockfile) {
    var dependencies = lockfile.dependencies;
    for (var i in excludes) {
        delete(dependencies[excludes[i]]);
    }
    recurse(lockfile.dependencies);
}

// Sort order for object properties in npm-shrinkwrap.json.
keyOrder = [
    'name',
    'version',
    'lockfileVersion',
    'bundled',
    'optional',
    'resolved',
    'integrity',
    'dev',
    'requires',
    'dependencies'
];
function cmp(a, b) {
    var i = keyOrder.indexOf(a.key),
        j = keyOrder.indexOf(b.key);

    if (i >= 0 && j >= 0) {
        return i - j;
    } else if (i * j < 0) {
        return j - i;
    }
    return a.key < b.key ? -1 : 1;
}

async function rewriteLockFile(filename) {
    var inputFile = await readFile(filename, 'utf8');
    var lockfile = JSON.parse(inputFile);
    rewrite(lockfile);
    var outputFile = stringify(lockfile, { space: '  ', comparator: cmp }) + '\n';
    if (inputFile !== outputFile) {
        console.log(`Updating URLs in ${filename}`);
        await writeFile(filename, outputFile, { options: 'utf8' });
    }
}

async function findLockFile() {
    const paths = [
        'npm-shrinkwrap.json',
        'package-lock.json'
    ];
    for (var path of paths) {
        var p = await stat(path)
          .then(() => path)
          .catch(() => null);
        if (p) {
            return p;
        }
    }
    return null;
}

async function run() {
    const dir = process.env['SEALANT_DIR']
    if (dir) {
        process.chdir(dir);
    }
    const lockfile = await findLockFile();
    rewriteLockFile(lockfile);
}

run().catch(e => {
    console.log(e)
    process.exit(1);
});
