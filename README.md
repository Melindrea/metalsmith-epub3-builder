# README

This is a project for building epubs from assets like images and CSS, with the core texts of the book in markdown with frontmatter in yaml and project details in package.json.

It uses metalsmith to build the html (which can also be used to do things with the images, CSS and any JS, but is not in this version) and `zip` as well as java to compile the ebook from the built source. 

For now, the way to install it is to clone the project, though I'm hoping that a version 2.0 will be able to hide away some more of the code to make it easier to focus on the writing and styling and less on what's under the hood.

## Compile vs build

I will be using these two words a lot on the readme. They are separated in meaning in this document because the under-the-hood commands involved (most of which a user should never need to worry about) differ.

### Build

The build process is the process of taking the markdown files in `files/src` and the handlebars templates in `files/templates` and using Metalsmith and pure NodeJS to create a `build` directory with xhtml, CSS, images and (maybe) javascript.

### Compile

The compile process, on the other hand, is taking valid epub sources from the `build` directory (as well as mimetype from `include`) and turning it into an epub in the `epub` directory. That directory is not included in the git repo, so if you want to keep any given version of the book you'll need to version and copy it to somewhere else. 

The compile process uses the `bin/_commands.js` file to clean the epub directory, zip up the files (using execSync to run the zip-command rather than any node wrapper since the epub-format is a bit testy) and validate the finished file with the bundled epubcheck (which requires java). 

## File structure

At it's core it has 3 directories with files and a few project files in the root, with a few more directories that are explicitly ignored in the git file.

### index.js

This file has the build process. It uses Metalsmith and while it at it's core has no support for CSS/JS/images (apart from copying the files over to the build directory), but any of that can be added into the chain. I wanted to keep the base focused on what's necessary for the epub.

### Read-only directories (bin & include)

Bin has the `_commands.js` file that compiles the epub, as well as the bundled epubchecker and the two plugins used by this setup.

Include contains the file `mimetype` which has the mimetype of the epub. It needs to have only that, and also needs to be the very first file in the epub (which is really just a glorified zipfile).

### Special files

Inside Files (detailed further down) a set of six files are a bit special and deserve mention before going into the meat of the files.

* package.md is empty apart from the layout (special/package.hbs), and neither of those should be touched
* toc.ncx.md is also empty apart from the layout (special/ncx.hbs) and like the one above, neither should be touched
* toc.md is the file for building the table of contents, with the template being toc.hbs. The collections and order should stay as-is, but the title can be changed, and if you want to make a fancier table of content, then the toc.hbs file can be changed around.

### Files

This is the main directory users are likely to need to deal with. It has two directories, where `src` contains the assets and xhtml, and `templates` contains the handlebars templates and any partials or helpers.

#### src

META-INF and OEBPS are the two directories you find immediately in files/src. The first one contains the container.xml. Unless you know you need to mess with the container.xml file, don't. The reason I'm still putting it into the src is that there are valid reasons to touch it, so I don't want to hide it away where it can't be found if one needs to.

OEBPS is named after the older format (Open eBook Publication Structure) that ePub superceded, and while it could in theory be changed, in practice the name of the directory is used in a few places in the code, and it's a fairly standard name.

Insided OEBPS we have the aforementioned package.md, toc.md and toc.ncx.md and two directories.

While the assets directory should stay named such, the folders inside of it can be changed. As long as you in the templates (detailed further down) match the structure, you can change it around.

The `text` directory has the meat of the epub. When blank it has one cover.md file and one chapter-1.md file. The cover.md file should be kept more-or-less as is (with the title being changable), but the xhtml for the cover is found (and should be edited) in templates/cover.hbs.

##### Chapter-1.md

This is an example file on how to make a section. This specific one uses the `templates/chapter.hbs` template, but as long as you link it correctly that doesn't matter. The name can be changed (though I do recommend keeping it as `section-number.md`, for simplicity).

The frontmatter has a few important things:
* order: A number that says which order it is in. On the generated spine the cover has order -1 and the table of contents order 0, so that any sections can start at count one
* collection: If you need to have more collections see cover.md for how to define that, but anything that should be in the table of contents needs to be in the spine collection
* layout: Can be changed if you prefer a different layout name
* isContent: Should be set to true on all the files in text except cover (it has to do with the table of contents)
* title: Recommended to keep the key, but the content will depend on the file

For any other frontmatter keys, you can add what's needed for your templates, just as any other markdown-with-frontmatter file.

If you have an item that should be in the spine but isn't technically linear (say a table or chart), then you can add the frontmatter key `nonlinear: true`.

#### Templates

This is where you stick all of your templates. It uses handlebars (which is close to Mustache). Any partials goes into the templates/partials directory and any helpers in the templates/helpers directory.

I've put all of the base templates directly into the templates directory (with the "special" ones getting their own to be more out-of-sight), but you can change around where you put the templates, as long as they're referenced correctly in the markdown files that use them.

## Metadata

There are a few places to find specific metadata for the project and files. Any file-specific will be in frontmatter, and the things that are for the entire project will be in `package.json`.

The relevant key is "epub", which has two objects. You don't really need to worry too much about "directories" (it's used to remove hard-coded directories), but the "metadata" key has information you'll need to fill out, such as filename, creator/author, any publisher(s).

The mandatory metadata items are:
* unique-id (which also needs to match an identifier)
* document-title (which is named such to separate the overarching title from any chapter titles)
* language
* filename

## Commands

If you look at the package.json scripts you'll get the specific commands, but here's the npm-run versions:

* npm run test: checks the epub against the epub checker
* npm run clean: removes the old epub
* npm run compile: runs the cleaner, compiles the epub and then runs the test
* npm run build: builds the xhtml for the epub
* npm run epub: runs the build task, and then runs the compile task.
* npm start: a simple server (see below)

Run the build task while working on the xhtml/CSS/etc. You can either open the files in your browser of choice, or use the built-in server. The built-in server serves the files in build/OEBPS and can be reached via http://127.0.0.1:8080.

Run either compile or epub when you want to get the epub. If you haven't changed anything in the sources, then I suggest running compile, since that doesn't delete and rebuild the build file. The epub will be the name given in epub.metadata.filename, and be in the epub directory.

If you really want to see the under-the-hood commands of the epubchecker and zipping, run `node bin/_commands -v`.
