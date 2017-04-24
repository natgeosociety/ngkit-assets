/*eslint-disable valid-jsdoc*/
'use strict';

/**
 * The `kss/generator/handlebars` module loads the kssHandlebarsGenerator
 * object, a `{@link KssGenerator}` object using Handlebars templating.
 * ```
 * var kssHandlebarsGenerator = require('kss/generator/handlebars');
 * ```
 * @module kss/generator/handlebars
 */
var kssHandlebarsGenerator = require('kss/generator/handlebars'),
  KssSection = require('kss/lib/kss_section.js'),
  fs = require('fs'),
  glob = require('glob'),
  marked = require('marked'),
  path = require('path'),
  wrench = require('wrench');

// Pass a string to KssGenerator() to tell the system which API version is
// implemented by kssSectionGenerator.
console.log(kssHandlebarsGenerator);
var kssSectionGenerator = kssHandlebarsGenerator;


/**
 * Generate the HTML files of the style guide given a KssStyleguide object.
 *
 * @alias module:kss/generator/handlebars.generate
 * @param {KssStyleguide} styleguide The KSS style guide in object format.
 */
kssSectionGenerator.generate = function(styleguide, cb) {
  var sections = styleguide.section(),
    sectionCount = sections.length,
    sectionRoots = [],
    rootCount,
    currentRoot,
    childSections = [],
    partials = {},
    partial,
    files = [],
    i,
    key;

  console.log(styleguide.data.files.map(function(file) {
    return ' - ' + file;
  }).join('\n'));

  // Throw an error if no KSS sections are found in the source files.
  if (sectionCount === 0) {
    throw new Error('No KSS documentation discovered in source files.');
  }

  console.log('...Determining section markup:');

  for (i = 0; i < sectionCount; i += 1) {
    // Register all the markup blocks as Handlebars partials.
    if (sections[i].markup()) {
      partial = {
        name: sections[i].reference(),
        reference: sections[i].reference(),
        file: '',
        markup: sections[i].markup(),
        data: {}
      };
      // If the markup is a file path, attempt to load the file.
      if (partial.markup.match(/^[^\n]+\.(html|hbs)$/)) {
        partial.file = partial.markup;
        partial.name = path.basename(partial.file, path.extname(partial.file));
        files = [];
        for (key in this.config.source) {
          if (!files.length) {
            files = glob.sync(this.config.source[key] + '/**/' + partial.file);
          }
        }
        // If the markup file is not found, note that in the style guide.
        if (!files.length) {
          partial.markup += ' NOT FOUND!';
        }
        console.log(' - ' + partial.reference + ': ' + partial.markup);
        if (files.length) {
          // Load the partial's markup from file.
          partial.file = files[0];
          partial.markup = fs.readFileSync(partial.file, 'utf8');
          // Load sample data for the partial from the sample .json file.
          if (fs.existsSync(path.dirname(partial.file) + '/' + partial.name + '.json')) {
            try {
              partial.data = require(path.dirname(partial.file) + '/' + partial.name + '.json');
            } catch (e) {
              partial.data = {};
            }
          }
        }
      } else {
        console.log(' - ' + partial.reference + ': inline markup');
      }
      // Register the partial using the filename (without extension) or using
      // the style guide reference.
      this.Handlebars.registerPartial(partial.name, partial.markup);
      // Save the name of the partial and its data for retrieval in the markup
      // helper, where we only know the reference.
      partials[partial.reference] = {
        name: partial.name,
        data: partial.data
      };
    }

    // Accumulate all of the sections' first indexes
    // in case they don't have a root element.
    currentRoot = sections[i].reference().split(/(?:\.|\ \-\ )/)[0];
    if (sectionRoots.indexOf(currentRoot) === -1) {
      sectionRoots.push(currentRoot);
    }
  }

  console.log('...Generating style guide sections:');

  // Now, group all of the sections by their root
  // reference, and make a page for each.
  rootCount = sectionRoots.length;
  for (i = 0; i < rootCount; i += 1) {
    childSections = styleguide.section(sectionRoots[i] + '.x');
    for (var j = 0; j < childSections.length; j += 1){
      var grandChildSections = styleguide.section(childSections[j] + '.*');
      if (childSections[j])
        this.generatePage(styleguide, grandChildSections, childSections[j].reference(), sectionRoots, partials);
      else
        console.log("HUH?", sectionRoots[i]);

    }
  }

  // Generate the homepage.
  childSections = [];
  this.generatePage(styleguide, childSections, 'styleguide.homepage', sectionRoots, partials);
};

/**
 * Renders the handlebars template for a section and saves it to a file.
 *
 * @alias module:kss/generator/handlebars.generatePage
 * @param {KssStyleguide} styleguide The KSS style guide in object format.
 * @param {Array} sections An array of KssSection objects.
 * @param {string} root The current section's reference.
 * @param {Array} sectionRoots An array of section references for all sections at the root of the style guide.
 * @param {Object} partials A hash of the names and data of the registered Handlebars partials.
 */
kssSectionGenerator.generatePage = function(styleguide, sections, root, sectionRoots, partials) {
  var filename = '', files,
    homepageText = false,
    styles = '',
    scripts = '',
    customFields = this.config.custom,
    key;

  if (root === 'styleguide.homepage') {
    filename = 'index.html';
    console.log(' - homepage');
    // Ensure homepageText is a non-false value.
    for (key in this.config.source) {
      if (!homepageText) {
        try {
          files = glob.sync(this.config.source[key] + '/**/' + this.config.homepage);
          if (files.length) {
            homepageText = ' ' + marked(fs.readFileSync(files[0], 'utf8'));
          }
        } catch (e) {
          // empty
        }
      }
    }
    if (!homepageText) {
      homepageText = ' ';
      console.log('   ...no homepage content found in ' + this.config.homepage + '.');
    }
  } else {
    filename = 'section-' + KssSection.prototype.encodeReferenceURI(root) + '.html';
    console.log(
      ' - section ' + root + ' [',
      styleguide.section(root) ? styleguide.section(root).header() : 'Unnamed',
      ']'
    );
  }
  // Create the HTML to load the optional CSS and JS.
  /*eslint-disable guard-for-in*/
  for (key in this.config.css) {
    styles = styles + '<link rel="stylesheet" href="' + this.config.css[key] + '">\n';
  }
  for (key in this.config.js) {
    scripts = scripts + '<script src="' + this.config.js[key] + '"></script>\n';
  }
  /*eslint-enable guard-for-in*/

  /*eslint-disable key-spacing*/
  fs.writeFileSync(this.config.destination + '/' + filename,
    this.template({
      partials:     partials,
      styleguide:   styleguide,
      sectionRoots: sectionRoots,
      sections:     sections.map(function(section) {
        return section.toJSON(customFields);
      }),
      rootName:     root,
      options:      this.config || {},
      homepage:     homepageText,
      styles:       styles,
      scripts:      scripts
    })
  );
  /*eslint-enable key-spacing*/
};

module.exports = kssSectionGenerator;
