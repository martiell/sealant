# Sealant

Sealant is a postshrinkwrap script for npm to reduce diff noise when
working with package-lock.json and npm-shrinkwrap.json files.
It reduces diff noise by rewriting package URLs in those files to
ensure they always refer to a public registry.

This also avoids leaking information about private registries in those
files because URL references to private registries are replaced with
URLs that reference public registries.

Sealant can also exclude packages from lock and shrinkwrap files.
This can be useful if a version of a depedency changes frequently
and/or is not managed using npm.

It has been tested with NPM 5.8.0.

## Usage

To use sealant:

Step 1: Add the following to your package.json:

    "scripts": {
        "postshrinkwrap": "sealant"
    },

Optionally, add the name of any dependencies to be excluded from the
package-lock.json or npm-shrinkwrap.json file as arguments to sealant.

Step 2: Add a devDependency on sealant:

    npm install --save-dev sealant
