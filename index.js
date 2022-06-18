'use strict';

// Get our requirements, installed by npm
const Metalsmith  = require('metalsmith'),
    markdown    = require('@metalsmith/markdown'),
    layouts     = require('@metalsmith/layouts'),
    collections = require('@metalsmith/collections'),
    discoverPartials = require('metalsmith-discover-partials'),
    discoverHelpers = require('metalsmith-discover-helpers'),
    //postcss = require('metalsmith-with-postcss'),
    include    = require('metalsmith-include-files'),
    mime = require('mime-types'),
    nodepath = require('node:path'),
    fs = require('fs'),
    { DateTime } = require('luxon'),
    //concat = require('metalsmith-concat'),
    epub = require('./package').epub,
    directory = 'OEBPS';

function newFiles(files, metalsmith) {
    // This is going to be creating toc.ncx and add layout: ncx.hbs as frontmatter
    /*let newFilePath = directory + '/toc.ncx',
        fileObject = {
            layout: 'ncx.hbs',
            mode: '0664',
            path: newFilePath,
            contents: Buffer.from('', 'utf8')
        };

    files[newFilePath] = fileObject;/*
    /*
    {
  order: 0,
  collection: [ 'spine', 'guide' ],
  title: 'Table of Contents',
  layout: 'toc.hbs',
  contents: <Buffer >,
  mode: '0664',
  stats: Stats {
    dev: 16777225,
    mode: 33204,
    nlink: 1,
    uid: 501,
    gid: 20,
    rdev: 0,
    blksize: 4096,
    ino: 119219392,
    size: 88,
    blocks: 8,
    atimeMs: 1655329939031.4592,
    mtimeMs: 1655327291330.785,
    ctimeMs: 1655327291330.785,
    birthtimeMs: 1415000808000,
    atime: 2022-06-15T21:52:19.031Z,
    mtime: 2022-06-15T21:08:11.331Z,
    ctime: 2022-06-15T21:08:11.331Z,
    birthtime: 2014-11-03T07:46:48.000Z
  },
  path: 'OEBPS/toc.xhtml',
  mime: 'application/xhtml+xml',
  type: 'toc',
  property: 'nav',
  id: 'toc',
  link: 'toc.xhtml'
}
*/
}

function sortOrder(a, b) {
    let aNum, bNum

    aNum = +a.order
    bNum = +b.order

    // Test for NaN
    if (aNum != aNum && bNum != bNum) return 0
        if (aNum != aNum) return 1
            if (bNum != bNum) return -1

    // Normal comparison, want lower numbers first
    if (aNum > bNum) return 1
        if (bNum > aNum) return -1
            return 0
}

function updatePackage(files, metalsmith) {
    let packageName = 'package.opf',
        packagePath = directory + '/' + packageName,
        packageFile = files[packagePath];

    packageFile['items'] = [];

    Object.keys(files).forEach(path => {
        if (path === packagePath) {
            // We're not wanting the file itself in there
            return;
        }
        if (path.includes('container.xml')) {
            // Also don't want the container here
            return;
        }

        let file = files[path],
            item = {
                'id': file['id'],
                'link': file['link'],
                'mime': file['mime']
            };

        if (file['property'] !== 'undefined') {
            item.property = file['property'];
        }
        // manifest
        packageFile['items'].push(item);
    });
}

function attachMetadata(files, metalsmith) {
    let date = DateTime.utc();
    date = date.set({milliseconds: 0})
    metalsmith.metadata().modified = date.toISO({suppressMilliseconds: true});

    console.log(metalsmith.metadata().modified);
    Object.keys(files).forEach(path => {
        let basename = nodepath.basename(path),
            id = basename,
            mimeType = mime.lookup(path),
            ext = nodepath.extname(path).replace(/^\./, '');

        files[path]['mime'] = mimeType;
        if (basename.startsWith('toc')) {

            if (ext === 'ncx') {
                id = 'ncx';
            } else {
                id = 'toc';
                files[path]['type'] = 'toc';
                files[path]['property'] = 'nav';
            }
        }

        files[path]['id'] = id;

        if (basename.startsWith('cover')) {
            if (mimeType.includes('image')) {
                files[path]['property'] = 'cover-image';
            } else {
                files[path]['type'] = 'cover';
            }
        }

        files[path]['link'] = path.replace(directory + '/', '');
    });

}

function renameFiles(files, metalsmith) {
    Object.keys(files).forEach(path => {
        let newName = path;

        if (path.includes('package')) {
            newName = directory + '/package.opf';
        } else if (path.includes('toc.ncx')) {
            newName = directory + '/toc.ncx';
        } else if (path.includes('text') || path.includes('toc')) {
            newName = path.replace('.html', '.xhtml');
        }

        if (newName !== path) {
            files[newName] = files[path];
            files[newName]['path'] = newName;
            delete files[path];
        }
        /*let basename = nodepath.basename(path);
        let suffix = nodepath.extname(path).replace(/^\./, '');

        console.log(basename);
        console.log(suffix);*/
        //console.log(files[path]);
    });
    //console.log(metalsmith.metadata().collections.updates);

}

function check(files, metalsmith) {

    Object.keys(files).forEach(path => {
        console.log(path);
        /*let basename = nodepath.basename(path);
        let suffix = nodepath.extname(path).replace(/^\./, '');

        console.log(basename);
        console.log(suffix);*/
        console.log(files[path]);
    });
    //console.log(metalsmith.metadata());

}

// Run Metalsmith in the current directory.
// When the .build() method runs, this reads
// and strips the frontmatter from each of our
// source files and passes it on to the plugins.
Metalsmith(__dirname)
    .metadata(epub.metadata)
    //.source('./' + epub.directory.source)            // source directory
    //.destination('./'  + epub.directory.destination)     // destination directory
    .source(epub.directories.source)            // source directory
    .destination(epub.directories.destination)     // destination directory
    .clean(true)                // clean destination before
    .ignore('**/*.DS_Store')
    .use(newFiles)
    // Use @metalsmith/markdown to convert
    // our source files' content from markdown
    // to HTML fragments.
    .use(markdown())
    .use(renameFiles)
    .use(collections({
        assets: 'OEBPS/assets/**/*',
        spine: {
            sortBy: sortOrder,
            refer: false
        },
        guide: {
            sortBy: sortOrder,
            refer: false
        }
    }))
    .use(attachMetadata)
    .use(updatePackage)
    /*.use(include({
        'META-INF': [
            'include/META-INF/*'
        ]
    }))*/
    //.use(check)

    .use(discoverHelpers())
    .use(discoverPartials({
        directory: 'templates/partials',
        pattern: /\.hbs$/
    }))
    // Put the HTML fragments from the step above
    // into our template, using the Frontmatter
    // properties as template variables.
    .use(layouts({
        pattern: [
            '**/*.html',
            '**/*.xhtml',
            '**/*.ncx',
            '**/*.opf',
        ],
        directory: 'templates'
    }))
    // And tell Metalsmith to fire it all off.
    .build(function(err, files) {
        if (err) { throw err; }
    });
