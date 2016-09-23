#!/usr/bin/env node

var fs = require('fs'),
    cp = require('child_process'),
    stringify = require('json-stable-stringify'),
    excludes = process.argv.slice(2),
    warnings = false,
    repo = process.env.npm_config_registry;

function warn(package, resolved) {
    if (!warnings) {
        console.log('\nWARNING: The following dependencies cannot be proxied. This may affect build stability.');
        warnings = true;
    }
    console.log('* ', package, '\n  ', resolved);
}

function recurse(deps, path) {
    for (var pkg in deps) {
        if (pkg === "npm") {
            // Transitive dependencies of npm are bundled with npm.
            continue;
        }
        var pkgPath = path ? path + '/' + pkg : pkg;
        var dep = deps[pkg];
        if (!dep.resolved
                || dep.resolved.indexOf(repo) == 0
                || dep.resolved.indexOf('https://registry.npmjs.org') == 0) {
            delete(dep.from);
            delete(dep.resolved);
        } else {
            warn(pkgPath, dep.resolved);
        }
        if (dep.dependencies) {
            recurse(dep.dependencies, pkgPath);
        }
    }
}

// Sort order for object properties in npm-shrinkwrap.json.
keyOrder = ["name", "version", "dependencies"];
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

function rewrite() {
    var file = JSON.parse(fs.readFileSync('npm-shrinkwrap.json', "utf8"));
    var dependencies = file.dependencies;
    for (var i in excludes) {
        delete(dependencies[excludes[i]]);
    }
    recurse(file.dependencies);
    json = stringify(file, { space: '  ', cmp: cmp });
    fs.writeFileSync('npm-shrinkwrap.json', json, { options: "utf8" });
}

rewrite();
if (warnings) {
    console.log();
}
