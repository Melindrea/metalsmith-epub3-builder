'use strict';

const { DateTime } = require('luxon'),
      mime = require('mime-types'),
      nodepath = require('node:path');

module.exports = plugin;
function plugin(options) {
    options = options || {};

    let directory = options.directory || 'OEBPS',
        packageName = options.packageName || 'package.opf',
        packagePath = directory + '/' + packageName,

        date = DateTime.utc();

    return function(files, metalsmith, done) {
        setImmediate(done);

        // This adds the modified date
        date = date.set({milliseconds: 0})
        metalsmith.metadata().modified = date.toISO({suppressMilliseconds: true});
        let packageFile = files[packagePath];
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
            let basename = nodepath.basename(path),
                id = basename,
                mimeType = mime.lookup(path),
                ext = nodepath.extname(path).replace(/^\./, ''),
                file = files[path],
                item = {},
                link = path.replace(directory + '/', '');

            files[path]['mime'] = mimeType;
            item.mime = mimeType;

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
            item.id = id;

            if (basename.startsWith('cover')) {
                if (mimeType.includes('image')) {
                    files[path]['property'] = 'cover-image';
                } else {
                    files[path]['type'] = 'cover';
                }
            }


            files[path]['link'] = link;
            item.link = link;

            if (file['property'] !== 'undefined') {
                item.property = file['property'];
            }

            if (file['nonlinear'] !== 'undefined') {
                item.nonlinear = true;
            }

            // manifest
            packageFile['items'].push(item);
        });
    }
}
