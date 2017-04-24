// This optional file is used to load the CLI options and KSS generator needed
// by this template.
//
// The filename should follow standard node.js require() conventions. See
// http://nodejs.org/api/modules.html#modules_folders_as_modules It should
// either be named index.js or have its name set in the "main" property of the
// template's package.json.

var kssSectionGenerator;

try {
  // This require() line will always fail while testing a git clone of this
  // module. In order for a bundled template to be "kss-node clone"-able, it
  // must use the require('kss/generator/path') syntax (instead of requiring a
  // relative path). But, since this kss module has been git cloned and not
  // installed via npm, require('kss/anything') will always fail.
  kssSectionGenerator = require('kss/generator/section');
} catch (e) {
  kssSectionGenerator = require('../kss_section_generator.js');
}

// Tell kss-node which generator this template uses.
module.exports.generator = kssSectionGenerator;

// Tell kss-node which Yargs options this template has.
// See https://github.com/bcoe/yargs/blob/master/README.md#optionskey-opt
module.exports.options = {
  'title': {
    string: true,
    multiple: false,
    describe: 'The National Geographic Society Styleguide',
    default: 'National Geographic Style Guide'
  }
};
