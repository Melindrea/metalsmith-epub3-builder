'use strict';

// Get our requirements, installed by npm
const Metalsmith  = require('metalsmith'),
    markdown    = require('@metalsmith/markdown'),
    layouts     = require('@metalsmith/layouts'),
    collections = require('@metalsmith/collections'),
    discoverPartials = require('metalsmith-discover-partials'),
    discoverHelpers = require('metalsmith-discover-helpers'),
    epubRenamer = require('./bin/epub-renamer'),
    setupEpubFiles = require('./bin/setup-epub-files'),
    epub = require('./package').epub,
    directory = epub.directories.content;

// This is a simple sort order, which makes sure that -1 comes before 0
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

// Run Metalsmith in the current directory.
// When the .build() method runs, this reads
// and strips the frontmatter from each of our
// source files and passes it on to the plugins.
Metalsmith(__dirname)
    .metadata(epub.metadata)
    .source(epub.directories.source)            // source directory
    .destination(epub.directories.destination)     // destination directory
    .clean(true)                // clean destination before
    .ignore('**/*.DS_Store')
    // Use @metalsmith/markdown to convert
    // our source files' content from markdown
    // to HTML fragments.
    .use(markdown())
    // This renames the html and other files to the proper names.
    // There's a plugin that does something similar, but this is specific enough
    // that I wanted to roll my own.
    .use(epubRenamer({
        directory: directory // default is OEBPS, but this makes it a bit more flexible
    }))
    .use(collections({
        assets: directory + '/assets/**/*',
        spine: {
            sortBy: sortOrder,
            refer: false
        },
        guide: {
            sortBy: sortOrder,
            refer: false
        }
    }))
    // This adds meta data to files as well as gets the spine into the package.opt file.
    // It has to be after collections because it depends on that one
    .use(setupEpubFiles({
        directory: directory, // default is like epubRenamer
        packageName: 'package.opf' //this is the default, but I wanted explicitness
    }))
    .use(discoverHelpers({
        directory: epub.directories.templates + '/helpers',
        pattern: /\.js$/
    }))
    .use(discoverPartials({
        directory: epub.directories.templates + '/partials',
        pattern: /\.hbs$/
    }))
    // Put the HTML fragments from the step above
    // into our template, using the Frontmatter
    // properties as template variables.
    .use(layouts({
        pattern: [
            '**/*.xhtml',
            '**/*.ncx',
            '**/*.opf',
        ],
        directory: epub.directories.templates
    }))
    // And tell Metalsmith to fire it all off.
    .build(function(err, files) {
        if (err) { throw err; }
    });
