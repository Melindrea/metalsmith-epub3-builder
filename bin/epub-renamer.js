'use strict';

module.exports = plugin;
function plugin(options) {
    options = options || {};
    let directory = options.directory || 'OEBPS';

    return function(files, metalsmith, done) {
        setImmediate(done);
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
        });
    }
}
