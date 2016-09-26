# Sealant

Sealant is a postshrinkwrap script for npm to ensure consistency in
npm-shrinkwrap.json. It has been tested with NPM 3.10.8.

## Overview

It modifies the npm-shrinkwrap.json file as follows:

* Remove URLs to the developer's registry. This allows npm-shrinkwrap.json files
  that refer to a caching npm proxy to be shared with developers who do not have
  access to the proxy.
* It sorts the dependencies in the npm-shrinkwrap.json to make it easier to
  read diffs when modifying the npm-shrinkwrap.json file.
* It removes the `from` field

## Usage

To use sealant:

Step 1: Add the following to your package.json:

    "scripts": {
        "postshrinkwrap": ".bin/sealant site-builder"
    },

Step 2: Add a devDependency on sealant:

    npm install --save-dev sealant

Step 3: Create an initial shrinkwrap file, that includes devDependencies:

    npm shrinkwrap --dev

This will create a new npm-shrinkwrap.json file. To maintain it, avoid managing
dependencies by editing the package.json. Instead, add and remove dependencies
using the npm install/uninstall commands, and be sure to include one of the
--save or --save-dev options.

It's important to specify the --dev option in step 3, because npm will only
update the npm-shrinkwrap.json file when adding or removing devDependencies if
the file already includes devDependencies. You'll already have already have
sealant as a devDependency from Step 2, so this will npm continues to update the
shrinkwrap file for devDependencies.
