#!/usr/bin/env node

const   fs = require('fs-extra'),
        execSync = require('child_process').execSync,
        minimist = require('minimist'),
        { exit } = require('process'),

        epub = require('./../package').epub,
        epubcheck = require('./../package').epubcheck,
        bookname = epub.directories.epub + '/' + epub.metadata.filename,
        testCommand = 'java -jar bin/epubcheck-' + epubcheck + '/epubcheck.jar ' + bookname,
        zipMimetype = 'cd ' + epub.directories.includes + ' && zip -0Xq ' + '../' + bookname + ' mimetype',
        zipRest = 'cd ' + epub.directories.destination + ' && zip -Xr9Dq ' + '../' + bookname + ' *',
        args = minimist(process.argv.slice(2));



const main = async () => {
    if (args.v) {
        console.log('Commands:');
        console.log('Zip Mimetype: ' + zipMimetype);
        console.log('Zip Remainder: ' + zipRest);
        console.log('Epub check: ' + testCommand);
    }

    if (args.c) {
        clean();
    }
    if (args.b) {
        build();
    }

    if (args.t) {
        test();
    }
}

function clean() {
    fs.removeSync(epub.directories.epub);
    exit(0);
}

function test() {
    execSync(testCommand, {stdio: 'inherit'});

    exit(0);
}

function build() {
    fs.ensureDirSync(epub.directories.epub);
    execSync(zipMimetype);
    execSync(zipRest);

    exit(0);
}

main();


