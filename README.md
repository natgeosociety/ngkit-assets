# NGKIT ASSETS [![NPM version](https://badge.fury.io/js/education.svg)](https://npmjs.org/package/education) [![Build Status](https://travis-ci.org/NGFieldScope/education.svg?branch=master)](https://travis-ci.org/NGFieldScope/education)

> ngkit-assets web site

###  project dependencies
This Project has dependencies, that are included with the installation;


* [icon-society](https://github.com/natgeosociety/icon-society/) custom icons
* [ngkit](https://github.com/natgeosociety/ngkit) modified uikit for NG
* [ngkit](https://github.com/natgeosociety/ngkit) global data for NG projects such as logos, headers and footers.
* [jquery]() 2.0 or later included for sprite building - we can remove if conflict


### Installing

Typically you would use [bower](http://bower.io/) to install this package. You
can view the latest [package releases](https://github.com/natgeosociety/ngkit-assets/releases)
to determine the version to install. So if version 1.0 was the latest release:

```
$ bower install git@github.com:natgeosociety/ngkit-assets.git#X-X -S

```
You can use fuzzy tags (e.g. `2.x`, `0.2.x`) or a specific version (e.g. `0.2.0`).

## bower include stracture

``` json
{
  "dependencies": {
    "ngkit-assets": "git@github.com:natgeosociety/ngkit-assets.git#0.1.x"
  }
}
```

## Usage


1. **Including styles**
  - for `.css` make certain that the `ngkit.css` is referenced in your `.html` file:
    ```html
    <head>
        <link rel="stylesheet" href="PATH/ngkit/dist/css/ngkit.min.css">
    </head>
    ```
  - for `.scss`  make certain that the `/ngkit-assets/ngkit/src/themes/dotorg/ngkit.scss` is referenced in you main `.scss` file
     ```scss
         @import "../path/to/icon-society"

     ```
2. **Including js**
  - for `.js` make certain that the `ngkit/dist/js/ngkit.min.js.js` is referenced in your `.html` file:
    ```html
    <head>
        <link rel="stylesheet" href="PATH/ngkit/dist/js/ngkit.min.js">
    </head>
    ```
  - for `.scss`  make certain that the `ngkit/dist/js/ngkit.min.js.js` is referenced in you main `.scss` file
     ```scss
         @import "../path/to/icon-society"

     ```

3. **The Old way**

Go to the [releases](https://github.com/natgeosociety/ngkit-assets/releases) page and download the a recent zip file.


## Dist

`/ngkit-assets/ngkit/dist` folder includes the fonts, js, images, styles. 

## Styleguide

TBD 

## License


<sub>Proprietary © [Nolawi Petros](https://github.com/natgeosociety/ngkit-assets)</sub>

<sub><sub>If you have questions, please email Corey `coreyoordt@gmail.com` OR Nolawi `nolawi.petros@gmail.com.`</sub><sub>




