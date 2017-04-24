(function(core) {

    if (typeof define == "function" && define.amd) { // AMD

        define("ngkit", function(){

            var ngkit = window.NGkit || core(window, window.jQuery, window.document);

            ngkit.load = function(res, req, onload, config) {

                var resources = res.split(','), load = [], i, base = (config.config && config.config.ngkit && config.config.ngkit.base ? config.config.ngkit.base : "").replace(/\/+$/g, "");

                if (!base) {
                    throw new Error( "Please define base path to NGkit in the requirejs config." );
                }

                for (i = 0; i < resources.length; i += 1) {
                    var resource = resources[i].replace(/\./g, '/');
                    load.push(base+'/components/'+resource);
                }

                req(load, function() {
                    onload(ngkit);
                });
            };

            return ngkit;
        });
    }

    if (!window.jQuery) {
        throw new Error( "NGkit requires jQuery" );
    }

    if (window && window.jQuery) {
        core(window, window.jQuery, window.document);
    }


})(function(global, $, doc) {

    "use strict";

    var NG = {}, _NG = global.NGkit ? Object.create(global.NGkit) : undefined;

    NG.version = '2.26.3';

    NG.noConflict = function() {
        // restore NGkit version
        if (_NG) {
            global.NGkit = _NG;
            $.NGkit      = _NG;
            $.fn.ng      = _NG.fn;
        }

        return NG;
    };

    NG.prefix = function(str) {
        return str;
    };

    // cache jQuery
    NG.$ = $;

    NG.$doc  = NG.$(document);
    NG.$win  = NG.$(window);
    NG.$html = NG.$('html');

    NG.support = {};
    NG.support.transition = (function() {

        var transitionEnd = (function() {

            var element = doc.body || doc.documentElement,
                transEndEventNames = {
                    WebkitTransition : 'webkitTransitionEnd',
                    MozTransition    : 'transitionend',
                    OTransition      : 'oTransitionEnd otransitionend',
                    transition       : 'transitionend'
                }, name;

            for (name in transEndEventNames) {
                if (element.style[name] !== undefined) return transEndEventNames[name];
            }
        }());

        return transitionEnd && { end: transitionEnd };
    })();

    NG.support.animation = (function() {

        var animationEnd = (function() {

            var element = doc.body || doc.documentElement,
                animEndEventNames = {
                    WebkitAnimation : 'webkitAnimationEnd',
                    MozAnimation    : 'animationend',
                    OAnimation      : 'oAnimationEnd oanimationend',
                    animation       : 'animationend'
                }, name;

            for (name in animEndEventNames) {
                if (element.style[name] !== undefined) return animEndEventNames[name];
            }
        }());

        return animationEnd && { end: animationEnd };
    })();

    // requestAnimationFrame polyfill
    //https://github.com/darius/requestAnimationFrame
    (function() {

        Date.now = Date.now || function() { return new Date().getTime(); };

        var vendors = ['webkit', 'moz'];
        for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
            var vp = vendors[i];
            window.requestAnimationFrame = window[vp+'RequestAnimationFrame'];
            window.cancelAnimationFrame = (window[vp+'CancelAnimationFrame']
                                       || window[vp+'CancelRequestAnimationFrame']);
        }
        if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) // iOS6 is buggy
            || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
            var lastTime = 0;
            window.requestAnimationFrame = function(callback) {
                var now = Date.now();
                var nextTime = Math.max(lastTime + 16, now);
                return setTimeout(function() { callback(lastTime = nextTime); },
                                  nextTime - now);
            };
            window.cancelAnimationFrame = clearTimeout;
        }
    }());

    NG.support.touch = (
        ('ontouchstart' in document) ||
        (global.DocumentTouch && document instanceof global.DocumentTouch)  ||
        (global.navigator.msPointerEnabled && global.navigator.msMaxTouchPoints > 0) || //IE 10
        (global.navigator.pointerEnabled && global.navigator.maxTouchPoints > 0) || //IE >=11
        false
    );

    NG.support.mutationobserver = (global.MutationObserver || global.WebKitMutationObserver || null);

    NG.Utils = {};

    NG.Utils.isFullscreen = function() {
        return document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || document.fullscreenElement || false;
    };

    NG.Utils.str2json = function(str, notevil) {
        try {
            if (notevil) {
                return JSON.parse(str
                    // wrap keys without quote with valid double quote
                    .replace(/([\$\w]+)\s*:/g, function(_, $1){return '"'+$1+'":';})
                    // replacing single quote wrapped ones to double quote
                    .replace(/'([^']+)'/g, function(_, $1){return '"'+$1+'"';})
                );
            } else {
                return (new Function("", "var json = " + str + "; return JSON.parse(JSON.stringify(json));"))();
            }
        } catch(e) { return false; }
    };

    NG.Utils.debounce = function(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };

    NG.Utils.throttle = function (func, limit) {
        var wait = false;
        return function () {
            if (!wait) {
                func.call();
                wait = true;
                setTimeout(function () {
                    wait = false;
                }, limit);
            }
        }
    };

    NG.Utils.removeCssRules = function(selectorRegEx) {
        var idx, idxs, stylesheet, _i, _j, _k, _len, _len1, _len2, _ref;

        if(!selectorRegEx) return;

        setTimeout(function(){
            try {
              _ref = document.styleSheets;
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                stylesheet = _ref[_i];
                idxs = [];
                stylesheet.cssRules = stylesheet.cssRules;
                for (idx = _j = 0, _len1 = stylesheet.cssRules.length; _j < _len1; idx = ++_j) {
                  if (stylesheet.cssRules[idx].type === CSSRule.STYLE_RULE && selectorRegEx.test(stylesheet.cssRules[idx].selectorText)) {
                    idxs.unshift(idx);
                  }
                }
                for (_k = 0, _len2 = idxs.length; _k < _len2; _k++) {
                  stylesheet.deleteRule(idxs[_k]);
                }
              }
            } catch (_error) {}
        }, 0);
    };

    NG.Utils.isInView = function(element, options) {

        var $element = $(element);

        if (!$element.is(':visible')) {
            return false;
        }

        var window_left = NG.$win.scrollLeft(), window_top = NG.$win.scrollTop(), offset = $element.offset(), left = offset.left, top = offset.top;

        options = $.extend({topoffset:0, leftoffset:0}, options);

        if (top + $element.height() >= window_top && top - options.topoffset <= window_top + NG.$win.height() &&
            left + $element.width() >= window_left && left - options.leftoffset <= window_left + NG.$win.width()) {
          return true;
        } else {
          return false;
        }
    };

    NG.Utils.checkDisplay = function(context, initanimation) {

        var elements = NG.$('[data-ng-margin], [data-ng-grid-match], [data-ng-grid-margin], [data-ng-check-display]', context || document), animated;

        if (context && !elements.length) {
            elements = $(context);
        }

        elements.trigger('display.ng.check');

        // fix firefox / IE animations
        if (initanimation) {

            if (typeof(initanimation)!='string') {
                initanimation = '[class*="ng-animation-"]';
            }

            elements.find(initanimation).each(function(){

                var ele  = NG.$(this),
                    cls  = ele.attr('class'),
                    anim = cls.match(/ng\-animation\-(.+)/);

                ele.removeClass(anim[0]).width();

                ele.addClass(anim[0]);
            });
        }

        return elements;
    };

    NG.Utils.options = function(string) {

        if ($.type(string)!='string') return string;

        if (string.indexOf(':') != -1 && string.trim().substr(-1) != '}') {
            string = '{'+string+'}';
        }

        var start = (string ? string.indexOf("{") : -1), options = {};

        if (start != -1) {
            try {
                options = NG.Utils.str2json(string.substr(start));
            } catch (e) {}
        }

        return options;
    };

    NG.Utils.animate = function(element, cls) {

        var d = $.Deferred();

        element = NG.$(element);

        element.css('display', 'none').addClass(cls).one(NG.support.animation.end, function() {
            element.removeClass(cls);
            d.resolve();
        });

        element.css('display', '');

        return d.promise();
    };

    NG.Utils.uid = function(prefix) {
        return (prefix || 'id') + (new Date().getTime())+"RAND"+(Math.ceil(Math.random() * 100000));
    };

    NG.Utils.template = function(str, data) {

        var tokens = str.replace(/\n/g, '\\n').replace(/\{\{\{\s*(.+?)\s*\}\}\}/g, "{{!$1}}").split(/(\{\{\s*(.+?)\s*\}\})/g),
            i=0, toc, cmd, prop, val, fn, output = [], openblocks = 0;

        while(i < tokens.length) {

            toc = tokens[i];

            if(toc.match(/\{\{\s*(.+?)\s*\}\}/)) {
                i = i + 1;
                toc  = tokens[i];
                cmd  = toc[0];
                prop = toc.substring(toc.match(/^(\^|\#|\!|\~|\:)/) ? 1:0);

                switch(cmd) {
                    case '~':
                        output.push("for(var $i=0;$i<"+prop+".length;$i++) { var $item = "+prop+"[$i];");
                        openblocks++;
                        break;
                    case ':':
                        output.push("for(var $key in "+prop+") { var $val = "+prop+"[$key];");
                        openblocks++;
                        break;
                    case '#':
                        output.push("if("+prop+") {");
                        openblocks++;
                        break;
                    case '^':
                        output.push("if(!"+prop+") {");
                        openblocks++;
                        break;
                    case '/':
                        output.push("}");
                        openblocks--;
                        break;
                    case '!':
                        output.push("__ret.push("+prop+");");
                        break;
                    default:
                        output.push("__ret.push(escape("+prop+"));");
                        break;
                }
            } else {
                output.push("__ret.push('"+toc.replace(/\'/g, "\\'")+"');");
            }
            i = i + 1;
        }

        fn  = new Function('$data', [
            'var __ret = [];',
            'try {',
            'with($data){', (!openblocks ? output.join('') : '__ret = ["Not all blocks are closed correctly."]'), '};',
            '}catch(e){__ret = [e.message];}',
            'return __ret.join("").replace(/\\n\\n/g, "\\n");',
            "function escape(html) { return String(html).replace(/&/g, '&amp;').replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');}"
        ].join("\n"));

        return data ? fn(data) : fn;
    };

    NG.Utils.events       = {};
    NG.Utils.events.click = NG.support.touch ? 'tap' : 'click';

    global.NGkit = NG;

    // deprecated

    NG.fn = function(command, options) {

        var args = arguments, cmd = command.match(/^([a-z\-]+)(?:\.([a-z]+))?/i), component = cmd[1], method = cmd[2];

        if (!NG[component]) {
            $.error("NGkit component [" + component + "] does not exist.");
            return this;
        }

        return this.each(function() {
            var $this = $(this), data = $this.data(component);
            if (!data) $this.data(component, (data = NG[component](this, method ? undefined : options)));
            if (method) data[method].apply(data, Array.prototype.slice.call(args, 1));
        });
    };

    $.NGkit          = NG;
    $.fn.ng          = NG.fn;

    NG.langdirection = NG.$html.attr("dir") == "rtl" ? "right" : "left";

    NG.components    = {};

    NG.component = function(name, def) {

        var fn = function(element, options) {

            var $this = this;

            this.NGkit   = NG;
            this.element = element ? NG.$(element) : null;
            this.options = $.extend(true, {}, this.defaults, options);
            this.plugins = {};

            if (this.element) {
                this.element.data(name, this);
            }

            this.init();

            (this.options.plugins.length ? this.options.plugins : Object.keys(fn.plugins)).forEach(function(plugin) {

                if (fn.plugins[plugin].init) {
                    fn.plugins[plugin].init($this);
                    $this.plugins[plugin] = true;
                }

            });

            this.trigger('init.ng.component', [name, this]);

            return this;
        };

        fn.plugins = {};

        $.extend(true, fn.prototype, {

            defaults : {plugins: []},

            boot: function(){},
            init: function(){},

            on: function(a1,a2,a3){
                return NG.$(this.element || this).on(a1,a2,a3);
            },

            one: function(a1,a2,a3){
                return NG.$(this.element || this).one(a1,a2,a3);
            },

            off: function(evt){
                return NG.$(this.element || this).off(evt);
            },

            trigger: function(evt, params) {
                return NG.$(this.element || this).trigger(evt, params);
            },

            find: function(selector) {
                return NG.$(this.element ? this.element: []).find(selector);
            },

            proxy: function(obj, methods) {

                var $this = this;

                methods.split(' ').forEach(function(method) {
                    if (!$this[method]) $this[method] = function() { return obj[method].apply(obj, arguments); };
                });
            },

            mixin: function(obj, methods) {

                var $this = this;

                methods.split(' ').forEach(function(method) {
                    if (!$this[method]) $this[method] = obj[method].bind($this);
                });
            },

            option: function() {

                if (arguments.length == 1) {
                    return this.options[arguments[0]] || undefined;
                } else if (arguments.length == 2) {
                    this.options[arguments[0]] = arguments[1];
                }
            }

        }, def);

        this.components[name] = fn;

        this[name] = function() {

            var element, options;

            if (arguments.length) {

                switch(arguments.length) {
                    case 1:

                        if (typeof arguments[0] === "string" || arguments[0].nodeType || arguments[0] instanceof jQuery) {
                            element = $(arguments[0]);
                        } else {
                            options = arguments[0];
                        }

                        break;
                    case 2:

                        element = $(arguments[0]);
                        options = arguments[1];
                        break;
                }
            }

            if (element && element.data(name)) {
                return element.data(name);
            }

            return (new NG.components[name](element, options));
        };

        if (NG.domready) {
            NG.component.boot(name);
        }

        return fn;
    };

    NG.plugin = function(component, name, def) {
        this.components[component].plugins[name] = def;
    };

    NG.component.boot = function(name) {

        if (NG.components[name].prototype && NG.components[name].prototype.boot && !NG.components[name].booted) {
            NG.components[name].prototype.boot.apply(NG, []);
            NG.components[name].booted = true;
        }
    };

    NG.component.bootComponents = function() {

        for (var component in NG.components) {
            NG.component.boot(component);
        }
    };


    // DOM mutation save ready helper function

    NG.domObservers = [];
    NG.domready     = false;

    NG.ready = function(fn) {

        NG.domObservers.push(fn);

        if (NG.domready) {
            fn(document);
        }
    };

    NG.on = function(a1,a2,a3){

        if (a1 && a1.indexOf('ready.ng.dom') > -1 && NG.domready) {
            a2.apply(NG.$doc);
        }

        return NG.$doc.on(a1,a2,a3);
    };

    NG.one = function(a1,a2,a3){

        if (a1 && a1.indexOf('ready.ng.dom') > -1 && NG.domready) {
            a2.apply(NG.$doc);
            return NG.$doc;
        }

        return NG.$doc.one(a1,a2,a3);
    };

    NG.trigger = function(evt, params) {
        return NG.$doc.trigger(evt, params);
    };

    NG.domObserve = function(selector, fn) {

        if(!NG.support.mutationobserver) return;

        fn = fn || function() {};

        NG.$(selector).each(function() {

            var element  = this,
                $element = NG.$(element);

            if ($element.data('observer')) {
                return;
            }

            try {

                var observer = new NG.support.mutationobserver(NG.Utils.debounce(function(mutations) {
                    fn.apply(element, []);
                    $element.trigger('changed.ng.dom');
                }, 50), {childList: true, subtree: true});

                // pass in the target node, as well as the observer options
                observer.observe(element, { childList: true, subtree: true });

                $element.data('observer', observer);

            } catch(e) {}
        });
    };

    NG.init = function(root) {

        root = root || document;

        NG.domObservers.forEach(function(fn){
            fn(root);
        });
    };

    NG.on('domready.ng.dom', function(){

        NG.init();

        if (NG.domready) NG.Utils.checkDisplay();
    });

    document.addEventListener('DOMContentLoaded', function(){

        var domReady = function() {

            NG.$body = NG.$('body');

            NG.trigger('beforeready.ng.dom');

            NG.component.bootComponents();

            // custom scroll observer
            requestAnimationFrame((function(){

                var memory = {dir: {x:0, y:0}, x: window.pageXOffset, y:window.pageYOffset};

                var fn = function(){
                    // reading this (window.page[X|Y]Offset) causes a full page recalc of the layout in Chrome,
                    // so we only want to do this once
                    var wpxo = window.pageXOffset;
                    var wpyo = window.pageYOffset;

                    // Did the scroll position change since the last time we were here?
                    if (memory.x != wpxo || memory.y != wpyo) {

                        // Set the direction of the scroll and store the new position
                        if (wpxo != memory.x) {memory.dir.x = wpxo > memory.x ? 1:-1; } else { memory.dir.x = 0; }
                        if (wpyo != memory.y) {memory.dir.y = wpyo > memory.y ? 1:-1; } else { memory.dir.y = 0; }

                        memory.x = wpxo;
                        memory.y = wpyo;

                        // Trigger the scroll event, this could probably be sent using memory.clone() but this is
                        // more explicit and easier to see exactly what is being sent in the event.
                        NG.$doc.trigger('scrolling.ng.document', [{
                            "dir": {"x": memory.dir.x, "y": memory.dir.y}, "x": wpxo, "y": wpyo
                        }]);
                    }

                    requestAnimationFrame(fn);
                };

                if (NG.support.touch) {
                    NG.$html.on('touchmove touchend MSPointerMove MSPointerUp pointermove pointerup', fn);
                }

                if (memory.x || memory.y) fn();

                return fn;

            })());

            // run component init functions on dom
            NG.trigger('domready.ng.dom');

            if (NG.support.touch) {

                // remove css hover rules for touch devices
                // NG.Utils.removeCssRules(/\.ng-(?!navbar).*:hover/);

                // viewport unit fix for ng-height-viewport - should be fixed in iOS 8
                if (navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {

                    NG.$win.on('load orientationchange resize', NG.Utils.debounce((function(){

                        var fn = function() {
                            $('.ng-height-viewport').css('height', window.innerHeight);
                            return fn;
                        };

                        return fn();

                    })(), 100));
                }
            }

            NG.trigger('afterready.ng.dom');

            // mark that domready is left behind
            NG.domready = true;

            // auto init js components
            if (NG.support.mutationobserver) {

                var initFn = NG.Utils.debounce(function(){
                    requestAnimationFrame(function(){ NG.init(document.body);});
                }, 10);

                (new NG.support.mutationobserver(function(mutations) {

                    var init = false;

                    mutations.every(function(mutation){

                        if (mutation.type != 'childList') return true;

                        for (var i = 0, node; i < mutation.addedNodes.length; ++i) {

                            node = mutation.addedNodes[i];

                            if (node.outerHTML && node.outerHTML.indexOf('data-ng-') !== -1) {
                                return (init = true) && false;
                            }
                        }
                        return true;
                    });

                    if (init) initFn();

                })).observe(document.body, {childList: true, subtree: true});
            }
        };

        if (document.readyState == 'complete' || document.readyState == 'interactive') {
            setTimeout(domReady);
        }

        return domReady;

    }());

    // add touch identifier class
    NG.$html.addClass(NG.support.touch ? "ng-touch" : "ng-notouch");

    // add ng-hover class on tap to support overlays on touch devices
    if (NG.support.touch) {

        var hoverset = false,
            exclude,
            hovercls = 'ng-hover',
            selector = '.ng-overlay, .ng-overlay-hover, .ng-overlay-toggle, .ng-animation-hover, .ng-has-hover';

        NG.$html.on('mouseenter touchstart MSPointerDown pointerdown', selector, function() {

            if (hoverset) $('.'+hovercls).removeClass(hovercls);

            hoverset = $(this).addClass(hovercls);

        }).on('mouseleave touchend MSPointerUp pointerup', function(e) {

            exclude = $(e.target).parents(selector);

            if (hoverset) {
                hoverset.not(exclude).removeClass(hovercls);
            }
        });
    }

    return NG;
});


//  Based on Zeptos touch.js
//  https://raw.github.com/madrobby/zepto/master/src/touch.js
//  Zepto.js may be freely distributed under the MIT license.

;(function($){

  if ($.fn.swipeLeft) {
    return;
  }


  var touch = {}, touchTimeout, tapTimeout, swipeTimeout, longTapTimeout, longTapDelay = 750, gesture;

  function swipeDirection(x1, x2, y1, y2) {
    return Math.abs(x1 - x2) >= Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down');
  }

  function longTap() {
    longTapTimeout = null;
    if (touch.last) {
      if ( touch.el !== undefined ) touch.el.trigger('longTap');
      touch = {};
    }
  }

  function cancelLongTap() {
    if (longTapTimeout) clearTimeout(longTapTimeout);
    longTapTimeout = null;
  }

  function cancelAll() {
    if (touchTimeout)   clearTimeout(touchTimeout);
    if (tapTimeout)     clearTimeout(tapTimeout);
    if (swipeTimeout)   clearTimeout(swipeTimeout);
    if (longTapTimeout) clearTimeout(longTapTimeout);
    touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null;
    touch = {};
  }

  function isPrimaryTouch(event){
    return event.pointerType == event.MSPOINTER_TYPE_TOUCH && event.isPrimary;
  }

  $(function(){
    var now, delta, deltaX = 0, deltaY = 0, firstTouch;

    if ('MSGesture' in window) {
      gesture = new MSGesture();
      gesture.target = document.body;
    }

    $(document)
      .on('MSGestureEnd gestureend', function(e){

        var swipeDirectionFromVelocity = e.originalEvent.velocityX > 1 ? 'Right' : e.originalEvent.velocityX < -1 ? 'Left' : e.originalEvent.velocityY > 1 ? 'Down' : e.originalEvent.velocityY < -1 ? 'Up' : null;

        if (swipeDirectionFromVelocity && touch.el !== undefined) {
          touch.el.trigger('swipe');
          touch.el.trigger('swipe'+ swipeDirectionFromVelocity);
        }
      })
      // MSPointerDown: for IE10
      // pointerdown: for IE11
      .on('touchstart MSPointerDown pointerdown', function(e){

        if(e.type == 'MSPointerDown' && !isPrimaryTouch(e.originalEvent)) return;

        firstTouch = (e.type == 'MSPointerDown' || e.type == 'pointerdown') ? e : e.originalEvent.touches[0];

        now      = Date.now();
        delta    = now - (touch.last || now);
        touch.el = $('tagName' in firstTouch.target ? firstTouch.target : firstTouch.target.parentNode);

        if(touchTimeout) clearTimeout(touchTimeout);

        touch.x1 = firstTouch.pageX;
        touch.y1 = firstTouch.pageY;

        if (delta > 0 && delta <= 250) touch.isDoubleTap = true;

        touch.last = now;
        longTapTimeout = setTimeout(longTap, longTapDelay);

        // adds the current touch contact for IE gesture recognition
        if (gesture && ( e.type == 'MSPointerDown' || e.type == 'pointerdown' || e.type == 'touchstart' ) ) {
          gesture.addPointer(e.originalEvent.pointerId);
        }

      })
      // MSPointerMove: for IE10
      // pointermove: for IE11
      .on('touchmove MSPointerMove pointermove', function(e){

        if (e.type == 'MSPointerMove' && !isPrimaryTouch(e.originalEvent)) return;

        firstTouch = (e.type == 'MSPointerMove' || e.type == 'pointermove') ? e : e.originalEvent.touches[0];

        cancelLongTap();
        touch.x2 = firstTouch.pageX;
        touch.y2 = firstTouch.pageY;

        deltaX += Math.abs(touch.x1 - touch.x2);
        deltaY += Math.abs(touch.y1 - touch.y2);
      })
      // MSPointerUp: for IE10
      // pointerup: for IE11
      .on('touchend MSPointerUp pointerup', function(e){

        if (e.type == 'MSPointerUp' && !isPrimaryTouch(e.originalEvent)) return;

        cancelLongTap();

        // swipe
        if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) || (touch.y2 && Math.abs(touch.y1 - touch.y2) > 30)){

          swipeTimeout = setTimeout(function() {
            if ( touch.el !== undefined ) {
              touch.el.trigger('swipe');
              touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)));
            }
            touch = {};
          }, 0);

        // normal tap
        } else if ('last' in touch) {

          // don't fire tap when delta position changed by more than 30 pixels,
          // for instance when moving to a point and back to origin
          if (isNaN(deltaX) || (deltaX < 30 && deltaY < 30)) {
            // delay by one tick so we can cancel the 'tap' event if 'scroll' fires
            // ('tap' fires before 'scroll')
            tapTimeout = setTimeout(function() {

              // trigger universal 'tap' with the option to cancelTouch()
              // (cancelTouch cancels processing of single vs double taps for faster 'tap' response)
              var event = $.Event('tap');
              event.cancelTouch = cancelAll;
              if ( touch.el !== undefined ) touch.el.trigger(event);

              // trigger double tap immediately
              if (touch.isDoubleTap) {
                if ( touch.el !== undefined ) touch.el.trigger('doubleTap');
                touch = {};
              }

              // trigger single tap after 250ms of inactivity
              else {
                touchTimeout = setTimeout(function(){
                  touchTimeout = null;
                  if ( touch.el !== undefined ) touch.el.trigger('singleTap');
                  touch = {};
                }, 250);
              }
            }, 0);
          } else {
            touch = {};
          }
          deltaX = deltaY = 0;
        }
      })
      // when the browser window loses focus,
      // for example when a modal dialog is shown,
      // cancel all ongoing events
      .on('touchcancel MSPointerCancel', cancelAll);

    // scrolling the window indicates intention of the user
    // to scroll, not tap or swipe, so cancel all ongoing events
    $(window).on('scroll', cancelAll);
  });

  ['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown', 'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(function(eventName){
    $.fn[eventName] = function(callback){ return $(this).on(eventName, callback); };
  });
})(jQuery);


(function(NG) {

    "use strict";

    var stacks = [];

    NG.component('stackMargin', {

        defaults: {
            cls: 'ng-margin-small-top',
            rowfirst: false,
            observe: false
        },

        boot: function() {

            // init code
            NG.ready(function(context) {

                NG.$("[data-ng-margin]", context).each(function() {

                    var ele = NG.$(this);

                    if (!ele.data("stackMargin")) {
                        NG.stackMargin(ele, NG.Utils.options(ele.attr("data-ng-margin")));
                    }
                });
            });
        },

        init: function() {

            var $this = this;

            NG.$win.on('resize orientationchange', (function() {

                var fn = function() {
                    $this.process();
                };

                NG.$(function() {
                    fn();
                    NG.$win.on("load", fn);
                });

                return NG.Utils.debounce(fn, 20);
            })());

            this.on("display.ng.check", function(e) {
                if (this.element.is(":visible")) this.process();
            }.bind(this));

            if (this.options.observe) {

                NG.domObserve(this.element, function(e) {
                    if ($this.element.is(":visible")) $this.process();
                });
            }

            stacks.push(this);
        },

        process: function() {

            var $this = this, columns = this.element.children();

            NG.Utils.stackMargin(columns, this.options);

            if (!this.options.rowfirst || !columns.length) {
                return this;
            }

            // Mark first column elements
            var group = {}, minleft = false;

            columns.removeClass(this.options.rowfirst).each(function(offset, $ele){

                $ele = NG.$(this);

                if (this.style.display != 'none') {
                    offset = $ele.offset().left;
                    ((group[offset] = group[offset] || []) && group[offset]).push(this);
                    minleft = minleft === false ? offset : Math.min(minleft, offset);
                }
            });

            NG.$(group[minleft]).addClass(this.options.rowfirst);

            return this;
        }

    });


    // responsive element e.g. iframes

    (function(){

        var elements = [], check = function(ele) {

            if (!ele.is(':visible')) return;

            var width  = ele.parent().width(),
                iwidth = ele.data('width'),
                ratio  = (width / iwidth),
                height = Math.floor(ratio * ele.data('height'));

            ele.css({'height': (width < iwidth) ? height : ele.data('height')});
        };

        NG.component('responsiveElement', {

            defaults: {},

            boot: function() {

                // init code
                NG.ready(function(context) {

                    NG.$("iframe.ng-responsive-width, [data-ng-responsive]", context).each(function() {

                        var ele = NG.$(this), obj;

                        if (!ele.data("responsiveElement")) {
                            obj = NG.responsiveElement(ele, {});
                        }
                    });
                });
            },

            init: function() {

                var ele = this.element;

                if (ele.attr('width') && ele.attr('height')) {

                    ele.data({

                        'width' : ele.attr('width'),
                        'height': ele.attr('height')

                    }).on('display.ng.check', function(){
                        check(ele);
                    });

                    check(ele);

                    elements.push(ele);
                }
            }
        });

        NG.$win.on('resize load', NG.Utils.debounce(function(){

            elements.forEach(function(ele){
                check(ele);
            });

        }, 15));

    })();



    // helper

    NG.Utils.stackMargin = function(elements, options) {

        options = NG.$.extend({
            'cls': 'ng-margin-small-top'
        }, options);

        elements = NG.$(elements).removeClass(options.cls);

        var min = false;

        elements.each(function(offset, height, pos, $ele){

            $ele   = NG.$(this);

            if ($ele.css('display') != 'none') {

                offset = $ele.offset();
                height = $ele.outerHeight();
                pos    = offset.top + height;

                $ele.data({
                    'ngMarginPos': pos,
                    'ngMarginTop': offset.top
                });

                if (min === false || (offset.top < min.top) ) {

                    min = {
                        top  : offset.top,
                        left : offset.left,
                        pos  : pos
                    };
                }
            }

        }).each(function($ele) {

            $ele   = NG.$(this);

            if ($ele.css('display') != 'none' && $ele.data('ngMarginTop') > min.top && $ele.data('ngMarginPos') > min.pos) {
                $ele.addClass(options.cls);
            }
        });
    };

    NG.Utils.matchHeights = function(elements, options) {

        elements = NG.$(elements).css('min-height', '');
        options  = NG.$.extend({ row : true }, options);

        var matchHeights = function(group){

            if (group.length < 2) return;

            var max = 0;

            group.each(function() {
                max = Math.max(max, NG.$(this).outerHeight());
            }).each(function() {

                var element = NG.$(this),
                    height  = max - (element.css('box-sizing') == 'border-box' ? 0 : (element.outerHeight() - element.height()));

                element.css('min-height', height + 'px');
            });
        };

        if (options.row) {

            elements.first().width(); // force redraw

            setTimeout(function(){

                var lastoffset = false, group = [];

                elements.each(function() {

                    var ele = NG.$(this), offset = ele.offset().top;

                    if (offset != lastoffset && group.length) {

                        matchHeights(NG.$(group));
                        group  = [];
                        offset = ele.offset().top;
                    }

                    group.push(ele);
                    lastoffset = offset;
                });

                if (group.length) {
                    matchHeights(NG.$(group));
                }

            }, 0);

        } else {
            matchHeights(elements);
        }
    };

    (function(cacheSvgs){

        NG.Utils.inlineSvg = function(selector, root) {

            var images = NG.$(selector || 'img[src$=".svg"]', root || document).each(function(){

                var img = NG.$(this),
                    src = img.attr('src');

                if (!cacheSvgs[src]) {

                    var d = NG.$.Deferred();

                    NG.$.get(src, {nc: Math.random()}, function(data){
                        d.resolve(NG.$(data).find('svg'));
                    });

                    cacheSvgs[src] = d.promise();
                }

                cacheSvgs[src].then(function(svg) {

                    var $svg = NG.$(svg).clone();

                    if (img.attr('id')) $svg.attr('id', img.attr('id'));
                    if (img.attr('class')) $svg.attr('class', img.attr('class'));
                    if (img.attr('style')) $svg.attr('style', img.attr('style'));

                    if (img.attr('width')) {
                        $svg.attr('width', img.attr('width'));
                        if (!img.attr('height'))  $svg.removeAttr('height');
                    }

                    if (img.attr('height')){
                        $svg.attr('height', img.attr('height'));
                        if (!img.attr('width')) $svg.removeAttr('width');
                    }

                    img.replaceWith($svg);
                });
            });
        };

        // init code
        NG.ready(function(context) {
            NG.Utils.inlineSvg('[data-ng-svg]', context);
        });

    })({});

})(NGkit);


(function(NG) {

    "use strict";

    NG.component('smoothScroll', {

        boot: function() {

            // init code
            NG.$html.on("click.smooth-scroll.ngkit", "[data-ng-smooth-scroll]", function(e) {
                var ele = NG.$(this);

                if (!ele.data("smoothScroll")) {
                    var obj = NG.smoothScroll(ele, NG.Utils.options(ele.attr("data-ng-smooth-scroll")));
                    ele.trigger("click");
                }

                return false;
            });
        },

        init: function() {

            var $this = this;

            this.on("click", function(e) {
                e.preventDefault();
                scrollToElement(NG.$(this.hash).length ? NG.$(this.hash) : NG.$("body"), $this.options);
            });
        }
    });

    function scrollToElement(ele, options) {

        options = NG.$.extend({
            duration: 1000,
            transition: 'easeOutExpo',
            offset: 0,
            complete: function(){}
        }, options);

        // get / set parameters
        var target    = ele.offset().top - options.offset,
            docheight = NG.$doc.height(),
            winheight = window.innerHeight;

        if ((target + winheight) > docheight) {
            target = docheight - winheight;
        }

        // animate to target, fire callback when done
        NG.$("html,body").stop().animate({scrollTop: target}, options.duration, options.transition).promise().done(options.complete);
    }

    NG.Utils.scrollToElement = scrollToElement;

    if (!NG.$.easing.easeOutExpo) {
        NG.$.easing.easeOutExpo = function(x, t, b, c, d) { return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b; };
    }

})(NGkit);


(function(NG) {

    "use strict";

    var $win           = NG.$win,
        $doc           = NG.$doc,
        scrollspies    = [],
        checkScrollSpy = function() {
            for(var i=0; i < scrollspies.length; i++) {
                window.requestAnimationFrame.apply(window, [scrollspies[i].check]);
            }
        };

    NG.component('scrollspy', {

        defaults: {
            "target"     : false,
            "cls"        : "ng-scrollspy-inview",
            "initcls"    : "ng-scrollspy-init-inview",
            "topoffset"  : 0,
            "leftoffset" : 0,
            "repeat"     : false,
            "delay"      : 0
        },

        boot: function() {

            // listen to scroll and resize
            $doc.on("scrolling.ng.document", checkScrollSpy);
            $win.on("load resize orientationchange", NG.Utils.debounce(checkScrollSpy, 50));

            // init code
            NG.ready(function(context) {

                NG.$("[data-ng-scrollspy]", context).each(function() {

                    var element = NG.$(this);

                    if (!element.data("scrollspy")) {
                        var obj = NG.scrollspy(element, NG.Utils.options(element.attr("data-ng-scrollspy")));
                    }
                });
            });
        },

        init: function() {

            var $this = this, inviewstate, initinview, togglecls = this.options.cls.split(/,/), fn = function(){

                var elements     = $this.options.target ? $this.element.find($this.options.target) : $this.element,
                    delayIdx     = elements.length === 1 ? 1 : 0,
                    toggleclsIdx = 0;

                elements.each(function(idx){

                    var element     = NG.$(this),
                        inviewstate = element.data('inviewstate'),
                        inview      = NG.Utils.isInView(element, $this.options),
                        toggle      = element.data('ngScrollspyCls') || togglecls[toggleclsIdx].trim();

                    if (inview && !inviewstate && !element.data('scrollspy-idle')) {

                        if (!initinview) {
                            element.addClass($this.options.initcls);
                            $this.offset = element.offset();
                            initinview = true;

                            element.trigger("init.ng.scrollspy");
                        }

                        element.data('scrollspy-idle', setTimeout(function(){

                            element.addClass("ng-scrollspy-inview").toggleClass(toggle).width();
                            element.trigger("inview.ng.scrollspy");

                            element.data('scrollspy-idle', false);
                            element.data('inviewstate', true);

                        }, $this.options.delay * delayIdx));

                        delayIdx++;
                    }

                    if (!inview && inviewstate && $this.options.repeat) {

                        if (element.data('scrollspy-idle')) {
                            clearTimeout(element.data('scrollspy-idle'));
                            element.data('scrollspy-idle', false);
                        }

                        element.removeClass("ng-scrollspy-inview").toggleClass(toggle);
                        element.data('inviewstate', false);

                        element.trigger("outview.ng.scrollspy");
                    }

                    toggleclsIdx = togglecls[toggleclsIdx + 1] ? (toggleclsIdx + 1) : 0;

                });
            };

            fn();

            this.check = fn;

            scrollspies.push(this);
        }
    });


    var scrollspynavs = [],
        checkScrollSpyNavs = function() {
            for(var i=0; i < scrollspynavs.length; i++) {
                window.requestAnimationFrame.apply(window, [scrollspynavs[i].check]);
            }
        };

    NG.component('scrollspynav', {

        defaults: {
            "cls"          : 'ng-active',
            "closest"      : false,
            "topoffset"    : 0,
            "leftoffset"   : 0,
            "smoothscroll" : false
        },

        boot: function() {

            // listen to scroll and resize
            $doc.on("scrolling.ng.document", checkScrollSpyNavs);
            $win.on("resize orientationchange", NG.Utils.debounce(checkScrollSpyNavs, 50));

            // init code
            NG.ready(function(context) {

                NG.$("[data-ng-scrollspy-nav]", context).each(function() {

                    var element = NG.$(this);

                    if (!element.data("scrollspynav")) {
                        var obj = NG.scrollspynav(element, NG.Utils.options(element.attr("data-ng-scrollspy-nav")));
                    }
                });
            });
        },

        init: function() {

            var ids     = [],
                links   = this.find("a[href^='#']").each(function(){ if(this.getAttribute("href").trim()!=='#') ids.push(this.getAttribute("href")); }),
                targets = NG.$(ids.join(",")),

                clsActive  = this.options.cls,
                clsClosest = this.options.closest || this.options.closest;

            var $this = this, inviews, fn = function(){

                inviews = [];

                for (var i=0 ; i < targets.length ; i++) {
                    if (NG.Utils.isInView(targets.eq(i), $this.options)) {
                        inviews.push(targets.eq(i));
                    }
                }

                if (inviews.length) {

                    var navitems,
                        scrollTop = $win.scrollTop(),
                        target = (function(){
                            for(var i=0; i< inviews.length;i++){
                                if(inviews[i].offset().top >= scrollTop){
                                    return inviews[i];
                                }
                            }
                        })();

                    if (!target) return;

                    if ($this.options.closest) {
                        links.blur().closest(clsClosest).removeClass(clsActive);
                        navitems = links.filter("a[href='#"+target.attr("id")+"']").closest(clsClosest).addClass(clsActive);
                    } else {
                        navitems = links.removeClass(clsActive).filter("a[href='#"+target.attr("id")+"']").addClass(clsActive);
                    }

                    $this.element.trigger("inview.ng.scrollspynav", [target, navitems]);
                }
            };

            if (this.options.smoothscroll && NG.smoothScroll) {
                links.each(function(){
                    NG.smoothScroll(this, $this.options.smoothscroll);
                });
            }

            fn();

            this.element.data("scrollspynav", this);

            this.check = fn;
            scrollspynavs.push(this);

        }
    });

})(NGkit);


(function(NG){

    "use strict";

    var toggles = [];

    NG.component('toggle', {

        defaults: {
            target    : false,
            cls       : 'ng-hidden',
            animation : false,
            duration  : 200
        },

        boot: function(){

            // init code
            NG.ready(function(context) {

                NG.$("[data-ng-toggle]", context).each(function() {
                    var ele = NG.$(this);

                    if (!ele.data("toggle")) {
                        var obj = NG.toggle(ele, NG.Utils.options(ele.attr("data-ng-toggle")));
                    }
                });

                setTimeout(function(){

                    toggles.forEach(function(toggle){
                        toggle.getToggles();
                    });

                }, 0);
            });
        },

        init: function() {

            var $this = this;

            this.aria = (this.options.cls.indexOf('ng-hidden') !== -1);

            this.getToggles();

            this.on("click", function(e) {
                if ($this.element.is('a[href="#"]')) e.preventDefault();
                $this.toggle();
            });

            toggles.push(this);
        },

        toggle: function() {

            if(!this.totoggle.length) return;

            if (this.options.animation && NG.support.animation) {

                var $this = this, animations = this.options.animation.split(',');

                if (animations.length == 1) {
                    animations[1] = animations[0];
                }

                animations[0] = animations[0].trim();
                animations[1] = animations[1].trim();

                this.totoggle.css('animation-duration', this.options.duration+'ms');

                this.totoggle.each(function(){

                    var ele = NG.$(this);

                    if (ele.hasClass($this.options.cls)) {

                        ele.toggleClass($this.options.cls);

                        NG.Utils.animate(ele, animations[0]).then(function(){
                            ele.css('animation-duration', '');
                            NG.Utils.checkDisplay(ele);
                        });

                    } else {

                        NG.Utils.animate(this, animations[1]+' ng-animation-reverse').then(function(){
                            ele.toggleClass($this.options.cls).css('animation-duration', '');
                            NG.Utils.checkDisplay(ele);
                        });

                    }

                });

            } else {
                this.totoggle.toggleClass(this.options.cls);
                NG.Utils.checkDisplay(this.totoggle);
            }

            this.updateAria();

        },

        getToggles: function() {
            this.totoggle = this.options.target ? NG.$(this.options.target):[];
            this.updateAria();
        },

        updateAria: function() {
            if (this.aria && this.totoggle.length) {
                this.totoggle.each(function(){
                    NG.$(this).attr('aria-hidden', NG.$(this).hasClass('ng-hidden'));
                });
            }
        }
    });

})(NGkit);


(function(NG) {

    "use strict";

    NG.component('alert', {

        defaults: {
            "fade": true,
            "duration": 200,
            "trigger": ".ng-alert-close"
        },

        boot: function() {

            // init code
            NG.$html.on("click.alert.ngkit", "[data-ng-alert]", function(e) {

                var ele = NG.$(this);

                if (!ele.data("alert")) {

                    var alert = NG.alert(ele, NG.Utils.options(ele.attr("data-ng-alert")));

                    if (NG.$(e.target).is(alert.options.trigger)) {
                        e.preventDefault();
                        alert.close();
                    }
                }
            });
        },

        init: function() {

            var $this = this;

            this.on("click", this.options.trigger, function(e) {
                e.preventDefault();
                $this.close();
            });
        },

        close: function() {

            var element       = this.trigger("close.ng.alert"),
                removeElement = function () {
                    this.trigger("closed.ng.alert").remove();
                }.bind(this);

            if (this.options.fade) {
                element.css("overflow", "hidden").css("max-height", element.height()).animate({
                    "height"         : 0,
                    "opacity"        : 0,
                    "padding-top"    : 0,
                    "padding-bottom" : 0,
                    "margin-top"     : 0,
                    "margin-bottom"  : 0
                }, this.options.duration, removeElement);
            } else {
                removeElement();
            }
        }

    });

})(NGkit);


(function(NG) {

    "use strict";

    NG.component('buttonRadio', {

        defaults: {
            "activeClass": 'ng-active',
            "target": ".ng-button"
        },

        boot: function() {

            // init code
            NG.$html.on("click.buttonradio.ngkit", "[data-ng-button-radio]", function(e) {

                var ele = NG.$(this);

                if (!ele.data("buttonRadio")) {

                    var obj    = NG.buttonRadio(ele, NG.Utils.options(ele.attr("data-ng-button-radio"))),
                        target = NG.$(e.target);

                    if (target.is(obj.options.target)) {
                        target.trigger("click");
                    }
                }
            });
        },

        init: function() {

            var $this = this;

            // Init ARIA
            this.find($this.options.target).attr('aria-checked', 'false').filter('.' + $this.options.activeClass).attr('aria-checked', 'true');

            this.on("click", this.options.target, function(e) {

                var ele = NG.$(this);

                if (ele.is('a[href="#"]')) e.preventDefault();

                $this.find($this.options.target).not(ele).removeClass($this.options.activeClass).blur();
                ele.addClass($this.options.activeClass);

                // Update ARIA
                $this.find($this.options.target).not(ele).attr('aria-checked', 'false');
                ele.attr('aria-checked', 'true');

                $this.trigger("change.ng.button", [ele]);
            });

        },

        getSelected: function() {
            return this.find('.' + this.options.activeClass);
        }
    });

    NG.component('buttonCheckbox', {

        defaults: {
            "activeClass": 'ng-active',
            "target": ".ng-button"
        },

        boot: function() {

            NG.$html.on("click.buttoncheckbox.ngkit", "[data-ng-button-checkbox]", function(e) {
                var ele = NG.$(this);

                if (!ele.data("buttonCheckbox")) {

                    var obj    = NG.buttonCheckbox(ele, NG.Utils.options(ele.attr("data-ng-button-checkbox"))),
                        target = NG.$(e.target);

                    if (target.is(obj.options.target)) {
                        target.trigger("click");
                    }
                }
            });
        },

        init: function() {

            var $this = this;

            // Init ARIA
            this.find($this.options.target).attr('aria-checked', 'false').filter('.' + $this.options.activeClass).attr('aria-checked', 'true');

            this.on("click", this.options.target, function(e) {
                var ele = NG.$(this);

                if (ele.is('a[href="#"]')) e.preventDefault();

                ele.toggleClass($this.options.activeClass).blur();

                // Update ARIA
                ele.attr('aria-checked', ele.hasClass($this.options.activeClass));

                $this.trigger("change.ng.button", [ele]);
            });

        },

        getSelected: function() {
            return this.find('.' + this.options.activeClass);
        }
    });


    NG.component('button', {

        defaults: {},

        boot: function() {

            NG.$html.on("click.button.ngkit", "[data-ng-button]", function(e) {
                var ele = NG.$(this);

                if (!ele.data("button")) {

                    var obj = NG.button(ele, NG.Utils.options(ele.attr("data-ng-button")));
                    ele.trigger("click");
                }
            });
        },

        init: function() {

            var $this = this;

            // Init ARIA
            this.element.attr('aria-pressed', this.element.hasClass("ng-active"));

            this.on("click", function(e) {

                if ($this.element.is('a[href="#"]')) e.preventDefault();

                $this.toggle();
                $this.trigger("change.ng.button", [$this.element.blur().hasClass("ng-active")]);
            });

        },

        toggle: function() {
            this.element.toggleClass("ng-active");

            // Update ARIA
            this.element.attr('aria-pressed', this.element.hasClass("ng-active"));
        }
    });

})(NGkit);



(function(NG) {

    "use strict";

    var active = false, hoverIdle, flips = {
        'x': {
            "bottom-left"   : 'bottom-right',
            "bottom-right"  : 'bottom-left',
            "bottom-center" : 'bottom-center',
            "top-left"      : 'top-right',
            "top-right"     : 'top-left',
            "top-center"    : 'top-center',
            "left-top"      : 'right-top',
            "left-bottom"   : 'right-bottom',
            "left-center"   : 'right-center',
            "right-top"     : 'left-top',
            "right-bottom"  : 'left-bottom',
            "right-center"  : 'left-center'
        },
        'y': {
            "bottom-left"   : 'top-left',
            "bottom-right"  : 'top-right',
            "bottom-center" : 'top-center',
            "top-left"      : 'bottom-left',
            "top-right"     : 'bottom-right',
            "top-center"    : 'bottom-center',
            "left-top"      : 'left-bottom',
            "left-bottom"   : 'left-top',
            "left-center"   : 'left-center',
            "right-top"     : 'right-bottom',
            "right-bottom"  : 'right-top',
            "right-center"  : 'right-center'
        },
        'xy': {
            "bottom-left"   : 'top-right',
            "bottom-right"  : 'top-left',
            "bottom-center" : 'top-center',
            "top-left"      : 'bottom-right',
            "top-right"     : 'bottom-left',
            "top-center"    : 'bottom-center',
            "left-top"      : 'right-bottom',
            "left-bottom"   : 'right-top',
            "left-center"   : 'right-center',
            "right-top"     : 'left-bottom',
            "right-bottom"  : 'left-top',
            "right-center"  : 'left-center'
        }
    };

    NG.component('dropdown', {

        defaults: {
           'mode'            : 'hover',
           'pos'             : 'bottom-left',
           'offset'          : -1,
           'remaintime'      : 800,
           'justify'         : false,
           'boundary'        : NG.$win,
           'delay'           : 0,
           'dropdownSelector': '.ng-dropdown,.ng-dropdown-blank',
           'hoverDelayIdle'  : 250,
           'preventflip'     : false
        },

        remainIdle: false,

        boot: function() {

            var triggerevent = NG.support.touch ? "click" : "mouseenter";

            // init code
            NG.$html.on(triggerevent+".dropdown.ngkit", "[data-ng-dropdown]", function(e) {

                var ele = NG.$(this);

                if (!ele.data("dropdown")) {

                    var dropdown = NG.dropdown(ele, NG.Utils.options(ele.attr("data-ng-dropdown")));

                    if (triggerevent=="click" || (triggerevent=="mouseenter" && dropdown.options.mode=="hover")) {
                        dropdown.element.trigger(triggerevent);
                    }

                    if (dropdown.element.find(dropdown.options.dropdownSelector).length) {
                        e.preventDefault();
                    }
                }
            });
        },

        init: function() {

            var $this = this;

            this.dropdown     = this.find(this.options.dropdownSelector);
            this.offsetParent = this.dropdown.parents().filter(function() {
                return NG.$.inArray(NG.$(this).css('position'), ['relative', 'fixed', 'absolute']) !== -1;
            }).slice(0,1);

            this.centered  = this.dropdown.hasClass('ng-dropdown-center');
            this.justified = this.options.justify ? NG.$(this.options.justify) : false;

            this.boundary  = NG.$(this.options.boundary);

            if (!this.boundary.length) {
                this.boundary = NG.$win;
            }

            // legacy DEPRECATED!
            if (this.dropdown.hasClass('ng-dropdown-up')) {
                this.options.pos = 'top-left';
            }
            if (this.dropdown.hasClass('ng-dropdown-flip')) {
                this.options.pos = this.options.pos.replace('left','right');
            }
            if (this.dropdown.hasClass('ng-dropdown-center')) {
                this.options.pos = this.options.pos.replace(/(left|right)/,'center');
            }
            //-- end legacy

            // Init ARIA
            this.element.attr('aria-haspopup', 'true');
            this.element.attr('aria-expanded', this.element.hasClass("ng-open"));

            if (this.options.mode == "click" || NG.support.touch) {

                this.on("click.ng.dropdown", function(e) {

                    var $target = NG.$(e.target);

                    if (!$target.parents($this.options.dropdownSelector).length) {

                        if ($target.is("a[href='#']") || $target.parent().is("a[href='#']") || ($this.dropdown.length && !$this.dropdown.is(":visible")) ){
                            e.preventDefault();
                        }

                        $target.blur();
                    }

                    if (!$this.element.hasClass('ng-open')) {

                        $this.show();

                    } else {

                        if (!$this.dropdown.find(e.target).length || $target.is(".ng-dropdown-close") || $target.parents(".ng-dropdown-close").length) {
                            $this.hide();
                        }
                    }
                });

            } else {

                this.on("mouseenter", function(e) {

                    $this.trigger('pointerenter.ng.dropdown', [$this]);

                    if ($this.remainIdle) {
                        clearTimeout($this.remainIdle);
                    }

                    if (hoverIdle) {
                        clearTimeout(hoverIdle);
                    }

                    if (active && active == $this) {
                        return;
                    }

                    // pseudo manuAim
                    if (active && active != $this) {

                        hoverIdle = setTimeout(function() {
                            hoverIdle = setTimeout($this.show.bind($this), $this.options.delay);
                        }, $this.options.hoverDelayIdle);

                    } else {

                        hoverIdle = setTimeout($this.show.bind($this), $this.options.delay);
                    }

                }).on("mouseleave", function() {

                    if (hoverIdle) {
                        clearTimeout(hoverIdle);
                    }

                    $this.remainIdle = setTimeout(function() {
                        if (active && active == $this) $this.hide();
                    }, $this.options.remaintime);

                    $this.trigger('pointerleave.ng.dropdown', [$this]);

                }).on("click", function(e){

                    var $target = NG.$(e.target);

                    if ($this.remainIdle) {
                        clearTimeout($this.remainIdle);
                    }

                    if (active && active == $this) {
                        if (!$this.dropdown.find(e.target).length || $target.is(".ng-dropdown-close") || $target.parents(".ng-dropdown-close").length) {
                            $this.hide();
                        }
                        return;
                    }

                    if ($target.is("a[href='#']") || $target.parent().is("a[href='#']")){
                        e.preventDefault();
                    }

                    $this.show();
                });
            }
        },

        show: function(){

            NG.$html.off("click.outer.dropdown");

            if (active && active != this) {
                active.hide(true);
            }

            if (hoverIdle) {
                clearTimeout(hoverIdle);
            }

            this.trigger('beforeshow.ng.dropdown', [this]);

            this.checkDimensions();
            this.element.addClass('ng-open');

            // Update ARIA
            this.element.attr('aria-expanded', 'true');

            this.trigger('show.ng.dropdown', [this]);

            NG.Utils.checkDisplay(this.dropdown, true);
            active = this;

            this.registerOuterClick();
        },

        hide: function(force) {

            this.trigger('beforehide.ng.dropdown', [this, force]);

            this.element.removeClass('ng-open');

            if (this.remainIdle) {
                clearTimeout(this.remainIdle);
            }

            this.remainIdle = false;

            // Update ARIA
            this.element.attr('aria-expanded', 'false');

            this.trigger('hide.ng.dropdown', [this, force]);

            if (active == this) active = false;
        },

        registerOuterClick: function(){

            var $this = this;

            NG.$html.off("click.outer.dropdown");

            setTimeout(function() {

                NG.$html.on("click.outer.dropdown", function(e) {

                    if (hoverIdle) {
                        clearTimeout(hoverIdle);
                    }

                    var $target = NG.$(e.target);

                    if (active == $this && !$this.element.find(e.target).length) {
                        $this.hide(true);
                        NG.$html.off("click.outer.dropdown");
                    }
                });
            }, 10);
        },

        checkDimensions: function() {

            if (!this.dropdown.length) return;

            // reset
            this.dropdown.removeClass('ng-dropdown-top ng-dropdown-bottom ng-dropdown-left ng-dropdown-right ng-dropdown-stack').css({
                'top-left':'',
                'left':'',
                'margin-left' :'',
                'margin-right':''
            });

            if (this.justified && this.justified.length) {
                this.dropdown.css("min-width", "");
            }

            var $this          = this,
                pos            = NG.$.extend({}, this.offsetParent.offset(), {width: this.offsetParent[0].offsetWidth, height: this.offsetParent[0].offsetHeight}),
                posoffset      = this.options.offset,
                dropdown       = this.dropdown,
                offset         = dropdown.show().offset() || {left: 0, top: 0},
                width          = dropdown.outerWidth(),
                height         = dropdown.outerHeight(),
                boundarywidth  = this.boundary.width(),
                boundaryoffset = this.boundary[0] !== window && this.boundary.offset() ? this.boundary.offset(): {top:0, left:0},
                dpos           = this.options.pos;

            var variants =  {
                    "bottom-left"   : {top: 0 + pos.height + posoffset, left: 0},
                    "bottom-right"  : {top: 0 + pos.height + posoffset, left: 0 + pos.width - width},
                    "bottom-center" : {top: 0 + pos.height + posoffset, left: 0 + pos.width / 2 - width / 2},
                    "top-left"      : {top: 0 - height - posoffset, left: 0},
                    "top-right"     : {top: 0 - height - posoffset, left: 0 + pos.width - width},
                    "top-center"    : {top: 0 - height - posoffset, left: 0 + pos.width / 2 - width / 2},
                    "left-top"      : {top: 0, left: 0 - width - posoffset},
                    "left-bottom"   : {top: 0 + pos.height - height, left: 0 - width - posoffset},
                    "left-center"   : {top: 0 + pos.height / 2 - height / 2, left: 0 - width - posoffset},
                    "right-top"     : {top: 0, left: 0 + pos.width + posoffset},
                    "right-bottom"  : {top: 0 + pos.height - height, left: 0 + pos.width + posoffset},
                    "right-center"  : {top: 0 + pos.height / 2 - height / 2, left: 0 + pos.width + posoffset}
                },
                css = {},
                pp;

            pp = dpos.split('-');
            css = variants[dpos] ? variants[dpos] : variants['bottom-left'];

            // justify dropdown
            if (this.justified && this.justified.length) {
                justify(dropdown.css({left:0}), this.justified, boundarywidth);
            } else {

                if (this.options.preventflip !== true) {

                    var fdpos;

                    switch(this.checkBoundary(pos.left + css.left, pos.top + css.top, width, height, boundarywidth)) {
                        case "x":
                            if(this.options.preventflip !=='x') fdpos = flips['x'][dpos] || 'right-top';
                            break;
                        case "y":
                            if(this.options.preventflip !=='y') fdpos = flips['y'][dpos] || 'top-left';
                            break;
                        case "xy":
                            if(!this.options.preventflip) fdpos = flips['xy'][dpos] || 'right-bottom';
                            break;
                    }

                    if (fdpos) {

                        pp  = fdpos.split('-');
                        css = variants[fdpos] ? variants[fdpos] : variants['bottom-left'];

                        // check flipped
                        if (this.checkBoundary(pos.left + css.left, pos.top + css.top, width, height, boundarywidth)) {
                            pp  = dpos.split('-');
                            css = variants[dpos] ? variants[dpos] : variants['bottom-left'];
                        }
                    }
                }
            }

            if (width > boundarywidth) {
                dropdown.addClass("ng-dropdown-stack");
                this.trigger('stack.ng.dropdown', [this]);
            }

            dropdown.css(css).css("display", "").addClass('ng-dropdown-'+pp[0]);
        },

        checkBoundary: function(left, top, width, height, boundarywidth) {

            var axis = "";

            if (left < 0 || ((left - NG.$win.scrollLeft())+width) > boundarywidth) {
               axis += "x";
            }

            if ((top - NG.$win.scrollTop()) < 0 || ((top - NG.$win.scrollTop())+height) > window.innerHeight) {
               axis += "y";
            }

            return axis;
        }
    });


    NG.component('dropdownOverlay', {

        defaults: {
           'justify' : false,
           'cls'     : '',
           'duration': 200
        },

        boot: function() {

            // init code
            NG.ready(function(context) {

                NG.$("[data-ng-dropdown-overlay]", context).each(function() {
                    var ele = NG.$(this);

                    if (!ele.data("dropdownOverlay")) {
                        NG.dropdownOverlay(ele, NG.Utils.options(ele.attr("data-ng-dropdown-overlay")));
                    }
                });
            });
        },

        init: function() {

            var $this = this;

            this.justified = this.options.justify ? NG.$(this.options.justify) : false;
            this.overlay   = this.element.find('ng-dropdown-overlay');

            if (!this.overlay.length) {
                this.overlay = NG.$('<div class="ng-dropdown-overlay"></div>').appendTo(this.element);
            }

            this.overlay.addClass(this.options.cls);

            this.on({

                'beforeshow.ng.dropdown': function(e, dropdown) {
                    $this.dropdown = dropdown;

                    if ($this.justified && $this.justified.length) {
                        justify($this.overlay.css({'display':'block', 'margin-left':'','margin-right':''}), $this.justified, $this.justified.outerWidth());
                    }
                },

                'show.ng.dropdown': function(e, dropdown) {

                    var h = $this.dropdown.dropdown.outerHeight(true);

                    $this.dropdown.element.removeClass('ng-open');

                    $this.overlay.stop().css('display', 'block').animate({height: h}, $this.options.duration, function() {

                       $this.dropdown.dropdown.css('visibility', '');
                       $this.dropdown.element.addClass('ng-open');

                       NG.Utils.checkDisplay($this.dropdown.dropdown, true);
                    });

                    $this.pointerleave = false;
                },

                'hide.ng.dropdown': function() {
                    $this.overlay.stop().animate({height: 0}, $this.options.duration);
                },

                'pointerenter.ng.dropdown': function(e, dropdown) {
                    clearTimeout($this.remainIdle);
                },

                'pointerleave.ng.dropdown': function(e, dropdown) {
                    $this.pointerleave = true;
                }
            });


            this.overlay.on({

                'mouseenter': function() {
                    if ($this.remainIdle) {
                        clearTimeout($this.dropdown.remainIdle);
                        clearTimeout($this.remainIdle);
                    }
                },

                'mouseleave': function(){

                    if ($this.pointerleave && active) {

                        $this.remainIdle = setTimeout(function() {
                           if(active) active.hide();
                        }, active.options.remaintime);
                    }
                }
            });
        }

    });


    function justify(ele, justifyTo, boundarywidth, offset) {

        ele           = NG.$(ele);
        justifyTo     = NG.$(justifyTo);
        boundarywidth = boundarywidth || window.innerWidth;
        offset        = offset || ele.offset();

        if (justifyTo.length) {

            var jwidth = justifyTo.outerWidth();

            ele.css("min-width", jwidth);

            if (NG.langdirection == 'right') {

                var right1   = boundarywidth - (justifyTo.offset().left + jwidth),
                    right2   = boundarywidth - (ele.offset().left + ele.outerWidth());

                ele.css("margin-right", right1 - right2);

            } else {
                ele.css("margin-left", justifyTo.offset().left - offset.left);
            }
        }
    }

})(NGkit);


(function(NG) {

    "use strict";

    var grids = [];

    NG.component('gridMatchHeight', {

        defaults: {
            "target" : false,
            "row"    : true
        },

        boot: function() {

            // init code
            NG.ready(function(context) {

                NG.$("[data-ng-grid-match]", context).each(function() {
                    var grid = NG.$(this), obj;

                    if (!grid.data("gridMatchHeight")) {
                        obj = NG.gridMatchHeight(grid, NG.Utils.options(grid.attr("data-ng-grid-match")));
                    }
                });
            });
        },

        init: function() {

            var $this = this;

            this.columns  = this.element.children();
            this.elements = this.options.target ? this.find(this.options.target) : this.columns;

            if (!this.columns.length) return;

            NG.$win.on('load resize orientationchange', (function() {

                var fn = function() {
                    $this.match();
                };

                NG.$(function() { fn(); });

                return NG.Utils.debounce(fn, 50);
            })());

            NG.$html.on("changed.ng.dom", function(e) {
                $this.columns  = $this.element.children();
                $this.elements = $this.options.target ? $this.find($this.options.target) : $this.columns;
                $this.match();
            });

            this.on("display.ng.check", function(e) {
                if(this.element.is(":visible")) this.match();
            }.bind(this));

            grids.push(this);
        },

        match: function() {

            var firstvisible = this.columns.filter(":visible:first");

            if (!firstvisible.length) return;

            var stacked = Math.ceil(100 * parseFloat(firstvisible.css('width')) / parseFloat(firstvisible.parent().css('width'))) >= 100;

            if (stacked) {
                this.revert();
            } else {
                NG.Utils.matchHeights(this.elements, this.options);
            }

            return this;
        },

        revert: function() {
            this.elements.css('min-height', '');
            return this;
        }
    });

    NG.component('gridMargin', {

        defaults: {
            "cls": "ng-grid-margin"
        },

        boot: function() {

            // init code
            NG.ready(function(context) {

                NG.$("[data-ng-grid-margin]", context).each(function() {
                    var grid = NG.$(this), obj;

                    if (!grid.data("gridMargin")) {
                        obj = NG.gridMargin(grid, NG.Utils.options(grid.attr("data-ng-grid-margin")));
                    }
                });
            });
        },

        init: function() {

            var stackMargin = NG.stackMargin(this.element, this.options);
        }
    });

    // helper

    NG.Utils.matchHeights = function(elements, options) {

        elements = NG.$(elements).css('min-height', '');
        options  = NG.$.extend({ row : true }, options);

        var matchHeights = function(group){

            if(group.length < 2) return;

            var max = 0;

            group.each(function() {
                max = Math.max(max, NG.$(this).outerHeight());
            }).each(function() {

                var element = NG.$(this),
                    height  = max - (element.css('box-sizing') == 'border-box' ? 0 : (element.outerHeight() - element.height()));


                element.css('min-height', height + 1 + 'px');
            });
        };

        if(options.row) {

            elements.first().width(); // force redraw

            setTimeout(function(){

                var lastoffset = false, group = [];

                elements.each(function() {

                    var ele = NG.$(this), offset = ele.offset().top;

                    if(offset != lastoffset && group.length) {

                        matchHeights(NG.$(group));
                        group  = [];
                        offset = ele.offset().top;
                    }

                    group.push(ele);
                    lastoffset = offset;
                });

                if(group.length) {
                    matchHeights(NG.$(group));
                }

            }, 0);

        } else {
            matchHeights(elements);
        }
    };

})(NGkit);


(function(NG) {

    "use strict";

    var active = false, activeCount = 0, $html = NG.$html, body;

    NG.$win.on("resize orientationchange", NG.Utils.debounce(function(){
        NG.$('.ng-modal.ng-open').each(function(){
            NG.$(this).data('modal').resize();
        });
    }, 150));

    NG.component('modal', {

        defaults: {
            keyboard: true,
            bgclose: true,
            minScrollHeight: 150,
            center: false,
            modal: true
        },

        scrollable: false,
        transition: false,
        hasTransitioned: true,

        init: function() {

            if (!body) body = NG.$('body');

            if (!this.element.length) return;

            var $this = this;

            this.paddingdir = "padding-" + (NG.langdirection == 'left' ? "right":"left");
            this.dialog     = this.find(".ng-modal-dialog");

            this.active     = false;

            // Update ARIA
            this.element.attr('aria-hidden', this.element.hasClass("ng-open"));

            this.on("click", ".ng-modal-close", function(e) {
                e.preventDefault();
                $this.hide();
            }).on("click", function(e) {

                var target = NG.$(e.target);

                if (target[0] == $this.element[0] && $this.options.bgclose) {
                    $this.hide();
                }
            });

            NG.domObserve(this.element, function(e) { $this.resize(); });
        },

        toggle: function() {
            return this[this.isActive() ? "hide" : "show"]();
        },

        show: function() {

            if (!this.element.length) return;

            var $this = this;

            if (this.isActive()) return;

            if (this.options.modal && active) {
                active.hide(true);
            }

            this.element.removeClass("ng-open").show();
            this.resize(true);

            if (this.options.modal) {
                active = this;
            }

            this.active = true;

            activeCount++;

            if (NG.support.transition) {
                this.hasTransitioned = false;
                this.element.one(NG.support.transition.end, function(){
                    $this.hasTransitioned = true;
                }).addClass("ng-open");
            } else {
                this.element.addClass("ng-open");
            }

            $html.addClass("ng-modal-page").height(); // force browser engine redraw

            // Update ARIA
            this.element.attr('aria-hidden', 'false');

            this.element.trigger("show.ng.modal");

            NG.Utils.checkDisplay(this.dialog, true);

            return this;
        },

        hide: function(force) {

            if (!force && NG.support.transition && this.hasTransitioned) {

                var $this = this;

                this.one(NG.support.transition.end, function() {
                    $this._hide();
                }).removeClass("ng-open");

            } else {

                this._hide();
            }

            return this;
        },

        resize: function(force) {

            if (!this.isActive() && !force) return;

            var bodywidth  = body.width();

            this.scrollbarwidth = window.innerWidth - bodywidth;

            body.css(this.paddingdir, this.scrollbarwidth);

            this.element.css('overflow-y', this.scrollbarwidth ? 'scroll' : 'auto');

            if (!this.updateScrollable() && this.options.center) {

                var dh  = this.dialog.outerHeight(),
                pad = parseInt(this.dialog.css('margin-top'), 10) + parseInt(this.dialog.css('margin-bottom'), 10);

                if ((dh + pad) < window.innerHeight) {
                    this.dialog.css({'top': (window.innerHeight/2 - dh/2) - pad });
                } else {
                    this.dialog.css({'top': ''});
                }
            }
        },

        updateScrollable: function() {

            // has scrollable?
            var scrollable = this.dialog.find('.ng-overflow-container:visible:first');

            if (scrollable.length) {

                scrollable.css('height', 0);

                var offset = Math.abs(parseInt(this.dialog.css('margin-top'), 10)),
                dh     = this.dialog.outerHeight(),
                wh     = window.innerHeight,
                h      = wh - 2*(offset < 20 ? 20:offset) - dh;

                scrollable.css({
                    'max-height': (h < this.options.minScrollHeight ? '':h),
                    'height':''
                });

                return true;
            }

            return false;
        },

        _hide: function() {

            this.active = false;
            if (activeCount > 0) activeCount--;
            else activeCount = 0;

            this.element.hide().removeClass('ng-open');

            // Update ARIA
            this.element.attr('aria-hidden', 'true');

            if (!activeCount) {
                $html.removeClass('ng-modal-page');
                body.css(this.paddingdir, "");
            }

            if (active===this) active = false;

            this.trigger('hide.ng.modal');
        },

        isActive: function() {
            return this.element.hasClass('ng-open');
        }

    });

    NG.component('modalTrigger', {

        boot: function() {

            // init code
            NG.$html.on("click.modal.ngkit", "[data-ng-modal]", function(e) {

                var ele = NG.$(this);

                if (ele.is("a")) {
                    e.preventDefault();
                }

                if (!ele.data("modalTrigger")) {
                    var modal = NG.modalTrigger(ele, NG.Utils.options(ele.attr("data-ng-modal")));
                    modal.show();
                }

            });

            // close modal on esc button
            NG.$html.on('keydown.modal.ngkit', function (e) {

                if (active && e.keyCode === 27 && active.options.keyboard) { // ESC
                    e.preventDefault();
                    active.hide();
                }
            });
        },

        init: function() {

            var $this = this;

            this.options = NG.$.extend({
                "target": $this.element.is("a") ? $this.element.attr("href") : false
            }, this.options);

            this.modal = NG.modal(this.options.target, this.options);

            this.on("click", function(e) {
                e.preventDefault();
                $this.show();
            });

            //methods
            this.proxy(this.modal, "show hide isActive");
        }
    });

    NG.modal.dialog = function(content, options) {

        var modal = NG.modal(NG.$(NG.modal.dialog.template).appendTo("body"), options);

        modal.on("hide.ng.modal", function(){
            if (modal.persist) {
                modal.persist.appendTo(modal.persist.data("modalPersistParent"));
                modal.persist = false;
            }
            modal.element.remove();
        });

        setContent(content, modal);

        return modal;
    };

    NG.modal.dialog.template = '<div class="ng-modal"><div class="ng-modal-dialog" style="min-height:0;"></div></div>';

    NG.modal.alert = function(content, options) {

        options = NG.$.extend(true, {bgclose:false, keyboard:false, modal:false, labels:NG.modal.labels}, options);

        var modal = NG.modal.dialog(([
            '<div class="ng-margin ng-modal-content">'+String(content)+'</div>',
            '<div class="ng-modal-footer ng-text-right"><button class="ng-button ng-button-primary ng-modal-close">'+options.labels.Ok+'</button></div>'
        ]).join(""), options);

        modal.on('show.ng.modal', function(){
            setTimeout(function(){
                modal.element.find('button:first').focus();
            }, 50);
        });

        return modal.show();
    };

    NG.modal.confirm = function(content, onconfirm, oncancel) {

        var options = arguments.length > 1 && arguments[arguments.length-1] ? arguments[arguments.length-1] : {};

        onconfirm = NG.$.isFunction(onconfirm) ? onconfirm : function(){};
        oncancel  = NG.$.isFunction(oncancel) ? oncancel : function(){};
        options   = NG.$.extend(true, {bgclose:false, keyboard:false, modal:false, labels:NG.modal.labels}, NG.$.isFunction(options) ? {}:options);

        var modal = NG.modal.dialog(([
            '<div class="ng-margin ng-modal-content">'+String(content)+'</div>',
            '<div class="ng-modal-footer ng-text-right"><button class="ng-button js-modal-confirm-cancel">'+options.labels.Cancel+'</button> <button class="ng-button ng-button-primary js-modal-confirm">'+options.labels.Ok+'</button></div>'
        ]).join(""), options);

        modal.element.find(".js-modal-confirm, .js-modal-confirm-cancel").on("click", function(){
            NG.$(this).is('.js-modal-confirm') ? onconfirm() : oncancel();
            modal.hide();
        });

        modal.on('show.ng.modal', function(){
            setTimeout(function(){
                modal.element.find('.js-modal-confirm').focus();
            }, 50);
        });

        return modal.show();
    };

    NG.modal.prompt = function(text, value, onsubmit, options) {

        onsubmit = NG.$.isFunction(onsubmit) ? onsubmit : function(value){};
        options  = NG.$.extend(true, {bgclose:false, keyboard:false, modal:false, labels:NG.modal.labels}, options);

        var modal = NG.modal.dialog(([
            text ? '<div class="ng-modal-content ng-form">'+String(text)+'</div>':'',
            '<div class="ng-margin-small-top ng-modal-content ng-form"><p><input type="text" class="ng-width-1-1"></p></div>',
            '<div class="ng-modal-footer ng-text-right"><button class="ng-button ng-modal-close">'+options.labels.Cancel+'</button> <button class="ng-button ng-button-primary js-modal-ok">'+options.labels.Ok+'</button></div>'
        ]).join(""), options),

        input = modal.element.find("input[type='text']").val(value || '').on('keyup', function(e){
            if (e.keyCode == 13) {
                modal.element.find(".js-modal-ok").trigger('click');
            }
        });

        modal.element.find(".js-modal-ok").on("click", function(){
            if (onsubmit(input.val())!==false){
                modal.hide();
            }
        });

        modal.on('show.ng.modal', function(){
            setTimeout(function(){
                input.focus();
            }, 50);
        });

        return modal.show();
    };

    NG.modal.blockNG = function(content, options) {

        var modal = NG.modal.dialog(([
            '<div class="ng-margin ng-modal-content">'+String(content || '<div class="ng-text-center">...</div>')+'</div>'
        ]).join(""), NG.$.extend({bgclose:false, keyboard:false, modal:false}, options));

        modal.content = modal.element.find('.ng-modal-content:first');

        return modal.show();
    };


    NG.modal.labels = {
        'Ok': 'Ok',
        'Cancel': 'Cancel'
    };


    // helper functions
    function setContent(content, modal){

        if(!modal) return;

        if (typeof content === 'object') {

            // convert DOM object to a jQuery object
            content = content instanceof jQuery ? content : NG.$(content);

            if(content.parent().length) {
                modal.persist = content;
                modal.persist.data("modalPersistParent", content.parent());
            }
        }else if (typeof content === 'string' || typeof content === 'number') {
                // just insert the data as innerHTML
                content = NG.$('<div></div>').html(content);
        }else {
                // unsupported data type!
                content = NG.$('<div></div>').html('NGkit.modal Error: Unsupported data type: ' + typeof content);
        }

        content.appendTo(modal.element.find('.ng-modal-dialog'));

        return modal;
    }

})(NGkit);


(function(NG) {

    "use strict";

    NG.component('nav', {

        defaults: {
            "toggle": ">li.ng-parent > a[href='#']",
            "lists": ">li.ng-parent > ul",
            "multiple": false
        },

        boot: function() {

            // init code
            NG.ready(function(context) {

                NG.$("[data-ng-nav]", context).each(function() {
                    var nav = NG.$(this);

                    if (!nav.data("nav")) {
                        var obj = NG.nav(nav, NG.Utils.options(nav.attr("data-ng-nav")));
                    }
                });
            });
        },

        init: function() {

            var $this = this;

            this.on("click.ng.nav", this.options.toggle, function(e) {
                e.preventDefault();
                var ele = NG.$(this);
                $this.open(ele.parent()[0] == $this.element[0] ? ele : ele.parent("li"));
            });

            this.find(this.options.lists).each(function() {
                var $ele   = NG.$(this),
                    parent = $ele.parent(),
                    active = parent.hasClass("ng-active");

                $ele.wrap('<div style="overflow:hidden;height:0;position:relative;"></div>');
                parent.data("list-container", $ele.parent()[active ? 'removeClass':'addClass']('ng-hidden'));

                // Init ARIA
                parent.attr('aria-expanded', parent.hasClass("ng-open"));

                if (active) $this.open(parent, true);
            });

        },

        open: function(li, noanimation) {

            var $this = this, element = this.element, $li = NG.$(li), $container = $li.data('list-container');

            if (!this.options.multiple) {

                element.children('.ng-open').not(li).each(function() {

                    var ele = NG.$(this);

                    if (ele.data('list-container')) {
                        ele.data('list-container').stop().animate({height: 0}, function() {
                            NG.$(this).parent().removeClass('ng-open').end().addClass('ng-hidden');
                        });
                    }
                });
            }

            $li.toggleClass('ng-open');

            // Update ARIA
            $li.attr('aria-expanded', $li.hasClass('ng-open'));

            if ($container) {

                if ($li.hasClass('ng-open')) {
                    $container.removeClass('ng-hidden');
                }

                if (noanimation) {

                    $container.stop().height($li.hasClass('ng-open') ? 'auto' : 0);

                    if (!$li.hasClass('ng-open')) {
                        $container.addClass('ng-hidden');
                    }

                    this.trigger('display.ng.check');

                } else {

                    $container.stop().animate({
                        height: ($li.hasClass('ng-open') ? getHeight($container.find('ul:first')) : 0)
                    }, function() {

                        if (!$li.hasClass('ng-open')) {
                            $container.addClass('ng-hidden');
                        } else {
                            $container.css('height', '');
                        }

                        $this.trigger('display.ng.check');
                    });
                }
            }
        }
    });


    // helper

    function getHeight(ele) {
        var $ele = NG.$(ele), height = "auto";

        if ($ele.is(":visible")) {
            height = $ele.outerHeight();
        } else {
            var tmp = {
                position: $ele.css("position"),
                visibility: $ele.css("visibility"),
                display: $ele.css("display")
            };

            height = $ele.css({position: 'absolute', visibility: 'hidden', display: 'block'}).outerHeight();

            $ele.css(tmp); // reset element
        }

        return height;
    }

})(NGkit);


(function(NG) {

    "use strict";

    var scrollpos = {x: window.scrollX, y: window.scrollY},
        $win      = NG.$win,
        $doc      = NG.$doc,
        $html     = NG.$html,
        Offcanvas = {

        show: function(element) {

            element = NG.$(element);

            if (!element.length) return;

            var $body     = NG.$('body'),
                bar       = element.find(".ng-offcanvas-bar:first"),
                rtl       = (NG.langdirection == "right"),
                flip      = bar.hasClass("ng-offcanvas-bar-flip") ? -1:1,
                dir       = flip * (rtl ? -1 : 1),

                scrollbarwidth =  window.innerWidth - $body.width();

            scrollpos = {x: window.pageXOffset, y: window.pageYOffset};

            element.addClass("ng-active");

            $body.css({"width": window.innerWidth - scrollbarwidth, "height": window.innerHeight}).addClass("ng-offcanvas-page");
            $body.css((rtl ? "margin-right" : "margin-left"), (rtl ? -1 : 1) * (bar.outerWidth() * dir)).width(); // .width() - force redraw

            $html.css('margin-top', scrollpos.y * -1);

            bar.addClass("ng-offcanvas-bar-show");

            this._initElement(element);

            bar.trigger('show.ng.offcanvas', [element, bar]);

            // Update ARIA
            element.attr('aria-hidden', 'false');
        },

        hide: function(force) {

            var $body = NG.$('body'),
                panel = NG.$(".ng-offcanvas.ng-active"),
                rtl   = (NG.langdirection == "right"),
                bar   = panel.find(".ng-offcanvas-bar:first"),
                finalize = function() {
                    $body.removeClass("ng-offcanvas-page").css({"width": "", "height": "", "margin-left": "", "margin-right": ""});
                    panel.removeClass("ng-active");

                    bar.removeClass("ng-offcanvas-bar-show");
                    $html.css('margin-top', '');
                    window.scrollTo(scrollpos.x, scrollpos.y);
                    bar.trigger('hide.ng.offcanvas', [panel, bar]);

                    // Update ARIA
                    panel.attr('aria-hidden', 'true');
                };

            if (!panel.length) return;

            if (NG.support.transition && !force) {

                $body.one(NG.support.transition.end, function() {
                    finalize();
                }).css((rtl ? "margin-right" : "margin-left"), "");

                setTimeout(function(){
                    bar.removeClass("ng-offcanvas-bar-show");
                }, 0);

            } else {
                finalize();
            }
        },

        _initElement: function(element) {

            if (element.data("OffcanvasInit")) return;

            element.on("click.ng.offcanvas swipeRight.ng.offcanvas swipeLeft.ng.offcanvas", function(e) {

                var target = NG.$(e.target);

                if (!e.type.match(/swipe/)) {

                    if (!target.hasClass("ng-offcanvas-close")) {
                        if (target.hasClass("ng-offcanvas-bar")) return;
                        if (target.parents(".ng-offcanvas-bar:first").length) return;
                    }
                }

                e.stopImmediatePropagation();
                Offcanvas.hide();
            });

            element.on("click", "a[href*='#']", function(e){

                var link = NG.$(this),
                    href = link.attr("href");

                if (href == "#") {
                    return;
                }

                NG.$doc.one('hide.ng.offcanvas', function() {

                    var target;

                    try {
                        target = NG.$(link[0].hash);
                    } catch (e){
                        target = '';
                    }

                    if (!target.length) {
                        target = NG.$('[name="'+link[0].hash.replace('#','')+'"]');
                    }

                    if (target.length && NG.Utils.scrollToElement) {
                        NG.Utils.scrollToElement(target, NG.Utils.options(link.attr('data-ng-smooth-scroll') || '{}'));
                    } else {
                        window.location.href = href;
                    }
                });

                Offcanvas.hide();
            });

            element.data("OffcanvasInit", true);
        }
    };

    NG.component('offcanvasTrigger', {

        boot: function() {

            // init code
            $html.on("click.offcanvas.ngkit", "[data-ng-offcanvas]", function(e) {

                e.preventDefault();

                var ele = NG.$(this);

                if (!ele.data("offcanvasTrigger")) {
                    var obj = NG.offcanvasTrigger(ele, NG.Utils.options(ele.attr("data-ng-offcanvas")));
                    ele.trigger("click");
                }
            });

            $html.on('keydown.ng.offcanvas', function(e) {

                if (e.keyCode === 27) { // ESC
                    Offcanvas.hide();
                }
            });
        },

        init: function() {

            var $this = this;

            this.options = NG.$.extend({
                "target": $this.element.is("a") ? $this.element.attr("href") : false
            }, this.options);

            this.on("click", function(e) {
                e.preventDefault();
                Offcanvas.show($this.options.target);
            });
        }
    });

    NG.offcanvas = Offcanvas;

})(NGkit);


(function(NG) {

    "use strict";

    var Animations;

    NG.component('switcher', {

        defaults: {
            connect   : false,
            toggle    : ">*",
            active    : 0,
            animation : false,
            duration  : 200,
            swiping   : true
        },

        animating: false,

        boot: function() {

            // init code
            NG.ready(function(context) {

                NG.$("[data-ng-switcher]", context).each(function() {
                    var switcher = NG.$(this);

                    if (!switcher.data("switcher")) {
                        var obj = NG.switcher(switcher, NG.Utils.options(switcher.attr("data-ng-switcher")));
                    }
                });
            });
        },

        init: function() {

            var $this = this;

            this.on("click.ng.switcher", this.options.toggle, function(e) {
                e.preventDefault();
                $this.show(this);
            });

            if (this.options.connect) {

                this.connect = NG.$(this.options.connect);

                this.connect.children().removeClass("ng-active");

                // delegate switch commands within container content
                if (this.connect.length) {

                    // Init ARIA for connect
                    this.connect.children().attr('aria-hidden', 'true');

                    this.connect.on("click", '[data-ng-switcher-item]', function(e) {

                        e.preventDefault();

                        var item = NG.$(this).attr('data-ng-switcher-item');

                        if ($this.index == item) return;

                        switch(item) {
                            case 'next':
                            case 'previous':
                                $this.show($this.index + (item=='next' ? 1:-1));
                                break;
                            default:
                                $this.show(parseInt(item, 10));
                        }
                    });

                    if (this.options.swiping) {

                        this.connect.on('swipeRight swipeLeft', function(e) {
                            e.preventDefault();
                            if(!window.getSelection().toString()) {
                                $this.show($this.index + (e.type == 'swipeLeft' ? 1 : -1));
                            }
                        });
                    }
                }

                var toggles = this.find(this.options.toggle),
                    active  = toggles.filter(".ng-active");

                if (active.length) {
                    this.show(active, false);
                } else {

                    if (this.options.active===false) return;

                    active = toggles.eq(this.options.active);
                    this.show(active.length ? active : toggles.eq(0), false);
                }

                // Init ARIA for toggles
                toggles.not(active).attr('aria-expanded', 'false');
                active.attr('aria-expanded', 'true');
            }

        },

        show: function(tab, animate) {

            if (this.animating) {
                return;
            }

            if (isNaN(tab)) {
                tab = NG.$(tab);
            } else {

                var toggles = this.find(this.options.toggle);

                tab = tab < 0 ? toggles.length-1 : tab;
                tab = toggles.eq(toggles[tab] ? tab : 0);
            }

            var $this     = this,
                toggles   = this.find(this.options.toggle),
                active    = NG.$(tab),
                animation = Animations[this.options.animation] || function(current, next) {

                    if (!$this.options.animation) {
                        return Animations.none.apply($this);
                    }

                    var anim = $this.options.animation.split(',');

                    if (anim.length == 1) {
                        anim[1] = anim[0];
                    }

                    anim[0] = anim[0].trim();
                    anim[1] = anim[1].trim();

                    return coreAnimation.apply($this, [anim, current, next]);
                };

            if (animate===false || !NG.support.animation) {
                animation = Animations.none;
            }

            if (active.hasClass("ng-disabled")) return;

            // Update ARIA for Toggles
            toggles.attr('aria-expanded', 'false');
            active.attr('aria-expanded', 'true');

            toggles.filter(".ng-active").removeClass("ng-active");
            active.addClass("ng-active");

            if (this.options.connect && this.connect.length) {

                this.index = this.find(this.options.toggle).index(active);

                if (this.index == -1 ) {
                    this.index = 0;
                }

                this.connect.each(function() {

                    var container = NG.$(this),
                        children  = NG.$(container.children()),
                        current   = NG.$(children.filter('.ng-active')),
                        next      = NG.$(children.eq($this.index));

                        $this.animating = true;

                        animation.apply($this, [current, next]).then(function(){

                            current.removeClass("ng-active");
                            next.addClass("ng-active");

                            // Update ARIA for connect
                            current.attr('aria-hidden', 'true');
                            next.attr('aria-hidden', 'false');

                            NG.Utils.checkDisplay(next, true);

                            $this.animating = false;

                        });
                });
            }

            this.trigger("show.ng.switcher", [active]);
        }
    });

    Animations = {

        'none': function() {
            var d = NG.$.Deferred();
            d.resolve();
            return d.promise();
        },

        'fade': function(current, next) {
            return coreAnimation.apply(this, ['ng-animation-fade', current, next]);
        },

        'slide-bottom': function(current, next) {
            return coreAnimation.apply(this, ['ng-animation-slide-bottom', current, next]);
        },

        'slide-top': function(current, next) {
            return coreAnimation.apply(this, ['ng-animation-slide-top', current, next]);
        },

        'slide-vertical': function(current, next, dir) {

            var anim = ['ng-animation-slide-top', 'ng-animation-slide-bottom'];

            if (current && current.index() > next.index()) {
                anim.reverse();
            }

            return coreAnimation.apply(this, [anim, current, next]);
        },

        'slide-left': function(current, next) {
            return coreAnimation.apply(this, ['ng-animation-slide-left', current, next]);
        },

        'slide-right': function(current, next) {
            return coreAnimation.apply(this, ['ng-animation-slide-right', current, next]);
        },

        'slide-horizontal': function(current, next, dir) {

            var anim = ['ng-animation-slide-right', 'ng-animation-slide-left'];

            if (current && current.index() > next.index()) {
                anim.reverse();
            }

            return coreAnimation.apply(this, [anim, current, next]);
        },

        'scale': function(current, next) {
            return coreAnimation.apply(this, ['ng-animation-scale-up', current, next]);
        }
    };

    NG.switcher.animations = Animations;


    // helpers

    function coreAnimation(cls, current, next) {

        var d = NG.$.Deferred(), clsIn = cls, clsOut = cls, release;

        if (next[0]===current[0]) {
            d.resolve();
            return d.promise();
        }

        if (typeof(cls) == 'object') {
            clsIn  = cls[0];
            clsOut = cls[1] || cls[0];
        }

        NG.$body.css('overflow-x', 'hidden'); // fix scroll jumping in iOS

        release = function() {

            if (current) current.hide().removeClass('ng-active '+clsOut+' ng-animation-reverse');

            next.addClass(clsIn).one(NG.support.animation.end, function() {

                next.removeClass(''+clsIn+'').css({opacity:'', display:''});

                d.resolve();

                NG.$body.css('overflow-x', '');

                if (current) current.css({opacity:'', display:''});

            }.bind(this)).show();
        };

        next.css('animation-duration', this.options.duration+'ms');

        if (current && current.length) {

            current.css('animation-duration', this.options.duration+'ms');

            current.css('display', 'none').addClass(clsOut+' ng-animation-reverse').one(NG.support.animation.end, function() {
                release();
            }.bind(this)).css('display', '');

        } else {
            next.addClass('ng-active');
            release();
        }

        return d.promise();
    }

})(NGkit);


(function(NG) {

    "use strict";

    NG.component('tab', {

        defaults: {
            'target'    : '>li:not(.ng-tab-responsive, .ng-disabled)',
            'connect'   : false,
            'active'    : 0,
            'animation' : false,
            'duration'  : 200,
            'swiping'   : true
        },

        boot: function() {

            // init code
            NG.ready(function(context) {

                NG.$("[data-ng-tab]", context).each(function() {

                    var tab = NG.$(this);

                    if (!tab.data("tab")) {
                        var obj = NG.tab(tab, NG.Utils.options(tab.attr("data-ng-tab")));
                    }
                });
            });
        },

        init: function() {

            var $this = this;

            this.current = false;

            this.on("click.ng.tab", this.options.target, function(e) {

                e.preventDefault();

                if ($this.switcher && $this.switcher.animating) {
                    return;
                }

                var current = $this.find($this.options.target).not(this);

                current.removeClass("ng-active").blur();

                $this.trigger("change.ng.tab", [NG.$(this).addClass("ng-active"), $this.current]);

                $this.current = NG.$(this);

                // Update ARIA
                if (!$this.options.connect) {
                    current.attr('aria-expanded', 'false');
                    NG.$(this).attr('aria-expanded', 'true');
                }
            });

            if (this.options.connect) {
                this.connect = NG.$(this.options.connect);
            }

            // init responsive tab
            this.responsivetab = NG.$('<li class="ng-tab-responsive ng-active"><a></a></li>').append('<div class="ng-dropdown ng-dropdown-small"><ul class="ng-nav ng-nav-dropdown"></ul><div>');

            this.responsivetab.dropdown = this.responsivetab.find('.ng-dropdown');
            this.responsivetab.lst      = this.responsivetab.dropdown.find('ul');
            this.responsivetab.caption  = this.responsivetab.find('a:first');

            if (this.element.hasClass("ng-tab-bottom")) this.responsivetab.dropdown.addClass("ng-dropdown-up");

            // handle click
            this.responsivetab.lst.on('click.ng.tab', 'a', function(e) {

                e.preventDefault();
                e.stopPropagation();

                var link = NG.$(this);

                $this.element.children('li:not(.ng-tab-responsive)').eq(link.data('index')).trigger('click');
            });

            this.on('show.ng.switcher change.ng.tab', function(e, tab) {
                $this.responsivetab.caption.html(tab.text());
            });

            this.element.append(this.responsivetab);

            // init NGkit components
            if (this.options.connect) {
                this.switcher = NG.switcher(this.element, {
                    'toggle'    : '>li:not(.ng-tab-responsive)',
                    'connect'   : this.options.connect,
                    'active'    : this.options.active,
                    'animation' : this.options.animation,
                    'duration'  : this.options.duration,
                    'swiping'   : this.options.swiping
                });
            }

            NG.dropdown(this.responsivetab, {"mode": "click", "preventflip": "y"});

            // init
            $this.trigger("change.ng.tab", [this.element.find(this.options.target).not('.ng-tab-responsive').filter('.ng-active')]);

            this.check();

            NG.$win.on('resize orientationchange', NG.Utils.debounce(function(){
                if ($this.element.is(":visible"))  $this.check();
            }, 100));

            this.on('display.ng.check', function(){
                if ($this.element.is(":visible"))  $this.check();
            });
        },

        check: function() {

            var children = this.element.children('li:not(.ng-tab-responsive)').removeClass('ng-hidden');

            if (!children.length) {
                this.responsivetab.addClass('ng-hidden');
                return;
            }

            var top          = (children.eq(0).offset().top + Math.ceil(children.eq(0).height()/2)),
                doresponsive = false,
                item, link, clone;

            this.responsivetab.lst.empty();

            children.each(function(){

                if (NG.$(this).offset().top > top) {
                    doresponsive = true;
                }
            });

            if (doresponsive) {

                for (var i = 0; i < children.length; i++) {

                    item  = NG.$(children.eq(i));
                    link  = item.find('a');

                    if (item.css('float') != 'none' && !item.attr('ng-dropdown')) {

                        if (!item.hasClass('ng-disabled')) {

                            clone = item[0].outerHTML.replace('<a ', '<a data-index="'+i+'" ');

                            this.responsivetab.lst.append(clone);
                        }

                        item.addClass('ng-hidden');
                    }
                }
            }

            this.responsivetab[this.responsivetab.lst.children('li').length ? 'removeClass':'addClass']('ng-hidden');
        }
    });

})(NGkit);


(function(NG){

    "use strict";

    NG.component('cover', {

        defaults: {
            automute : true
        },

        boot: function() {

            // auto init
            NG.ready(function(context) {

                NG.$("[data-ng-cover]", context).each(function(){

                    var ele = NG.$(this);

                    if(!ele.data("cover")) {
                        var plugin = NG.cover(ele, NG.Utils.options(ele.attr("data-ng-cover")));
                    }
                });
            });
        },

        init: function() {

            this.parent = this.element.parent();

            NG.$win.on('load resize orientationchange', NG.Utils.debounce(function(){
                this.check();
            }.bind(this), 100));

            this.on("display.ng.check", function(e) {
                if(this.element.is(":visible")) this.check();
            }.bind(this));

            this.check();

            if (this.element.is('iframe') && this.options.automute) {

                var src = this.element.attr('src');

                this.element.attr('src', '').on('load', function(){

                    this.contentWindow.postMessage('{ "event": "command", "func": "mute", "method":"setVolume", "value":0}', '*');

                }).attr('src', [src, (src.indexOf('?') > -1 ? '&':'?'), 'enablejsapi=1&api=1'].join(''));
            }
        },

        check: function() {

            this.element.css({
                'width'  : '',
                'height' : ''
            });

            this.dimension = {w: this.element.width(), h: this.element.height()};

            if (this.element.attr('width') && !isNaN(this.element.attr('width'))) {
                this.dimension.w = this.element.attr('width');
            }

            if (this.element.attr('height') && !isNaN(this.element.attr('height'))) {
                this.dimension.h = this.element.attr('height');
            }

            this.ratio     = this.dimension.w / this.dimension.h;

            var w = this.parent.width(), h = this.parent.height(), width, height;

            // if element height < parent height (gap underneath)
            if ((w / this.ratio) < h) {

                width  = Math.ceil(h * this.ratio);
                height = h;

            // element width < parent width (gap to right)
            } else {

                width  = w;
                height = Math.ceil(w / this.ratio);
            }

            this.element.css({
                'width'  : width,
                'height' : height
            });
        }
    });

})(NGkit);


// Fork with following changes:
// * Default ajax method type == GET
(function(addon) {

    var component;

    if (window.NGkit) {
        component = addon(NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-autocomplete", ["ngkit"], function(){
            return component || addon(NGkit);
        });
    }

})(function(NG){

    "use strict";

    var active;

    NG.component('autocomplete', {

        defaults: {
            minLength: 3,
            param: 'search',
            method: 'get',
            delay: 300,
            loadingClass: 'ng-loading',
            flipDropdown: false,
            skipClass: 'ng-skip',
            hoverClass: 'ng-active',
            source: null,
            renderer: null,

            // template

            template: '<ul class="ng-nav ng-nav-autocomplete ng-autocomplete-results">{{~items}}<li data-value="{{$item.value}}"><a>{{$item.value}}</a></li>{{/items}}</ul>'
        },

        visible  : false,
        value    : null,
        selected : null,

        boot: function() {

            // init code
            NG.$html.on("focus.autocomplete.ngkit", "[data-ng-autocomplete]", function(e) {

                var ele = NG.$(this);

                if (!ele.data("autocomplete")) {
                    var obj = NG.autocomplete(ele, NG.Utils.options(ele.attr("data-ng-autocomplete")));
                }
            });

            // register outer click for autocompletes
            NG.$html.on("click.autocomplete.ngkit", function(e) {
                if (active && e.target!=active.input[0]) active.hide();
            });
        },

        init: function() {

            var $this   = this,
                select  = false,
                trigger = NG.Utils.debounce(function(e) {
                    if(select) {
                        return (select = false);
                    }
                    $this.handle();
                }, this.options.delay);


            this.dropdown = this.find('.ng-dropdown');
            this.template = this.find('script[type="text/autocomplete"]').html();
            this.template = NG.Utils.template(this.template || this.options.template);
            this.input    = this.find("input:first").attr("autocomplete", "off");

            if (!this.dropdown.length) {
               this.dropdown = $('<div class="ng-dropdown"></div>').appendTo(this.element);
            }

            if (this.options.flipDropdown) {
                this.dropdown.addClass('ng-dropdown-flip');
            }

            this.dropdown.attr('aria-expanded', 'false');

            this.input.on({
                "keydown": function(e) {

                    if (e && e.which && !e.shiftKey) {

                        switch (e.which) {
                            case 13: // enter
                                select = true;

                                if ($this.selected && $this.visible){
                                    e.preventDefault();
                                    $this.select();
                                }
                                break;
                            case 38: // up
                                e.preventDefault();
                                $this.pick('prev', true);
                                break;
                            case 40: // down
                                e.preventDefault();
                                $this.pick('next', true);
                                break;
                            case 27:
                            case 9: // esc, tab
                                $this.hide();
                                break;
                            default:
                                break;
                        }
                    }

                },
                "keyup": trigger,
            });

            this.dropdown.on("click", ".ng-autocomplete-results > *", function(){
                $this.select();
            });

            this.dropdown.on("mouseover", ".ng-autocomplete-results > *", function(){
                $this.pick(NG.$(this));
            });

            this.triggercomplete = trigger;
        },

        handle: function() {

            var $this = this, old = this.value;

            this.value = this.input.val();

            if (this.value.length < this.options.minLength) return this.hide();

            if (this.value != old) {
                $this.request();
            }

            return this;
        },

        pick: function(item, scrollinview) {

            var $this    = this,
                items    = this.dropdown.find('.ng-autocomplete-results').children(':not(.'+this.options.skipClass+')'),
                selected = false;

            if (typeof item !== "string" && !item.hasClass(this.options.skipClass)) {
                selected = item;
            } else if (item == 'next' || item == 'prev') {

                if (this.selected) {
                    var index = items.index(this.selected);

                    if (item == 'next') {
                        selected = items.eq(index + 1 < items.length ? index + 1 : 0);
                    } else {
                        selected = items.eq(index - 1 < 0 ? items.length - 1 : index - 1);
                    }

                } else {
                    selected = items[(item == 'next') ? 'first' : 'last']();
                }

                selected = NG.$(selected);
            }

            if (selected && selected.length) {
                this.selected = selected;
                items.removeClass(this.options.hoverClass);
                this.selected.addClass(this.options.hoverClass);

                // jump to selected if not in view
                if (scrollinview) {

                    var top       = selected.position().top,
                        scrollTop = $this.dropdown.scrollTop(),
                        dpheight  = $this.dropdown.height();

                    if (top > dpheight ||  top < 0) {
                        $this.dropdown.scrollTop(scrollTop + top);
                    }
                }
            }
        },

        select: function() {

            if(!this.selected) return;

            var data = this.selected.data();

            this.element.trigger("selectitem.ng.autocomplete", [data, this]);

            if (data.value) {
                this.input.val(data.value).trigger('change');
            }

            this.hide();
        },

        show: function() {
            if (this.visible) return;
            this.visible = true;
            this.element.addClass("ng-open");

            if (active && active!==this) {
                active.hide();
            }

            active = this;

            // Update aria
            this.dropdown.attr('aria-expanded', 'true');

            return this;
        },

        hide: function() {
            if (!this.visible) return;
            this.visible = false;
            this.element.removeClass("ng-open");

            if (active === this) {
                active = false;
            }

            // Update aria
            this.dropdown.attr('aria-expanded', 'false');

            return this;
        },

        request: function() {

            var $this   = this,
                release = function(data) {

                    if(data) {
                        $this.render(data);
                    }

                    $this.element.removeClass($this.options.loadingClass);
                };

            this.element.addClass(this.options.loadingClass);

            if (this.options.source) {

                var source = this.options.source;

                switch(typeof(this.options.source)) {
                    case 'function':

                        this.options.source.apply(this, [release]);

                        break;

                    case 'object':

                        if(source.length) {

                            var items = [];

                            source.forEach(function(item){
                                if(item.value && item.value.toLowerCase().indexOf($this.value.toLowerCase())!=-1) {
                                    items.push(item);
                                }
                            });

                            release(items);
                        }

                        break;

                    case 'string':

                        var params ={};

                        params[this.options.param] = this.value;

                        NG.$.ajax({
                            url: this.options.source,
                            data: params,
                            type: this.options.method,
                            dataType: 'json',
                        }).done(function(json) {
                            release(json || []);
                        });

                        break;

                    default:
                        release(null);
                }

            } else {
                this.element.removeClass($this.options.loadingClass);
            }
        },

        render: function(data) {

            var $this = this;

            this.dropdown.empty();

            this.selected = false;

            if (this.options.renderer) {

                this.options.renderer.apply(this, [data]);

            } else if(data && data.length) {

                this.dropdown.append(this.template({"items":data}));
                this.show();

                this.trigger('show.ng.autocomplete');
            }

            return this;
        }
    });

    return NG.autocomplete;
});


(function(addon) {

    var component;

    if (window.NGkit) {
        component = addon(NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-datepicker", ["ngkit"], function(){
            return component || addon(NGkit);
        });
    }

})(function(NG){

    "use strict";

    // Datepicker

    var active = false, dropdown, moment;

    NG.component('datepicker', {

        defaults: {
            mobile: false,
            weekstart: 1,
            i18n: {
                months        : ['January','February','March','April','May','June','July','August','September','October','November','December'],
                weekdays      : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
            },
            format: "YYYY-MM-DD",
            offsettop: 5,
            maxDate: false,
            minDate: false,
            pos: 'auto',
            template: function(data, opts) {

                var content = '', i;

                content += '<div class="ng-datepicker-nav">';
                content += '<a href="" class="ng-datepicker-previous"></a>';
                content += '<a href="" class="ng-datepicker-next"></a>';

                if (NG.formSelect) {

                    var currentyear = (new Date()).getFullYear(), options = [], months, years, minYear, maxYear;

                    for (i=0;i<opts.i18n.months.length;i++) {
                        if(i==data.month) {
                            options.push('<option value="'+i+'" selected>'+opts.i18n.months[i]+'</option>');
                        } else {
                            options.push('<option value="'+i+'">'+opts.i18n.months[i]+'</option>');
                        }
                    }

                    months = '<span class="ng-form-select">'+ opts.i18n.months[data.month] + '<select class="update-picker-month">'+options.join('')+'</select></span>';

                    // --

                    options = [];

                    minYear = data.minDate ? data.minDate.year() : currentyear - 50;
                    maxYear = data.maxDate ? data.maxDate.year() : currentyear + 20;

                    for (i=minYear;i<=maxYear;i++) {
                        if (i == data.year) {
                            options.push('<option value="'+i+'" selected>'+i+'</option>');
                        } else {
                            options.push('<option value="'+i+'">'+i+'</option>');
                        }
                    }

                    years  = '<span class="ng-form-select">'+ data.year + '<select class="update-picker-year">'+options.join('')+'</select></span>';

                    content += '<div class="ng-datepicker-heading">'+ months + ' ' + years +'</div>';

                } else {
                    content += '<div class="ng-datepicker-heading">'+ opts.i18n.months[data.month] +' '+ data.year+'</div>';
                }

                content += '</div>';

                content += '<table class="ng-datepicker-table">';
                content += '<thead>';
                for(i = 0; i < data.weekdays.length; i++) {
                    if (data.weekdays[i]) {
                        content += '<th>'+data.weekdays[i]+'</th>';
                    }
                }
                content += '</thead>';

                content += '<tbody>';
                for(i = 0; i < data.days.length; i++) {
                    if (data.days[i] && data.days[i].length){
                        content += '<tr>';
                        for(var d = 0; d < data.days[i].length; d++) {
                            if (data.days[i][d]) {
                                var day = data.days[i][d],
                                    cls = [];

                                if(!day.inmonth) cls.push("ng-datepicker-table-muted");
                                if(day.selected) cls.push("ng-active");
                                if(day.disabled) cls.push('ng-datepicker-date-disabled ng-datepicker-table-muted');

                                content += '<td><a href="" class="'+cls.join(" ")+'" data-date="'+day.day.format()+'">'+day.day.format("D")+'</a></td>';
                            }
                        }
                        content += '</tr>';
                    }
                }
                content += '</tbody>';

                content += '</table>';

                return content;
            }
        },

        boot: function() {

            NG.$win.on("resize orientationchange", function() {

                if (active) {
                    active.hide();
                }
            });

            // init code
            NG.$html.on("focus.datepicker.ngkit", "[data-ng-datepicker]", function(e) {

                var ele = NG.$(this);

                if (!ele.data("datepicker")) {
                    e.preventDefault();
                    NG.datepicker(ele, NG.Utils.options(ele.attr("data-ng-datepicker")));
                    ele.trigger("focus");
                }
            });

            NG.$html.on("click focus", '*', function(e) {

                var target = NG.$(e.target);

                if (active && target[0] != dropdown[0] && !target.data("datepicker") && !target.parents(".ng-datepicker:first").length) {
                    active.hide();
                }
            });
        },

        init: function() {

            // use native datepicker on touch devices
            if (NG.support.touch && this.element.attr('type')=='date' && !this.options.mobile) {
                return;
            }

            var $this = this;

            this.current  = this.element.val() ? moment(this.element.val(), this.options.format) : moment();

            this.on("click focus", function(){
                if (active!==$this) $this.pick(this.value ? this.value:($this.options.minDate ? $this.options.minDate :''));
            }).on("change", function(){

                if ($this.element.val() && !moment($this.element.val(), $this.options.format).isValid()) {
                   $this.element.val(moment().format($this.options.format));
                }
            });

            // init dropdown
            if (!dropdown) {

                dropdown = NG.$('<div class="ng-dropdown ng-datepicker"></div>');

                dropdown.on("click", ".ng-datepicker-next, .ng-datepicker-previous, [data-date]", function(e){

                    e.stopPropagation();
                    e.preventDefault();

                    var ele = NG.$(this);

                    if (ele.hasClass('ng-datepicker-date-disabled')) return false;

                    if (ele.is('[data-date]')) {
                        active.current = moment(ele.data("date"));
                        active.element.val(active.current.isValid() ? active.current.format(active.options.format) : null).trigger("change");
                        active.hide();
                    } else {
                       active.add((ele.hasClass("ng-datepicker-next") ? 1:-1), "months");
                    }
                });

                dropdown.on('change', '.update-picker-month, .update-picker-year', function(){

                    var select = NG.$(this);
                    active[select.is('.update-picker-year') ? 'setYear':'setMonth'](Number(select.val()));
                });

                dropdown.appendTo("body");
            }
        },

        pick: function(initdate) {

            var offset = this.element.offset(),
                css    = {"left": offset.left, "right":""};

            this.current  = isNaN(initdate) ? moment(initdate, this.options.format):moment();
            this.initdate = this.current.format("YYYY-MM-DD");

            this.update();

            if (NG.langdirection == 'right') {
                css.right = window.innerWidth - (css.left + this.element.outerWidth());
                css.left  = "";
            }

            var posTop    = (offset.top - this.element.outerHeight() + this.element.height()) - this.options.offsettop - dropdown.outerHeight(),
                posBottom = offset.top + this.element.outerHeight() + this.options.offsettop;

            css.top = posBottom;

            if (this.options.pos == 'top') {
                css.top = posTop;
            } else if(this.options.pos == 'auto' && (window.innerHeight - posBottom - dropdown.outerHeight() < 0 && posTop >= 0) ) {
                css.top = posTop;
            }

            dropdown.css(css).show();
            this.trigger('show.ng.datepicker');

            active = this;
        },

        add: function(unit, value) {
            this.current.add(unit, value);
            this.update();
        },

        setMonth: function(month) {
            this.current.month(month);
            this.update();
        },

        setYear: function(year) {
            this.current.year(year);
            this.update();
        },

        update: function() {

            var data = this.getRows(this.current.year(), this.current.month()),
                tpl  = this.options.template(data, this.options);

            dropdown.html(tpl);

            this.trigger('update.ng.datepicker');
        },

        getRows: function(year, month) {

            var opts   = this.options,
                now    = moment().format('YYYY-MM-DD'),
                days   = [31, (year % 4 === 0 && year % 100 !== 0 || year % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month],
                before = new Date(year, month, 1, 12).getDay(),
                data   = {"month":month, "year":year,"weekdays":[],"days":[], "maxDate": false, "minDate": false},
                row    = [];

            if (opts.maxDate!==false){
                data.maxDate = isNaN(opts.maxDate) ? moment(opts.maxDate, opts.format) : moment().add(opts.maxDate, 'days');
            }

            if (opts.minDate!==false){
                data.minDate = isNaN(opts.minDate) ? moment(opts.minDate, opts.format) : moment().add(opts.minDate-1, 'days');
            }

            data.weekdays = (function(){

                for (var i=0, arr=[]; i < 7; i++) {

                    var day = i + (opts.weekstart || 0);

                    while (day >= 7) {
                        day -= 7;
                    }

                    arr.push(opts.i18n.weekdays[day]);
                }

                return arr;
            })();

            if (opts.weekstart && opts.weekstart > 0) {
                before -= opts.weekstart;
                if (before < 0) {
                    before += 7;
                }
            }

            var cells = days + before, after = cells;

            while(after > 7) { after -= 7; }

            cells += 7 - after;

            var day, isDisabled, isSelected, isToday, isInMonth;

            for (var i = 0, r = 0; i < cells; i++) {

                day        = new Date(year, month, 1 + (i - before), 12);
                isDisabled = (data.minDate && data.minDate > day) || (data.maxDate && day > data.maxDate);
                isInMonth  = !(i < before || i >= (days + before));

                day = moment(day);

                isSelected = this.initdate == day.format("YYYY-MM-DD");
                isToday    = now == day.format("YYYY-MM-DD");

                row.push({"selected": isSelected, "today": isToday, "disabled": isDisabled, "day":day, "inmonth":isInMonth});

                if (++r === 7) {
                    data.days.push(row);
                    row = [];
                    r = 0;
                }
            }

            return data;
        },

        hide: function() {

            if (active && active === this) {
                dropdown.hide();
                active = false;

                this.trigger('hide.ng.datepicker');
            }
        }
    });

    //! moment.js
    //! version : 2.8.3
    //! authors : Tim Wood, Iskren Chernev, Moment.js contributors
    //! license : MIT
    //! momentjs.com

    moment = (function (undefined) {
        /************************************
            Constants
        ************************************/
        var moment,
            VERSION = '2.8.3',
            // the global-scope this is NOT the global object in Node.js
            globalScope = typeof global !== 'undefined' ? global : this,
            oldGlobalMoment,
            round = Math.round,
            hasOwnProperty = Object.prototype.hasOwnProperty,
            i,

            YEAR = 0,
            MONTH = 1,
            DATE = 2,
            HOUR = 3,
            MINUTE = 4,
            SECOND = 5,
            MILLISECOND = 6,

            // internal storage for locale config files
            locales = {},

            // extra moment internal properties (plugins register props here)
            momentProperties = [],

            // check for nodeJS
            hasModule = (typeof module !== 'undefined' && module.exports),

            // ASP.NET json date format regex
            aspNetJsonRegex = /^\/?Date\((\-?\d+)/i,
            aspNetTimeSpanJsonRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,

            // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
            // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
            isoDurationRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,

            // format tokens
            formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Q|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|X|zz?|ZZ?|.)/g,
            localFormattingTokens = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,

            // parsing token regexes
            parseTokenOneOrTwoDigits = /\d\d?/, // 0 - 99
            parseTokenOneToThreeDigits = /\d{1,3}/, // 0 - 999
            parseTokenOneToFourDigits = /\d{1,4}/, // 0 - 9999
            parseTokenOneToSixDigits = /[+\-]?\d{1,6}/, // -999,999 - 999,999
            parseTokenDigits = /\d+/, // nonzero number of digits
            parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i, // any word (or two) characters or numbers including two/three word month in arabic.
            parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/gi, // +00:00 -00:00 +0000 -0000 or Z
            parseTokenT = /T/i, // T (ISO separator)
            parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123
            parseTokenOrdinal = /\d{1,2}/,

            //strict parsing regexes
            parseTokenOneDigit = /\d/, // 0 - 9
            parseTokenTwoDigits = /\d\d/, // 00 - 99
            parseTokenThreeDigits = /\d{3}/, // 000 - 999
            parseTokenFourDigits = /\d{4}/, // 0000 - 9999
            parseTokenSixDigits = /[+-]?\d{6}/, // -999,999 - 999,999
            parseTokenSignedNumber = /[+-]?\d+/, // -inf - inf

            // iso 8601 regex
            // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
            isoRegex = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,

            isoFormat = 'YYYY-MM-DDTHH:mm:ssZ',

            isoDates = [
                ['YYYYYY-MM-DD', /[+-]\d{6}-\d{2}-\d{2}/],
                ['YYYY-MM-DD', /\d{4}-\d{2}-\d{2}/],
                ['GGGG-[W]WW-E', /\d{4}-W\d{2}-\d/],
                ['GGGG-[W]WW', /\d{4}-W\d{2}/],
                ['YYYY-DDD', /\d{4}-\d{3}/]
            ],

            // iso time formats and regexes
            isoTimes = [
                ['HH:mm:ss.SSSS', /(T| )\d\d:\d\d:\d\d\.\d+/],
                ['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/],
                ['HH:mm', /(T| )\d\d:\d\d/],
                ['HH', /(T| )\d\d/]
            ],

            // timezone chunker '+10:00' > ['10', '00'] or '-1530' > ['-15', '30']
            parseTimezoneChunker = /([\+\-]|\d\d)/gi,

            // getter and setter names
            proxyGettersAndSetters = 'Date|Hours|Minutes|Seconds|Milliseconds'.split('|'),
            unitMillisecondFactors = {
                'Milliseconds' : 1,
                'Seconds' : 1e3,
                'Minutes' : 6e4,
                'Hours' : 36e5,
                'Days' : 864e5,
                'Months' : 2592e6,
                'Years' : 31536e6
            },

            unitAliases = {
                ms : 'millisecond',
                s : 'second',
                m : 'minute',
                h : 'hour',
                d : 'day',
                D : 'date',
                w : 'week',
                W : 'isoWeek',
                M : 'month',
                Q : 'quarter',
                y : 'year',
                DDD : 'dayOfYear',
                e : 'weekday',
                E : 'isoWeekday',
                gg: 'weekYear',
                GG: 'isoWeekYear'
            },

            camelFunctions = {
                dayofyear : 'dayOfYear',
                isoweekday : 'isoWeekday',
                isoweek : 'isoWeek',
                weekyear : 'weekYear',
                isoweekyear : 'isoWeekYear'
            },

            // format function strings
            formatFunctions = {},

            // default relative time thresholds
            relativeTimeThresholds = {
                s: 45,  // seconds to minute
                m: 45,  // minutes to hour
                h: 22,  // hours to day
                d: 26,  // days to month
                M: 11   // months to year
            },

            // tokens to ordinalize and pad
            ordinalizeTokens = 'DDD w W M D d'.split(' '),
            paddedTokens = 'M D H h m s w W'.split(' '),

            formatTokenFunctions = {
                M    : function () {
                    return this.month() + 1;
                },
                MMM  : function (format) {
                    return this.localeData().monthsShort(this, format);
                },
                MMMM : function (format) {
                    return this.localeData().months(this, format);
                },
                D    : function () {
                    return this.date();
                },
                DDD  : function () {
                    return this.dayOfYear();
                },
                d    : function () {
                    return this.day();
                },
                dd   : function (format) {
                    return this.localeData().weekdaysMin(this, format);
                },
                ddd  : function (format) {
                    return this.localeData().weekdaysShort(this, format);
                },
                dddd : function (format) {
                    return this.localeData().weekdays(this, format);
                },
                w    : function () {
                    return this.week();
                },
                W    : function () {
                    return this.isoWeek();
                },
                YY   : function () {
                    return leftZeroFill(this.year() % 100, 2);
                },
                YYYY : function () {
                    return leftZeroFill(this.year(), 4);
                },
                YYYYY : function () {
                    return leftZeroFill(this.year(), 5);
                },
                YYYYYY : function () {
                    var y = this.year(), sign = y >= 0 ? '+' : '-';
                    return sign + leftZeroFill(Math.abs(y), 6);
                },
                gg   : function () {
                    return leftZeroFill(this.weekYear() % 100, 2);
                },
                gggg : function () {
                    return leftZeroFill(this.weekYear(), 4);
                },
                ggggg : function () {
                    return leftZeroFill(this.weekYear(), 5);
                },
                GG   : function () {
                    return leftZeroFill(this.isoWeekYear() % 100, 2);
                },
                GGGG : function () {
                    return leftZeroFill(this.isoWeekYear(), 4);
                },
                GGGGG : function () {
                    return leftZeroFill(this.isoWeekYear(), 5);
                },
                e : function () {
                    return this.weekday();
                },
                E : function () {
                    return this.isoWeekday();
                },
                a    : function () {
                    return this.localeData().meridiem(this.hours(), this.minutes(), true);
                },
                A    : function () {
                    return this.localeData().meridiem(this.hours(), this.minutes(), false);
                },
                H    : function () {
                    return this.hours();
                },
                h    : function () {
                    return this.hours() % 12 || 12;
                },
                m    : function () {
                    return this.minutes();
                },
                s    : function () {
                    return this.seconds();
                },
                S    : function () {
                    return toInt(this.milliseconds() / 100);
                },
                SS   : function () {
                    return leftZeroFill(toInt(this.milliseconds() / 10), 2);
                },
                SSS  : function () {
                    return leftZeroFill(this.milliseconds(), 3);
                },
                SSSS : function () {
                    return leftZeroFill(this.milliseconds(), 3);
                },
                Z    : function () {
                    var a = -this.zone(),
                        b = '+';
                    if (a < 0) {
                        a = -a;
                        b = '-';
                    }
                    return b + leftZeroFill(toInt(a / 60), 2) + ':' + leftZeroFill(toInt(a) % 60, 2);
                },
                ZZ   : function () {
                    var a = -this.zone(),
                        b = '+';
                    if (a < 0) {
                        a = -a;
                        b = '-';
                    }
                    return b + leftZeroFill(toInt(a / 60), 2) + leftZeroFill(toInt(a) % 60, 2);
                },
                z : function () {
                    return this.zoneAbbr();
                },
                zz : function () {
                    return this.zoneName();
                },
                X    : function () {
                    return this.unix();
                },
                Q : function () {
                    return this.quarter();
                }
            },

            deprecations = {},

            lists = ['months', 'monthsShort', 'weekdays', 'weekdaysShort', 'weekdaysMin'];

        // Pick the first defined of two or three arguments. dfl comes from
        // default.
        function dfl(a, b, c) {
            switch (arguments.length) {
                case 2: return a != null ? a : b;
                case 3: return a != null ? a : b != null ? b : c;
                default: throw new Error('Implement me');
            }
        }

        function hasOwnProp(a, b) {
            return hasOwnProperty.call(a, b);
        }

        function defaultParsingFlags() {
            // We need to deep clone this object, and es5 standard is not very
            // helpful.
            return {
                empty : false,
                unusedTokens : [],
                unusedInput : [],
                overflow : -2,
                charsLeftOver : 0,
                nullInput : false,
                invalidMonth : null,
                invalidFormat : false,
                userInvalidated : false,
                iso: false
            };
        }

        function printMsg(msg) {
            if (moment.suppressDeprecationWarnings === false &&
                    typeof console !== 'undefined' && console.warn) {
                console.warn('Deprecation warning: ' + msg);
            }
        }

        function deprecate(msg, fn) {
            var firstTime = true;
            return extend(function () {
                if (firstTime) {
                    printMsg(msg);
                    firstTime = false;
                }
                return fn.apply(this, arguments);
            }, fn);
        }

        function deprecateSimple(name, msg) {
            if (!deprecations[name]) {
                printMsg(msg);
                deprecations[name] = true;
            }
        }

        function padToken(func, count) {
            return function (a) {
                return leftZeroFill(func.call(this, a), count);
            };
        }
        function ordinalizeToken(func, period) {
            return function (a) {
                return this.localeData().ordinal(func.call(this, a), period);
            };
        }

        while (ordinalizeTokens.length) {
            i = ordinalizeTokens.pop();
            formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i], i);
        }
        while (paddedTokens.length) {
            i = paddedTokens.pop();
            formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
        }
        formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);


        /************************************
            Constructors
        ************************************/

        function Locale() {
        }

        // Moment prototype object
        function Moment(config, skipOverflow) {
            if (skipOverflow !== false) {
                checkOverflow(config);
            }
            copyConfig(this, config);
            this._d = new Date(+config._d);
        }

        // Duration Constructor
        function Duration(duration) {
            var normalizedInput = normalizeObjectUnits(duration),
                years = normalizedInput.year || 0,
                quarters = normalizedInput.quarter || 0,
                months = normalizedInput.month || 0,
                weeks = normalizedInput.week || 0,
                days = normalizedInput.day || 0,
                hours = normalizedInput.hour || 0,
                minutes = normalizedInput.minute || 0,
                seconds = normalizedInput.second || 0,
                milliseconds = normalizedInput.millisecond || 0;

            // representation for dateAddRemove
            this._milliseconds = +milliseconds +
                seconds * 1e3 + // 1000
                minutes * 6e4 + // 1000 * 60
                hours * 36e5; // 1000 * 60 * 60
            // Because of dateAddRemove treats 24 hours as different from a
            // day when working around DST, we need to store them separately
            this._days = +days +
                weeks * 7;
            // It is impossible translate months into days without knowing
            // which months you are are talking about, so we have to store
            // it separately.
            this._months = +months +
                quarters * 3 +
                years * 12;

            this._data = {};

            this._locale = moment.localeData();

            this._bubble();
        }

        /************************************
            Helpers
        ************************************/


        function extend(a, b) {
            for (var i in b) {
                if (hasOwnProp(b, i)) {
                    a[i] = b[i];
                }
            }

            if (hasOwnProp(b, 'toString')) {
                a.toString = b.toString;
            }

            if (hasOwnProp(b, 'valueOf')) {
                a.valueOf = b.valueOf;
            }

            return a;
        }

        function copyConfig(to, from) {
            var i, prop, val;

            if (typeof from._isAMomentObject !== 'undefined') {
                to._isAMomentObject = from._isAMomentObject;
            }
            if (typeof from._i !== 'undefined') {
                to._i = from._i;
            }
            if (typeof from._f !== 'undefined') {
                to._f = from._f;
            }
            if (typeof from._l !== 'undefined') {
                to._l = from._l;
            }
            if (typeof from._strict !== 'undefined') {
                to._strict = from._strict;
            }
            if (typeof from._tzm !== 'undefined') {
                to._tzm = from._tzm;
            }
            if (typeof from._isUTC !== 'undefined') {
                to._isUTC = from._isUTC;
            }
            if (typeof from._offset !== 'undefined') {
                to._offset = from._offset;
            }
            if (typeof from._pf !== 'undefined') {
                to._pf = from._pf;
            }
            if (typeof from._locale !== 'undefined') {
                to._locale = from._locale;
            }

            if (momentProperties.length > 0) {
                for (i in momentProperties) {
                    prop = momentProperties[i];
                    val = from[prop];
                    if (typeof val !== 'undefined') {
                        to[prop] = val;
                    }
                }
            }

            return to;
        }

        function absRound(number) {
            if (number < 0) {
                return Math.ceil(number);
            } else {
                return Math.floor(number);
            }
        }

        // left zero fill a number
        // see http://jsperf.com/left-zero-filling for performance comparison
        function leftZeroFill(number, targetLength, forceSign) {
            var output = '' + Math.abs(number),
                sign = number >= 0;

            while (output.length < targetLength) {
                output = '0' + output;
            }
            return (sign ? (forceSign ? '+' : '') : '-') + output;
        }

        function positiveMomentsDifference(base, other) {
            var res = {milliseconds: 0, months: 0};

            res.months = other.month() - base.month() +
                (other.year() - base.year()) * 12;
            if (base.clone().add(res.months, 'M').isAfter(other)) {
                --res.months;
            }

            res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

            return res;
        }

        function momentsDifference(base, other) {
            var res;
            other = makeAs(other, base);
            if (base.isBefore(other)) {
                res = positiveMomentsDifference(base, other);
            } else {
                res = positiveMomentsDifference(other, base);
                res.milliseconds = -res.milliseconds;
                res.months = -res.months;
            }

            return res;
        }

        // TODO: remove 'name' arg after deprecation is removed
        function createAdder(direction, name) {
            return function (val, period) {
                var dur, tmp;
                //invert the arguments, but complain about it
                if (period !== null && !isNaN(+period)) {
                    deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period).');
                    tmp = val; val = period; period = tmp;
                }

                val = typeof val === 'string' ? +val : val;
                dur = moment.duration(val, period);
                addOrSubtractDurationFromMoment(this, dur, direction);
                return this;
            };
        }

        function addOrSubtractDurationFromMoment(mom, duration, isAdding, updateOffset) {
            var milliseconds = duration._milliseconds,
                days = duration._days,
                months = duration._months;
            updateOffset = updateOffset == null ? true : updateOffset;

            if (milliseconds) {
                mom._d.setTime(+mom._d + milliseconds * isAdding);
            }
            if (days) {
                rawSetter(mom, 'Date', rawGetter(mom, 'Date') + days * isAdding);
            }
            if (months) {
                rawMonthSetter(mom, rawGetter(mom, 'Month') + months * isAdding);
            }
            if (updateOffset) {
                moment.updateOffset(mom, days || months);
            }
        }

        // check if is an array
        function isArray(input) {
            return Object.prototype.toString.call(input) === '[object Array]';
        }

        function isDate(input) {
            return Object.prototype.toString.call(input) === '[object Date]' ||
                input instanceof Date;
        }

        // compare two arrays, return the number of differences
        function compareArrays(array1, array2, dontConvert) {
            var len = Math.min(array1.length, array2.length),
                lengthDiff = Math.abs(array1.length - array2.length),
                diffs = 0,
                i;
            for (i = 0; i < len; i++) {
                if ((dontConvert && array1[i] !== array2[i]) ||
                    (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                    diffs++;
                }
            }
            return diffs + lengthDiff;
        }

        function normalizeUnits(units) {
            if (units) {
                var lowered = units.toLowerCase().replace(/(.)s$/, '$1');
                units = unitAliases[units] || camelFunctions[lowered] || lowered;
            }
            return units;
        }

        function normalizeObjectUnits(inputObject) {
            var normalizedInput = {},
                normalizedProp,
                prop;

            for (prop in inputObject) {
                if (hasOwnProp(inputObject, prop)) {
                    normalizedProp = normalizeUnits(prop);
                    if (normalizedProp) {
                        normalizedInput[normalizedProp] = inputObject[prop];
                    }
                }
            }

            return normalizedInput;
        }

        function makeList(field) {
            var count, setter;

            if (field.indexOf('week') === 0) {
                count = 7;
                setter = 'day';
            }
            else if (field.indexOf('month') === 0) {
                count = 12;
                setter = 'month';
            }
            else {
                return;
            }

            moment[field] = function (format, index) {
                var i, getter,
                    method = moment._locale[field],
                    results = [];

                if (typeof format === 'number') {
                    index = format;
                    format = undefined;
                }

                getter = function (i) {
                    var m = moment().utc().set(setter, i);
                    return method.call(moment._locale, m, format || '');
                };

                if (index != null) {
                    return getter(index);
                }
                else {
                    for (i = 0; i < count; i++) {
                        results.push(getter(i));
                    }
                    return results;
                }
            };
        }

        function toInt(argumentForCoercion) {
            var coercedNumber = +argumentForCoercion,
                value = 0;

            if (coercedNumber !== 0 && isFinite(coercedNumber)) {
                if (coercedNumber >= 0) {
                    value = Math.floor(coercedNumber);
                } else {
                    value = Math.ceil(coercedNumber);
                }
            }

            return value;
        }

        function daysInMonth(year, month) {
            return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        }

        function weeksInYear(year, dow, doy) {
            return weekOfYear(moment([year, 11, 31 + dow - doy]), dow, doy).week;
        }

        function daysInYear(year) {
            return isLeapYear(year) ? 366 : 365;
        }

        function isLeapYear(year) {
            return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        }

        function checkOverflow(m) {
            var overflow;
            if (m._a && m._pf.overflow === -2) {
                overflow =
                    m._a[MONTH] < 0 || m._a[MONTH] > 11 ? MONTH :
                    m._a[DATE] < 1 || m._a[DATE] > daysInMonth(m._a[YEAR], m._a[MONTH]) ? DATE :
                    m._a[HOUR] < 0 || m._a[HOUR] > 23 ? HOUR :
                    m._a[MINUTE] < 0 || m._a[MINUTE] > 59 ? MINUTE :
                    m._a[SECOND] < 0 || m._a[SECOND] > 59 ? SECOND :
                    m._a[MILLISECOND] < 0 || m._a[MILLISECOND] > 999 ? MILLISECOND :
                    -1;

                if (m._pf._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                    overflow = DATE;
                }

                m._pf.overflow = overflow;
            }
        }

        function isValid(m) {
            if (m._isValid == null) {
                m._isValid = !isNaN(m._d.getTime()) &&
                    m._pf.overflow < 0 &&
                    !m._pf.empty &&
                    !m._pf.invalidMonth &&
                    !m._pf.nullInput &&
                    !m._pf.invalidFormat &&
                    !m._pf.userInvalidated;

                if (m._strict) {
                    m._isValid = m._isValid &&
                        m._pf.charsLeftOver === 0 &&
                        m._pf.unusedTokens.length === 0;
                }
            }
            return m._isValid;
        }

        function normalizeLocale(key) {
            return key ? key.toLowerCase().replace('_', '-') : key;
        }

        // pick the locale from the array
        // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
        // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
        function chooseLocale(names) {
            var i = 0, j, next, locale, split;

            while (i < names.length) {
                split = normalizeLocale(names[i]).split('-');
                j = split.length;
                next = normalizeLocale(names[i + 1]);
                next = next ? next.split('-') : null;
                while (j > 0) {
                    locale = loadLocale(split.slice(0, j).join('-'));
                    if (locale) {
                        return locale;
                    }
                    if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                        //the next array item is better than a shallower substring of this one
                        break;
                    }
                    j--;
                }
                i++;
            }
            return null;
        }

        function loadLocale(name) {
            var oldLocale = null;
            if (!locales[name] && hasModule) {
                try {
                    oldLocale = moment.locale();
                    require('./locale/' + name);
                    // because defineLocale currently also sets the global locale, we want to undo that for lazy loaded locales
                    moment.locale(oldLocale);
                } catch (e) { }
            }
            return locales[name];
        }

        // Return a moment from input, that is local/utc/zone equivalent to model.
        function makeAs(input, model) {
            return model._isUTC ? moment(input).zone(model._offset || 0) :
                moment(input).local();
        }

        /************************************
            Locale
        ************************************/


        extend(Locale.prototype, {

            set : function (config) {
                var prop, i;
                for (i in config) {
                    prop = config[i];
                    if (typeof prop === 'function') {
                        this[i] = prop;
                    } else {
                        this['_' + i] = prop;
                    }
                }
            },

            _months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
            months : function (m) {
                return this._months[m.month()];
            },

            _monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
            monthsShort : function (m) {
                return this._monthsShort[m.month()];
            },

            monthsParse : function (monthName) {
                var i, mom, regex;

                if (!this._monthsParse) {
                    this._monthsParse = [];
                }

                for (i = 0; i < 12; i++) {
                    // make the regex if we don't have it already
                    if (!this._monthsParse[i]) {
                        mom = moment.utc([2000, i]);
                        regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                        this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
                    }
                    // test the regex
                    if (this._monthsParse[i].test(monthName)) {
                        return i;
                    }
                }
            },

            _weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
            weekdays : function (m) {
                return this._weekdays[m.day()];
            },

            _weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
            weekdaysShort : function (m) {
                return this._weekdaysShort[m.day()];
            },

            _weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
            weekdaysMin : function (m) {
                return this._weekdaysMin[m.day()];
            },

            weekdaysParse : function (weekdayName) {
                var i, mom, regex;

                if (!this._weekdaysParse) {
                    this._weekdaysParse = [];
                }

                for (i = 0; i < 7; i++) {
                    // make the regex if we don't have it already
                    if (!this._weekdaysParse[i]) {
                        mom = moment([2000, 1]).day(i);
                        regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                        this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
                    }
                    // test the regex
                    if (this._weekdaysParse[i].test(weekdayName)) {
                        return i;
                    }
                }
            },

            _longDateFormat : {
                LT : 'h:mm A',
                L : 'MM/DD/YYYY',
                LL : 'MMMM D, YYYY',
                LLL : 'MMMM D, YYYY LT',
                LLLL : 'dddd, MMMM D, YYYY LT'
            },
            longDateFormat : function (key) {
                var output = this._longDateFormat[key];
                if (!output && this._longDateFormat[key.toUpperCase()]) {
                    output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (val) {
                        return val.slice(1);
                    });
                    this._longDateFormat[key] = output;
                }
                return output;
            },

            isPM : function (input) {
                // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
                // Using charAt should be more compatible.
                return ((input + '').toLowerCase().charAt(0) === 'p');
            },

            _meridiemParse : /[ap]\.?m?\.?/i,
            meridiem : function (hours, minutes, isLower) {
                if (hours > 11) {
                    return isLower ? 'pm' : 'PM';
                } else {
                    return isLower ? 'am' : 'AM';
                }
            },

            _calendar : {
                sameDay : '[Today at] LT',
                nextDay : '[Tomorrow at] LT',
                nextWeek : 'dddd [at] LT',
                lastDay : '[Yesterday at] LT',
                lastWeek : '[Last] dddd [at] LT',
                sameElse : 'L'
            },
            calendar : function (key, mom) {
                var output = this._calendar[key];
                return typeof output === 'function' ? output.apply(mom) : output;
            },

            _relativeTime : {
                future : 'in %s',
                past : '%s ago',
                s : 'a few seconds',
                m : 'a minute',
                mm : '%d minutes',
                h : 'an hour',
                hh : '%d hours',
                d : 'a day',
                dd : '%d days',
                M : 'a month',
                MM : '%d months',
                y : 'a year',
                yy : '%d years'
            },

            relativeTime : function (number, withoutSuffix, string, isFuture) {
                var output = this._relativeTime[string];
                return (typeof output === 'function') ?
                    output(number, withoutSuffix, string, isFuture) :
                    output.replace(/%d/i, number);
            },

            pastFuture : function (diff, output) {
                var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
                return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
            },

            ordinal : function (number) {
                return this._ordinal.replace('%d', number);
            },
            _ordinal : '%d',

            preparse : function (string) {
                return string;
            },

            postformat : function (string) {
                return string;
            },

            week : function (mom) {
                return weekOfYear(mom, this._week.dow, this._week.doy).week;
            },

            _week : {
                dow : 0, // Sunday is the first day of the week.
                doy : 6  // The week that contains Jan 1st is the first week of the year.
            },

            _invalidDate: 'Invalid date',
            invalidDate: function () {
                return this._invalidDate;
            }
        });

        /************************************
            Formatting
        ************************************/


        function removeFormattingTokens(input) {
            if (input.match(/\[[\s\S]/)) {
                return input.replace(/^\[|\]$/g, '');
            }
            return input.replace(/\\/g, '');
        }

        function makeFormatFunction(format) {
            var array = format.match(formattingTokens), i, length;

            for (i = 0, length = array.length; i < length; i++) {
                if (formatTokenFunctions[array[i]]) {
                    array[i] = formatTokenFunctions[array[i]];
                } else {
                    array[i] = removeFormattingTokens(array[i]);
                }
            }

            return function (mom) {
                var output = '';
                for (i = 0; i < length; i++) {
                    output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
                }
                return output;
            };
        }

        // format date using native date object
        function formatMoment(m, format) {
            if (!m.isValid()) {
                return m.localeData().invalidDate();
            }

            format = expandFormat(format, m.localeData());

            if (!formatFunctions[format]) {
                formatFunctions[format] = makeFormatFunction(format);
            }

            return formatFunctions[format](m);
        }

        function expandFormat(format, locale) {
            var i = 5;

            function replaceLongDateFormatTokens(input) {
                return locale.longDateFormat(input) || input;
            }

            localFormattingTokens.lastIndex = 0;
            while (i >= 0 && localFormattingTokens.test(format)) {
                format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
                localFormattingTokens.lastIndex = 0;
                i -= 1;
            }

            return format;
        }


        /************************************
            Parsing
        ************************************/


        // get the regex to find the next token
        function getParseRegexForToken(token, config) {
            var a, strict = config._strict;
            switch (token) {
            case 'Q':
                return parseTokenOneDigit;
            case 'DDDD':
                return parseTokenThreeDigits;
            case 'YYYY':
            case 'GGGG':
            case 'gggg':
                return strict ? parseTokenFourDigits : parseTokenOneToFourDigits;
            case 'Y':
            case 'G':
            case 'g':
                return parseTokenSignedNumber;
            case 'YYYYYY':
            case 'YYYYY':
            case 'GGGGG':
            case 'ggggg':
                return strict ? parseTokenSixDigits : parseTokenOneToSixDigits;
            case 'S':
                if (strict) {
                    return parseTokenOneDigit;
                }
                /* falls through */
            case 'SS':
                if (strict) {
                    return parseTokenTwoDigits;
                }
                /* falls through */
            case 'SSS':
                if (strict) {
                    return parseTokenThreeDigits;
                }
                /* falls through */
            case 'DDD':
                return parseTokenOneToThreeDigits;
            case 'MMM':
            case 'MMMM':
            case 'dd':
            case 'ddd':
            case 'dddd':
                return parseTokenWord;
            case 'a':
            case 'A':
                return config._locale._meridiemParse;
            case 'X':
                return parseTokenTimestampMs;
            case 'Z':
            case 'ZZ':
                return parseTokenTimezone;
            case 'T':
                return parseTokenT;
            case 'SSSS':
                return parseTokenDigits;
            case 'MM':
            case 'DD':
            case 'YY':
            case 'GG':
            case 'gg':
            case 'HH':
            case 'hh':
            case 'mm':
            case 'ss':
            case 'ww':
            case 'WW':
                return strict ? parseTokenTwoDigits : parseTokenOneOrTwoDigits;
            case 'M':
            case 'D':
            case 'd':
            case 'H':
            case 'h':
            case 'm':
            case 's':
            case 'w':
            case 'W':
            case 'e':
            case 'E':
                return parseTokenOneOrTwoDigits;
            case 'Do':
                return parseTokenOrdinal;
            default :
                a = new RegExp(regexpEscape(unescapeFormat(token.replace('\\', '')), 'i'));
                return a;
            }
        }

        function timezoneMinutesFromString(string) {
            string = string || '';
            var possibleTzMatches = (string.match(parseTokenTimezone) || []),
                tzChunk = possibleTzMatches[possibleTzMatches.length - 1] || [],
                parts = (tzChunk + '').match(parseTimezoneChunker) || ['-', 0, 0],
                minutes = +(parts[1] * 60) + toInt(parts[2]);

            return parts[0] === '+' ? -minutes : minutes;
        }

        // function to convert string input to date
        function addTimeToArrayFromToken(token, input, config) {
            var a, datePartArray = config._a;

            switch (token) {
            // QUARTER
            case 'Q':
                if (input != null) {
                    datePartArray[MONTH] = (toInt(input) - 1) * 3;
                }
                break;
            // MONTH
            case 'M' : // fall through to MM
            case 'MM' :
                if (input != null) {
                    datePartArray[MONTH] = toInt(input) - 1;
                }
                break;
            case 'MMM' : // fall through to MMMM
            case 'MMMM' :
                a = config._locale.monthsParse(input);
                // if we didn't find a month name, mark the date as invalid.
                if (a != null) {
                    datePartArray[MONTH] = a;
                } else {
                    config._pf.invalidMonth = input;
                }
                break;
            // DAY OF MONTH
            case 'D' : // fall through to DD
            case 'DD' :
                if (input != null) {
                    datePartArray[DATE] = toInt(input);
                }
                break;
            case 'Do' :
                if (input != null) {
                    datePartArray[DATE] = toInt(parseInt(input, 10));
                }
                break;
            // DAY OF YEAR
            case 'DDD' : // fall through to DDDD
            case 'DDDD' :
                if (input != null) {
                    config._dayOfYear = toInt(input);
                }

                break;
            // YEAR
            case 'YY' :
                datePartArray[YEAR] = moment.parseTwoDigitYear(input);
                break;
            case 'YYYY' :
            case 'YYYYY' :
            case 'YYYYYY' :
                datePartArray[YEAR] = toInt(input);
                break;
            // AM / PM
            case 'a' : // fall through to A
            case 'A' :
                config._isPm = config._locale.isPM(input);
                break;
            // 24 HOUR
            case 'H' : // fall through to hh
            case 'HH' : // fall through to hh
            case 'h' : // fall through to hh
            case 'hh' :
                datePartArray[HOUR] = toInt(input);
                break;
            // MINUTE
            case 'm' : // fall through to mm
            case 'mm' :
                datePartArray[MINUTE] = toInt(input);
                break;
            // SECOND
            case 's' : // fall through to ss
            case 'ss' :
                datePartArray[SECOND] = toInt(input);
                break;
            // MILLISECOND
            case 'S' :
            case 'SS' :
            case 'SSS' :
            case 'SSSS' :
                datePartArray[MILLISECOND] = toInt(('0.' + input) * 1000);
                break;
            // UNIX TIMESTAMP WITH MS
            case 'X':
                config._d = new Date(parseFloat(input) * 1000);
                break;
            // TIMEZONE
            case 'Z' : // fall through to ZZ
            case 'ZZ' :
                config._useUTC = true;
                config._tzm = timezoneMinutesFromString(input);
                break;
            // WEEKDAY - human
            case 'dd':
            case 'ddd':
            case 'dddd':
                a = config._locale.weekdaysParse(input);
                // if we didn't get a weekday name, mark the date as invalid
                if (a != null) {
                    config._w = config._w || {};
                    config._w['d'] = a;
                } else {
                    config._pf.invalidWeekday = input;
                }
                break;
            // WEEK, WEEK DAY - numeric
            case 'w':
            case 'ww':
            case 'W':
            case 'WW':
            case 'd':
            case 'e':
            case 'E':
                token = token.substr(0, 1);
                /* falls through */
            case 'gggg':
            case 'GGGG':
            case 'GGGGG':
                token = token.substr(0, 2);
                if (input) {
                    config._w = config._w || {};
                    config._w[token] = toInt(input);
                }
                break;
            case 'gg':
            case 'GG':
                config._w = config._w || {};
                config._w[token] = moment.parseTwoDigitYear(input);
            }
        }

        function dayOfYearFromWeekInfo(config) {
            var w, weekYear, week, weekday, dow, doy, temp;

            w = config._w;
            if (w.GG != null || w.W != null || w.E != null) {
                dow = 1;
                doy = 4;

                // TODO: We need to take the current isoWeekYear, but that depends on
                // how we interpret now (local, utc, fixed offset). So create
                // a now version of current config (take local/utc/offset flags, and
                // create now).
                weekYear = dfl(w.GG, config._a[YEAR], weekOfYear(moment(), 1, 4).year);
                week = dfl(w.W, 1);
                weekday = dfl(w.E, 1);
            } else {
                dow = config._locale._week.dow;
                doy = config._locale._week.doy;

                weekYear = dfl(w.gg, config._a[YEAR], weekOfYear(moment(), dow, doy).year);
                week = dfl(w.w, 1);

                if (w.d != null) {
                    // weekday -- low day numbers are considered next week
                    weekday = w.d;
                    if (weekday < dow) {
                        ++week;
                    }
                } else if (w.e != null) {
                    // local weekday -- counting starts from begining of week
                    weekday = w.e + dow;
                } else {
                    // default to begining of week
                    weekday = dow;
                }
            }
            temp = dayOfYearFromWeeks(weekYear, week, weekday, doy, dow);

            config._a[YEAR] = temp.year;
            config._dayOfYear = temp.dayOfYear;
        }

        // convert an array to a date.
        // the array should mirror the parameters below
        // note: all values past the year are optional and will default to the lowest possible value.
        // [year, month, day , hour, minute, second, millisecond]
        function dateFromConfig(config) {
            var i, date, input = [], currentDate, yearToUse;

            if (config._d) {
                return;
            }

            currentDate = currentDateArray(config);

            //compute day of the year from weeks and weekdays
            if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
                dayOfYearFromWeekInfo(config);
            }

            //if the day of the year is set, figure out what it is
            if (config._dayOfYear) {
                yearToUse = dfl(config._a[YEAR], currentDate[YEAR]);

                if (config._dayOfYear > daysInYear(yearToUse)) {
                    config._pf._overflowDayOfYear = true;
                }

                date = makeUTCDate(yearToUse, 0, config._dayOfYear);
                config._a[MONTH] = date.getUTCMonth();
                config._a[DATE] = date.getUTCDate();
            }

            // Default to current date.
            // * if no year, month, day of month are given, default to today
            // * if day of month is given, default month and year
            // * if month is given, default only year
            // * if year is given, don't default anything
            for (i = 0; i < 3 && config._a[i] == null; ++i) {
                config._a[i] = input[i] = currentDate[i];
            }

            // Zero out whatever was not defaulted, including time
            for (; i < 7; i++) {
                config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
            }

            config._d = (config._useUTC ? makeUTCDate : makeDate).apply(null, input);
            // Apply timezone offset from input. The actual zone can be changed
            // with parseZone.
            if (config._tzm != null) {
                config._d.setUTCMinutes(config._d.getUTCMinutes() + config._tzm);
            }
        }

        function dateFromObject(config) {
            var normalizedInput;

            if (config._d) {
                return;
            }

            normalizedInput = normalizeObjectUnits(config._i);
            config._a = [
                normalizedInput.year,
                normalizedInput.month,
                normalizedInput.day,
                normalizedInput.hour,
                normalizedInput.minute,
                normalizedInput.second,
                normalizedInput.millisecond
            ];

            dateFromConfig(config);
        }

        function currentDateArray(config) {
            var now = new Date();
            if (config._useUTC) {
                return [
                    now.getUTCFullYear(),
                    now.getUTCMonth(),
                    now.getUTCDate()
                ];
            } else {
                return [now.getFullYear(), now.getMonth(), now.getDate()];
            }
        }

        // date from string and format string
        function makeDateFromStringAndFormat(config) {
            if (config._f === moment.ISO_8601) {
                parseISO(config);
                return;
            }

            config._a = [];
            config._pf.empty = true;

            // This array is used to make a Date, either with `new Date` or `Date.UTC`
            var string = '' + config._i,
                i, parsedInput, tokens, token, skipped,
                stringLength = string.length,
                totalParsedInputLength = 0;

            tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

            for (i = 0; i < tokens.length; i++) {
                token = tokens[i];
                parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
                if (parsedInput) {
                    skipped = string.substr(0, string.indexOf(parsedInput));
                    if (skipped.length > 0) {
                        config._pf.unusedInput.push(skipped);
                    }
                    string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                    totalParsedInputLength += parsedInput.length;
                }
                // don't parse if it's not a known token
                if (formatTokenFunctions[token]) {
                    if (parsedInput) {
                        config._pf.empty = false;
                    }
                    else {
                        config._pf.unusedTokens.push(token);
                    }
                    addTimeToArrayFromToken(token, parsedInput, config);
                }
                else if (config._strict && !parsedInput) {
                    config._pf.unusedTokens.push(token);
                }
            }

            // add remaining unparsed input length to the string
            config._pf.charsLeftOver = stringLength - totalParsedInputLength;
            if (string.length > 0) {
                config._pf.unusedInput.push(string);
            }

            // handle am pm
            if (config._isPm && config._a[HOUR] < 12) {
                config._a[HOUR] += 12;
            }
            // if is 12 am, change hours to 0
            if (config._isPm === false && config._a[HOUR] === 12) {
                config._a[HOUR] = 0;
            }

            dateFromConfig(config);
            checkOverflow(config);
        }

        function unescapeFormat(s) {
            return s.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
                return p1 || p2 || p3 || p4;
            });
        }

        // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
        function regexpEscape(s) {
            return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        }

        // date from string and array of format strings
        function makeDateFromStringAndArray(config) {
            var tempConfig,
                bestMoment,

                scoreToBeat,
                i,
                currentScore;

            if (config._f.length === 0) {
                config._pf.invalidFormat = true;
                config._d = new Date(NaN);
                return;
            }

            for (i = 0; i < config._f.length; i++) {
                currentScore = 0;
                tempConfig = copyConfig({}, config);
                if (config._useUTC != null) {
                    tempConfig._useUTC = config._useUTC;
                }
                tempConfig._pf = defaultParsingFlags();
                tempConfig._f = config._f[i];
                makeDateFromStringAndFormat(tempConfig);

                if (!isValid(tempConfig)) {
                    continue;
                }

                // if there is any input that was not parsed add a penalty for that format
                currentScore += tempConfig._pf.charsLeftOver;

                //or tokens
                currentScore += tempConfig._pf.unusedTokens.length * 10;

                tempConfig._pf.score = currentScore;

                if (scoreToBeat == null || currentScore < scoreToBeat) {
                    scoreToBeat = currentScore;
                    bestMoment = tempConfig;
                }
            }

            extend(config, bestMoment || tempConfig);
        }

        // date from iso format
        function parseISO(config) {
            var i, l,
                string = config._i,
                match = isoRegex.exec(string);

            if (match) {
                config._pf.iso = true;
                for (i = 0, l = isoDates.length; i < l; i++) {
                    if (isoDates[i][1].exec(string)) {
                        // match[5] should be 'T' or undefined
                        config._f = isoDates[i][0] + (match[6] || ' ');
                        break;
                    }
                }
                for (i = 0, l = isoTimes.length; i < l; i++) {
                    if (isoTimes[i][1].exec(string)) {
                        config._f += isoTimes[i][0];
                        break;
                    }
                }
                if (string.match(parseTokenTimezone)) {
                    config._f += 'Z';
                }
                makeDateFromStringAndFormat(config);
            } else {
                config._isValid = false;
            }
        }

        // date from iso format or fallback
        function makeDateFromString(config) {
            parseISO(config);
            if (config._isValid === false) {
                delete config._isValid;
                moment.createFromInputFallback(config);
            }
        }

        function map(arr, fn) {
            var res = [], i;
            for (i = 0; i < arr.length; ++i) {
                res.push(fn(arr[i], i));
            }
            return res;
        }

        function makeDateFromInput(config) {
            var input = config._i, matched;
            if (input === undefined) {
                config._d = new Date();
            } else if (isDate(input)) {
                config._d = new Date(+input);
            } else if ((matched = aspNetJsonRegex.exec(input)) !== null) {
                config._d = new Date(+matched[1]);
            } else if (typeof input === 'string') {
                makeDateFromString(config);
            } else if (isArray(input)) {
                config._a = map(input.slice(0), function (obj) {
                    return parseInt(obj, 10);
                });
                dateFromConfig(config);
            } else if (typeof(input) === 'object') {
                dateFromObject(config);
            } else if (typeof(input) === 'number') {
                // from milliseconds
                config._d = new Date(input);
            } else {
                moment.createFromInputFallback(config);
            }
        }

        function makeDate(y, m, d, h, M, s, ms) {
            //can't just apply() to create a date:
            //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
            var date = new Date(y, m, d, h, M, s, ms);

            //the date constructor doesn't accept years < 1970
            if (y < 1970) {
                date.setFullYear(y);
            }
            return date;
        }

        function makeUTCDate(y) {
            var date = new Date(Date.UTC.apply(null, arguments));
            if (y < 1970) {
                date.setUTCFullYear(y);
            }
            return date;
        }

        function parseWeekday(input, locale) {
            if (typeof input === 'string') {
                if (!isNaN(input)) {
                    input = parseInt(input, 10);
                }
                else {
                    input = locale.weekdaysParse(input);
                    if (typeof input !== 'number') {
                        return null;
                    }
                }
            }
            return input;
        }

        /************************************
            Relative Time
        ************************************/


        // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
        function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
            return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
        }

        function relativeTime(posNegDuration, withoutSuffix, locale) {
            var duration = moment.duration(posNegDuration).abs(),
                seconds = round(duration.as('s')),
                minutes = round(duration.as('m')),
                hours = round(duration.as('h')),
                days = round(duration.as('d')),
                months = round(duration.as('M')),
                years = round(duration.as('y')),

                args = seconds < relativeTimeThresholds.s && ['s', seconds] ||
                    minutes === 1 && ['m'] ||
                    minutes < relativeTimeThresholds.m && ['mm', minutes] ||
                    hours === 1 && ['h'] ||
                    hours < relativeTimeThresholds.h && ['hh', hours] ||
                    days === 1 && ['d'] ||
                    days < relativeTimeThresholds.d && ['dd', days] ||
                    months === 1 && ['M'] ||
                    months < relativeTimeThresholds.M && ['MM', months] ||
                    years === 1 && ['y'] || ['yy', years];

            args[2] = withoutSuffix;
            args[3] = +posNegDuration > 0;
            args[4] = locale;
            return substituteTimeAgo.apply({}, args);
        }


        /************************************
            Week of Year
        ************************************/


        // firstDayOfWeek       0 = sun, 6 = sat
        //                      the day of the week that starts the week
        //                      (usually sunday or monday)
        // firstDayOfWeekOfYear 0 = sun, 6 = sat
        //                      the first week is the week that contains the first
        //                      of this day of the week
        //                      (eg. ISO weeks use thursday (4))
        function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
            var end = firstDayOfWeekOfYear - firstDayOfWeek,
                daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(),
                adjustedMoment;


            if (daysToDayOfWeek > end) {
                daysToDayOfWeek -= 7;
            }

            if (daysToDayOfWeek < end - 7) {
                daysToDayOfWeek += 7;
            }

            adjustedMoment = moment(mom).add(daysToDayOfWeek, 'd');
            return {
                week: Math.ceil(adjustedMoment.dayOfYear() / 7),
                year: adjustedMoment.year()
            };
        }

        //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
        function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
            var d = makeUTCDate(year, 0, 1).getUTCDay(), daysToAdd, dayOfYear;

            d = d === 0 ? 7 : d;
            weekday = weekday != null ? weekday : firstDayOfWeek;
            daysToAdd = firstDayOfWeek - d + (d > firstDayOfWeekOfYear ? 7 : 0) - (d < firstDayOfWeek ? 7 : 0);
            dayOfYear = 7 * (week - 1) + (weekday - firstDayOfWeek) + daysToAdd + 1;

            return {
                year: dayOfYear > 0 ? year : year - 1,
                dayOfYear: dayOfYear > 0 ?  dayOfYear : daysInYear(year - 1) + dayOfYear
            };
        }

        /************************************
            Top Level Functions
        ************************************/

        function makeMoment(config) {
            var input = config._i,
                format = config._f;

            config._locale = config._locale || moment.localeData(config._l);

            if (input === null || (format === undefined && input === '')) {
                return moment.invalid({nullInput: true});
            }

            if (typeof input === 'string') {
                config._i = input = config._locale.preparse(input);
            }

            if (moment.isMoment(input)) {
                return new Moment(input, true);
            } else if (format) {
                if (isArray(format)) {
                    makeDateFromStringAndArray(config);
                } else {
                    makeDateFromStringAndFormat(config);
                }
            } else {
                makeDateFromInput(config);
            }

            return new Moment(config);
        }

        moment = function (input, format, locale, strict) {
            var c;

            if (typeof(locale) === 'boolean') {
                strict = locale;
                locale = undefined;
            }
            // object construction must be done this way.
            // https://github.com/moment/moment/issues/1423
            c = {};
            c._isAMomentObject = true;
            c._i = input;
            c._f = format;
            c._l = locale;
            c._strict = strict;
            c._isUTC = false;
            c._pf = defaultParsingFlags();

            return makeMoment(c);
        };

        moment.suppressDeprecationWarnings = false;

        moment.createFromInputFallback = deprecate(
            'moment construction falls back to js Date. This is ' +
            'discouraged and will be removed in upcoming major ' +
            'release. Please refer to ' +
            'https://github.com/moment/moment/issues/1407 for more info.',
            function (config) {
                config._d = new Date(config._i);
            }
        );

        // Pick a moment m from moments so that m[fn](other) is true for all
        // other. This relies on the function fn to be transitive.
        //
        // moments should either be an array of moment objects or an array, whose
        // first element is an array of moment objects.
        function pickBy(fn, moments) {
            var res, i;
            if (moments.length === 1 && isArray(moments[0])) {
                moments = moments[0];
            }
            if (!moments.length) {
                return moment();
            }
            res = moments[0];
            for (i = 1; i < moments.length; ++i) {
                if (moments[i][fn](res)) {
                    res = moments[i];
                }
            }
            return res;
        }

        moment.min = function () {
            var args = [].slice.call(arguments, 0);

            return pickBy('isBefore', args);
        };

        moment.max = function () {
            var args = [].slice.call(arguments, 0);

            return pickBy('isAfter', args);
        };

        // creating with utc
        moment.utc = function (input, format, locale, strict) {
            var c;

            if (typeof(locale) === 'boolean') {
                strict = locale;
                locale = undefined;
            }
            // object construction must be done this way.
            // https://github.com/moment/moment/issues/1423
            c = {};
            c._isAMomentObject = true;
            c._useUTC = true;
            c._isUTC = true;
            c._l = locale;
            c._i = input;
            c._f = format;
            c._strict = strict;
            c._pf = defaultParsingFlags();

            return makeMoment(c).utc();
        };

        // creating with unix timestamp (in seconds)
        moment.unix = function (input) {
            return moment(input * 1000);
        };

        // duration
        moment.duration = function (input, key) {
            var duration = input,
                // matching against regexp is expensive, do it on demand
                match = null,
                sign,
                ret,
                parseIso,
                diffRes;

            if (moment.isDuration(input)) {
                duration = {
                    ms: input._milliseconds,
                    d: input._days,
                    M: input._months
                };
            } else if (typeof input === 'number') {
                duration = {};
                if (key) {
                    duration[key] = input;
                } else {
                    duration.milliseconds = input;
                }
            } else if (!!(match = aspNetTimeSpanJsonRegex.exec(input))) {
                sign = (match[1] === '-') ? -1 : 1;
                duration = {
                    y: 0,
                    d: toInt(match[DATE]) * sign,
                    h: toInt(match[HOUR]) * sign,
                    m: toInt(match[MINUTE]) * sign,
                    s: toInt(match[SECOND]) * sign,
                    ms: toInt(match[MILLISECOND]) * sign
                };
            } else if (!!(match = isoDurationRegex.exec(input))) {
                sign = (match[1] === '-') ? -1 : 1;
                parseIso = function (inp) {
                    // We'd normally use ~~inp for this, but unfortunately it also
                    // converts floats to ints.
                    // inp may be undefined, so careful calling replace on it.
                    var res = inp && parseFloat(inp.replace(',', '.'));
                    // apply sign while we're at it
                    return (isNaN(res) ? 0 : res) * sign;
                };
                duration = {
                    y: parseIso(match[2]),
                    M: parseIso(match[3]),
                    d: parseIso(match[4]),
                    h: parseIso(match[5]),
                    m: parseIso(match[6]),
                    s: parseIso(match[7]),
                    w: parseIso(match[8])
                };
            } else if (typeof duration === 'object' &&
                    ('from' in duration || 'to' in duration)) {
                diffRes = momentsDifference(moment(duration.from), moment(duration.to));

                duration = {};
                duration.ms = diffRes.milliseconds;
                duration.M = diffRes.months;
            }

            ret = new Duration(duration);

            if (moment.isDuration(input) && hasOwnProp(input, '_locale')) {
                ret._locale = input._locale;
            }

            return ret;
        };

        // version number
        moment.version = VERSION;

        // default format
        moment.defaultFormat = isoFormat;

        // constant that refers to the ISO standard
        moment.ISO_8601 = function () {};

        // Plugins that add properties should also add the key here (null value),
        // so we can properly clone ourselves.
        moment.momentProperties = momentProperties;

        // This function will be called whenever a moment is mutated.
        // It is intended to keep the offset in sync with the timezone.
        moment.updateOffset = function () {};

        // This function allows you to set a threshold for relative time strings
        moment.relativeTimeThreshold = function (threshold, limit) {
            if (relativeTimeThresholds[threshold] === undefined) {
                return false;
            }
            if (limit === undefined) {
                return relativeTimeThresholds[threshold];
            }
            relativeTimeThresholds[threshold] = limit;
            return true;
        };

        moment.lang = deprecate(
            'moment.lang is deprecated. Use moment.locale instead.',
            function (key, value) {
                return moment.locale(key, value);
            }
        );

        // This function will load locale and then set the global locale.  If
        // no arguments are passed in, it will simply return the current global
        // locale key.
        moment.locale = function (key, values) {
            var data;
            if (key) {
                if (typeof(values) !== 'undefined') {
                    data = moment.defineLocale(key, values);
                }
                else {
                    data = moment.localeData(key);
                }

                if (data) {
                    moment.duration._locale = moment._locale = data;
                }
            }

            return moment._locale._abbr;
        };

        moment.defineLocale = function (name, values) {
            if (values !== null) {
                values.abbr = name;
                if (!locales[name]) {
                    locales[name] = new Locale();
                }
                locales[name].set(values);

                // backwards compat for now: also set the locale
                moment.locale(name);

                return locales[name];
            } else {
                // useful for testing
                delete locales[name];
                return null;
            }
        };

        moment.langData = deprecate(
            'moment.langData is deprecated. Use moment.localeData instead.',
            function (key) {
                return moment.localeData(key);
            }
        );

        // returns locale data
        moment.localeData = function (key) {
            var locale;

            if (key && key._locale && key._locale._abbr) {
                key = key._locale._abbr;
            }

            if (!key) {
                return moment._locale;
            }

            if (!isArray(key)) {
                //short-circuit everything else
                locale = loadLocale(key);
                if (locale) {
                    return locale;
                }
                key = [key];
            }

            return chooseLocale(key);
        };

        // compare moment object
        moment.isMoment = function (obj) {
            return obj instanceof Moment ||
                (obj != null && hasOwnProp(obj, '_isAMomentObject'));
        };

        // for typechecking Duration objects
        moment.isDuration = function (obj) {
            return obj instanceof Duration;
        };

        for (i = lists.length - 1; i >= 0; --i) {
            makeList(lists[i]);
        }

        moment.normalizeUnits = function (units) {
            return normalizeUnits(units);
        };

        moment.invalid = function (flags) {
            var m = moment.utc(NaN);
            if (flags != null) {
                extend(m._pf, flags);
            }
            else {
                m._pf.userInvalidated = true;
            }

            return m;
        };

        moment.parseZone = function () {
            return moment.apply(null, arguments).parseZone();
        };

        moment.parseTwoDigitYear = function (input) {
            return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
        };

        /************************************
            Moment Prototype
        ************************************/


        extend(moment.fn = Moment.prototype, {

            clone : function () {
                return moment(this);
            },

            valueOf : function () {
                return +this._d + ((this._offset || 0) * 60000);
            },

            unix : function () {
                return Math.floor(+this / 1000);
            },

            toString : function () {
                return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
            },

            toDate : function () {
                return this._offset ? new Date(+this) : this._d;
            },

            toISOString : function () {
                var m = moment(this).utc();
                if (0 < m.year() && m.year() <= 9999) {
                    return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
                } else {
                    return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
                }
            },

            toArray : function () {
                var m = this;
                return [
                    m.year(),
                    m.month(),
                    m.date(),
                    m.hours(),
                    m.minutes(),
                    m.seconds(),
                    m.milliseconds()
                ];
            },

            isValid : function () {
                return isValid(this);
            },

            isDSTShifted : function () {
                if (this._a) {
                    return this.isValid() && compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray()) > 0;
                }

                return false;
            },

            parsingFlags : function () {
                return extend({}, this._pf);
            },

            invalidAt: function () {
                return this._pf.overflow;
            },

            utc : function (keepLocalTime) {
                return this.zone(0, keepLocalTime);
            },

            local : function (keepLocalTime) {
                if (this._isUTC) {
                    this.zone(0, keepLocalTime);
                    this._isUTC = false;

                    if (keepLocalTime) {
                        this.add(this._dateTzOffset(), 'm');
                    }
                }
                return this;
            },

            format : function (inputString) {
                var output = formatMoment(this, inputString || moment.defaultFormat);
                return this.localeData().postformat(output);
            },

            add : createAdder(1, 'add'),

            subtract : createAdder(-1, 'subtract'),

            diff : function (input, units, asFloat) {
                var that = makeAs(input, this),
                    zoneDiff = (this.zone() - that.zone()) * 6e4,
                    diff, output, daysAdjust;

                units = normalizeUnits(units);

                if (units === 'year' || units === 'month') {
                    // average number of days in the months in the given dates
                    diff = (this.daysInMonth() + that.daysInMonth()) * 432e5; // 24 * 60 * 60 * 1000 / 2
                    // difference in months
                    output = ((this.year() - that.year()) * 12) + (this.month() - that.month());
                    // adjust by taking difference in days, average number of days
                    // and dst in the given months.
                    daysAdjust = (this - moment(this).startOf('month')) -
                        (that - moment(that).startOf('month'));
                    // same as above but with zones, to negate all dst
                    daysAdjust -= ((this.zone() - moment(this).startOf('month').zone()) -
                            (that.zone() - moment(that).startOf('month').zone())) * 6e4;
                    output += daysAdjust / diff;
                    if (units === 'year') {
                        output = output / 12;
                    }
                } else {
                    diff = (this - that);
                    output = units === 'second' ? diff / 1e3 : // 1000
                        units === 'minute' ? diff / 6e4 : // 1000 * 60
                        units === 'hour' ? diff / 36e5 : // 1000 * 60 * 60
                        units === 'day' ? (diff - zoneDiff) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                        units === 'week' ? (diff - zoneDiff) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                        diff;
                }
                return asFloat ? output : absRound(output);
            },

            from : function (time, withoutSuffix) {
                return moment.duration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
            },

            fromNow : function (withoutSuffix) {
                return this.from(moment(), withoutSuffix);
            },

            calendar : function (time) {
                // We want to compare the start of today, vs this.
                // Getting start-of-today depends on whether we're zone'd or not.
                var now = time || moment(),
                    sod = makeAs(now, this).startOf('day'),
                    diff = this.diff(sod, 'days', true),
                    format = diff < -6 ? 'sameElse' :
                        diff < -1 ? 'lastWeek' :
                        diff < 0 ? 'lastDay' :
                        diff < 1 ? 'sameDay' :
                        diff < 2 ? 'nextDay' :
                        diff < 7 ? 'nextWeek' : 'sameElse';
                return this.format(this.localeData().calendar(format, this));
            },

            isLeapYear : function () {
                return isLeapYear(this.year());
            },

            isDST : function () {
                return (this.zone() < this.clone().month(0).zone() ||
                    this.zone() < this.clone().month(5).zone());
            },

            day : function (input) {
                var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
                if (input != null) {
                    input = parseWeekday(input, this.localeData());
                    return this.add(input - day, 'd');
                } else {
                    return day;
                }
            },

            month : makeAccessor('Month', true),

            startOf : function (units) {
                units = normalizeUnits(units);
                // the following switch intentionally omits break keywords
                // to utilize falling through the cases.
                switch (units) {
                case 'year':
                    this.month(0);
                    /* falls through */
                case 'quarter':
                case 'month':
                    this.date(1);
                    /* falls through */
                case 'week':
                case 'isoWeek':
                case 'day':
                    this.hours(0);
                    /* falls through */
                case 'hour':
                    this.minutes(0);
                    /* falls through */
                case 'minute':
                    this.seconds(0);
                    /* falls through */
                case 'second':
                    this.milliseconds(0);
                    /* falls through */
                }

                // weeks are a special case
                if (units === 'week') {
                    this.weekday(0);
                } else if (units === 'isoWeek') {
                    this.isoWeekday(1);
                }

                // quarters are also special
                if (units === 'quarter') {
                    this.month(Math.floor(this.month() / 3) * 3);
                }

                return this;
            },

            endOf: function (units) {
                units = normalizeUnits(units);
                return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
            },

            isAfter: function (input, units) {
                units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
                if (units === 'millisecond') {
                    input = moment.isMoment(input) ? input : moment(input);
                    return +this > +input;
                } else {
                    return +this.clone().startOf(units) > +moment(input).startOf(units);
                }
            },

            isBefore: function (input, units) {
                units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
                if (units === 'millisecond') {
                    input = moment.isMoment(input) ? input : moment(input);
                    return +this < +input;
                } else {
                    return +this.clone().startOf(units) < +moment(input).startOf(units);
                }
            },

            isSame: function (input, units) {
                units = normalizeUnits(units || 'millisecond');
                if (units === 'millisecond') {
                    input = moment.isMoment(input) ? input : moment(input);
                    return +this === +input;
                } else {
                    return +this.clone().startOf(units) === +makeAs(input, this).startOf(units);
                }
            },

            min: deprecate(
                     'moment().min is deprecated, use moment.min instead. https://github.com/moment/moment/issues/1548',
                     function (other) {
                         other = moment.apply(null, arguments);
                         return other < this ? this : other;
                     }
             ),

            max: deprecate(
                    'moment().max is deprecated, use moment.max instead. https://github.com/moment/moment/issues/1548',
                    function (other) {
                        other = moment.apply(null, arguments);
                        return other > this ? this : other;
                    }
            ),

            // keepLocalTime = true means only change the timezone, without
            // affecting the local hour. So 5:31:26 +0300 --[zone(2, true)]-->
            // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist int zone
            // +0200, so we adjust the time as needed, to be valid.
            //
            // Keeping the time actually adds/subtracts (one hour)
            // from the actual represented time. That is why we call updateOffset
            // a second time. In case it wants us to change the offset again
            // _changeInProgress == true case, then we have to adjust, because
            // there is no such time in the given timezone.
            zone : function (input, keepLocalTime) {
                var offset = this._offset || 0,
                    localAdjust;
                if (input != null) {
                    if (typeof input === 'string') {
                        input = timezoneMinutesFromString(input);
                    }
                    if (Math.abs(input) < 16) {
                        input = input * 60;
                    }
                    if (!this._isUTC && keepLocalTime) {
                        localAdjust = this._dateTzOffset();
                    }
                    this._offset = input;
                    this._isUTC = true;
                    if (localAdjust != null) {
                        this.subtract(localAdjust, 'm');
                    }
                    if (offset !== input) {
                        if (!keepLocalTime || this._changeInProgress) {
                            addOrSubtractDurationFromMoment(this,
                                    moment.duration(offset - input, 'm'), 1, false);
                        } else if (!this._changeInProgress) {
                            this._changeInProgress = true;
                            moment.updateOffset(this, true);
                            this._changeInProgress = null;
                        }
                    }
                } else {
                    return this._isUTC ? offset : this._dateTzOffset();
                }
                return this;
            },

            zoneAbbr : function () {
                return this._isUTC ? 'UTC' : '';
            },

            zoneName : function () {
                return this._isUTC ? 'Coordinated Universal Time' : '';
            },

            parseZone : function () {
                if (this._tzm) {
                    this.zone(this._tzm);
                } else if (typeof this._i === 'string') {
                    this.zone(this._i);
                }
                return this;
            },

            hasAlignedHourOffset : function (input) {
                if (!input) {
                    input = 0;
                }
                else {
                    input = moment(input).zone();
                }

                return (this.zone() - input) % 60 === 0;
            },

            daysInMonth : function () {
                return daysInMonth(this.year(), this.month());
            },

            dayOfYear : function (input) {
                var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 864e5) + 1;
                return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
            },

            quarter : function (input) {
                return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
            },

            weekYear : function (input) {
                var year = weekOfYear(this, this.localeData()._week.dow, this.localeData()._week.doy).year;
                return input == null ? year : this.add((input - year), 'y');
            },

            isoWeekYear : function (input) {
                var year = weekOfYear(this, 1, 4).year;
                return input == null ? year : this.add((input - year), 'y');
            },

            week : function (input) {
                var week = this.localeData().week(this);
                return input == null ? week : this.add((input - week) * 7, 'd');
            },

            isoWeek : function (input) {
                var week = weekOfYear(this, 1, 4).week;
                return input == null ? week : this.add((input - week) * 7, 'd');
            },

            weekday : function (input) {
                var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
                return input == null ? weekday : this.add(input - weekday, 'd');
            },

            isoWeekday : function (input) {
                // behaves the same as moment#day except
                // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
                // as a setter, sunday should belong to the previous week.
                return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
            },

            isoWeeksInYear : function () {
                return weeksInYear(this.year(), 1, 4);
            },

            weeksInYear : function () {
                var weekInfo = this.localeData()._week;
                return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
            },

            get : function (units) {
                units = normalizeUnits(units);
                return this[units]();
            },

            set : function (units, value) {
                units = normalizeUnits(units);
                if (typeof this[units] === 'function') {
                    this[units](value);
                }
                return this;
            },

            // If passed a locale key, it will set the locale for this
            // instance.  Otherwise, it will return the locale configuration
            // variables for this instance.
            locale : function (key) {
                var newLocaleData;

                if (key === undefined) {
                    return this._locale._abbr;
                } else {
                    newLocaleData = moment.localeData(key);
                    if (newLocaleData != null) {
                        this._locale = newLocaleData;
                    }
                    return this;
                }
            },

            lang : deprecate(
                'moment().lang() is deprecated. Use moment().localeData() instead.',
                function (key) {
                    if (key === undefined) {
                        return this.localeData();
                    } else {
                        return this.locale(key);
                    }
                }
            ),

            localeData : function () {
                return this._locale;
            },

            _dateTzOffset : function () {
                // On Firefox.24 Date#getTimezoneOffset returns a floating point.
                // https://github.com/moment/moment/pull/1871
                return Math.round(this._d.getTimezoneOffset() / 15) * 15;
            }
        });

        function rawMonthSetter(mom, value) {
            var dayOfMonth;

            // TODO: Move this out of here!
            if (typeof value === 'string') {
                value = mom.localeData().monthsParse(value);
                // TODO: Another silent failure?
                if (typeof value !== 'number') {
                    return mom;
                }
            }

            dayOfMonth = Math.min(mom.date(),
                    daysInMonth(mom.year(), value));
            mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
            return mom;
        }

        function rawGetter(mom, unit) {
            return mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]();
        }

        function rawSetter(mom, unit, value) {
            if (unit === 'Month') {
                return rawMonthSetter(mom, value);
            } else {
                return mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
            }
        }

        function makeAccessor(unit, keepTime) {
            return function (value) {
                if (value != null) {
                    rawSetter(this, unit, value);
                    moment.updateOffset(this, keepTime);
                    return this;
                } else {
                    return rawGetter(this, unit);
                }
            };
        }

        moment.fn.millisecond = moment.fn.milliseconds = makeAccessor('Milliseconds', false);
        moment.fn.second = moment.fn.seconds = makeAccessor('Seconds', false);
        moment.fn.minute = moment.fn.minutes = makeAccessor('Minutes', false);
        // Setting the hour should keep the time, because the user explicitly
        // specified which hour he wants. So trying to maintain the same hour (in
        // a new timezone) makes sense. Adding/subtracting hours does not follow
        // this rule.
        moment.fn.hour = moment.fn.hours = makeAccessor('Hours', true);
        // moment.fn.month is defined separately
        moment.fn.date = makeAccessor('Date', true);
        moment.fn.dates = deprecate('dates accessor is deprecated. Use date instead.', makeAccessor('Date', true));
        moment.fn.year = makeAccessor('FullYear', true);
        moment.fn.years = deprecate('years accessor is deprecated. Use year instead.', makeAccessor('FullYear', true));

        // add plural methods
        moment.fn.days = moment.fn.day;
        moment.fn.months = moment.fn.month;
        moment.fn.weeks = moment.fn.week;
        moment.fn.isoWeeks = moment.fn.isoWeek;
        moment.fn.quarters = moment.fn.quarter;

        // add aliased format methods
        moment.fn.toJSON = moment.fn.toISOString;

        /************************************
            Duration Prototype
        ************************************/


        function daysToYears (days) {
            // 400 years have 146097 days (taking into account leap year rules)
            return days * 400 / 146097;
        }

        function yearsToDays (years) {
            // years * 365 + absRound(years / 4) -
            //     absRound(years / 100) + absRound(years / 400);
            return years * 146097 / 400;
        }

        extend(moment.duration.fn = Duration.prototype, {

            _bubble : function () {
                var milliseconds = this._milliseconds,
                    days = this._days,
                    months = this._months,
                    data = this._data,
                    seconds, minutes, hours, years = 0;

                // The following code bubbles up values, see the tests for
                // examples of what that means.
                data.milliseconds = milliseconds % 1000;

                seconds = absRound(milliseconds / 1000);
                data.seconds = seconds % 60;

                minutes = absRound(seconds / 60);
                data.minutes = minutes % 60;

                hours = absRound(minutes / 60);
                data.hours = hours % 24;

                days += absRound(hours / 24);

                // Accurately convert days to years, assume start from year 0.
                years = absRound(daysToYears(days));
                days -= absRound(yearsToDays(years));

                // 30 days to a month
                // TODO (iskren): Use anchor date (like 1st Jan) to compute this.
                months += absRound(days / 30);
                days %= 30;

                // 12 months -> 1 year
                years += absRound(months / 12);
                months %= 12;

                data.days = days;
                data.months = months;
                data.years = years;
            },

            abs : function () {
                this._milliseconds = Math.abs(this._milliseconds);
                this._days = Math.abs(this._days);
                this._months = Math.abs(this._months);

                this._data.milliseconds = Math.abs(this._data.milliseconds);
                this._data.seconds = Math.abs(this._data.seconds);
                this._data.minutes = Math.abs(this._data.minutes);
                this._data.hours = Math.abs(this._data.hours);
                this._data.months = Math.abs(this._data.months);
                this._data.years = Math.abs(this._data.years);

                return this;
            },

            weeks : function () {
                return absRound(this.days() / 7);
            },

            valueOf : function () {
                return this._milliseconds +
                  this._days * 864e5 +
                  (this._months % 12) * 2592e6 +
                  toInt(this._months / 12) * 31536e6;
            },

            humanize : function (withSuffix) {
                var output = relativeTime(this, !withSuffix, this.localeData());

                if (withSuffix) {
                    output = this.localeData().pastFuture(+this, output);
                }

                return this.localeData().postformat(output);
            },

            add : function (input, val) {
                // supports only 2.0-style add(1, 's') or add(moment)
                var dur = moment.duration(input, val);

                this._milliseconds += dur._milliseconds;
                this._days += dur._days;
                this._months += dur._months;

                this._bubble();

                return this;
            },

            subtract : function (input, val) {
                var dur = moment.duration(input, val);

                this._milliseconds -= dur._milliseconds;
                this._days -= dur._days;
                this._months -= dur._months;

                this._bubble();

                return this;
            },

            get : function (units) {
                units = normalizeUnits(units);
                return this[units.toLowerCase() + 's']();
            },

            as : function (units) {
                var days, months;
                units = normalizeUnits(units);

                if (units === 'month' || units === 'year') {
                    days = this._days + this._milliseconds / 864e5;
                    months = this._months + daysToYears(days) * 12;
                    return units === 'month' ? months : months / 12;
                } else {
                    // handle milliseconds separately because of floating point math errors (issue #1867)
                    days = this._days + yearsToDays(this._months / 12);
                    switch (units) {
                        case 'week': return days / 7 + this._milliseconds / 6048e5;
                        case 'day': return days + this._milliseconds / 864e5;
                        case 'hour': return days * 24 + this._milliseconds / 36e5;
                        case 'minute': return days * 24 * 60 + this._milliseconds / 6e4;
                        case 'second': return days * 24 * 60 * 60 + this._milliseconds / 1000;
                        // Math.floor prevents floating point math errors here
                        case 'millisecond': return Math.floor(days * 24 * 60 * 60 * 1000) + this._milliseconds;
                        default: throw new Error('Unknown unit ' + units);
                    }
                }
            },

            lang : moment.fn.lang,
            locale : moment.fn.locale,

            toIsoString : deprecate(
                'toIsoString() is deprecated. Please use toISOString() instead ' +
                '(notice the capitals)',
                function () {
                    return this.toISOString();
                }
            ),

            toISOString : function () {
                // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
                var years = Math.abs(this.years()),
                    months = Math.abs(this.months()),
                    days = Math.abs(this.days()),
                    hours = Math.abs(this.hours()),
                    minutes = Math.abs(this.minutes()),
                    seconds = Math.abs(this.seconds() + this.milliseconds() / 1000);

                if (!this.asSeconds()) {
                    // this is the same as C#'s (Noda) and python (isodate)...
                    // but not other JS (goog.date)
                    return 'P0D';
                }

                return (this.asSeconds() < 0 ? '-' : '') +
                    'P' +
                    (years ? years + 'Y' : '') +
                    (months ? months + 'M' : '') +
                    (days ? days + 'D' : '') +
                    ((hours || minutes || seconds) ? 'T' : '') +
                    (hours ? hours + 'H' : '') +
                    (minutes ? minutes + 'M' : '') +
                    (seconds ? seconds + 'S' : '');
            },

            localeData : function () {
                return this._locale;
            }
        });

        moment.duration.fn.toString = moment.duration.fn.toISOString;

        function makeDurationGetter(name) {
            moment.duration.fn[name] = function () {
                return this._data[name];
            };
        }

        for (i in unitMillisecondFactors) {
            if (hasOwnProp(unitMillisecondFactors, i)) {
                makeDurationGetter(i.toLowerCase());
            }
        }

        moment.duration.fn.asMilliseconds = function () {
            return this.as('ms');
        };
        moment.duration.fn.asSeconds = function () {
            return this.as('s');
        };
        moment.duration.fn.asMinutes = function () {
            return this.as('m');
        };
        moment.duration.fn.asHours = function () {
            return this.as('h');
        };
        moment.duration.fn.asDays = function () {
            return this.as('d');
        };
        moment.duration.fn.asWeeks = function () {
            return this.as('weeks');
        };
        moment.duration.fn.asMonths = function () {
            return this.as('M');
        };
        moment.duration.fn.asYears = function () {
            return this.as('y');
        };

        /************************************
            Default Locale
        ************************************/


        // Set default locale, other locale will inherit from English.
        moment.locale('en', {
            ordinal : function (number) {
                var b = number % 10,
                    output = (toInt(number % 100 / 10) === 1) ? 'th' :
                    (b === 1) ? 'st' :
                    (b === 2) ? 'nd' :
                    (b === 3) ? 'rd' : 'th';
                return number + output;
            }
        });

        return moment;

    }).call(this);

    NG.Utils.moment = moment;

    return NG.datepicker;
});


(function(addon) {

    var component;

    if (window.NGkit) {
        component = addon(NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-form-password", ["ngkit"], function(){
            return component || addon(NGkit);
        });
    }

})(function(NG){

    "use strict";

    NG.component('formPassword', {

        defaults: {
            "lblShow": "Show",
            "lblHide": "Hide"
        },

        boot: function() {
            // init code
            NG.$html.on("click.formpassword.ngkit", "[data-ng-form-password]", function(e) {

                var ele = NG.$(this);

                if (!ele.data("formPassword")) {

                    e.preventDefault();

                    NG.formPassword(ele, NG.Utils.options(ele.attr("data-ng-form-password")));
                    ele.trigger("click");
                }
            });
        },

        init: function() {

            var $this = this;

            this.on("click", function(e) {

                e.preventDefault();

                if($this.input.length) {
                    var type = $this.input.attr("type");
                    $this.input.attr("type", type=="text" ? "password":"text");
                    $this.element.html($this.options[type=="text" ? "lblShow":"lblHide"]);
                }
            });

            this.input = this.element.next("input").length ? this.element.next("input") : this.element.prev("input");
            this.element.html(this.options[this.input.is("[type='password']") ? "lblShow":"lblHide"]);


            this.element.data("formPassword", this);
        }
    });

    return NG.formPassword;
});


(function(addon) {

    var component;

    if (window.NGkit) {
        component = addon(NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-form-select", ["ngkit"], function(){
            return component || addon(NGkit);
        });
    }

})(function(NG){

    "use strict";

    NG.component('formSelect', {

        defaults: {
            'target': '>span:first',
            'activeClass': 'ng-active'
        },

        boot: function() {
            // init code
            NG.ready(function(context) {

                NG.$("[data-ng-form-select]", context).each(function(){

                    var ele = NG.$(this);

                    if (!ele.data("formSelect")) {
                        NG.formSelect(ele, NG.Utils.options(ele.attr("data-ng-form-select")));
                    }
                });
            });
        },

        init: function() {
            var $this = this;

            this.target  = this.find(this.options.target);
            this.select  = this.find('select');

            // init + on change event
            this.select.on("change", (function(){

                var select = $this.select[0], fn = function(){

                    try {
                        if($this.options.target === 'input')
                        {
                            $this.target.val(select.options[select.selectedIndex].text);
                        }
                        else
                        {
                            $this.target.text(select.options[select.selectedIndex].text);
                        }
                    } catch(e) {}

                    $this.element[$this.select.val() ? 'addClass':'removeClass']($this.options.activeClass);

                    return fn;
                };

                return fn();
            })());

            this.element.data("formSelect", this);
        }
    });

    return NG.formSelect;
});


(function(addon) {

    var component;

    if (window.NGkit) {
        component = addon(NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-grid", ["ngkit"], function(){
            return component || addon(NGkit);
        });
    }

})(function(NG){

    "use strict";

    NG.component('grid', {

        defaults: {
            colwidth  : 'auto',
            animation : true,
            duration  : 300,
            gutter    : 0,
            controls  : false,
            filter    : false
        },

        boot:  function() {

            // init code
            NG.ready(function(context) {

                NG.$('[data-ng-grid]', context).each(function(){

                    var ele = NG.$(this);

                    if(!ele.data("grid")) {
                        NG.grid(ele, NG.Utils.options(ele.attr('data-ng-grid')));
                    }
                });
            });
        },

        init: function() {

            var $this = this, gutter = String(this.options.gutter).trim().split(' ');

            this.gutterv  = parseInt(gutter[0], 10);
            this.gutterh  = parseInt((gutter[1] || gutter[0]), 10);

            // make sure parent element has the right position property
            this.element.css({'position': 'relative'});

            this.controls = null;

            if (this.options.controls) {

                this.controls = NG.$(this.options.controls);

                // filter
                this.controls.on('click', '[data-ng-filter]', function(e){
                    e.preventDefault();
                    $this.filter(NG.$(this).attr('data-ng-filter'));
                });

                // sort
                this.controls.on('click', '[data-ng-sort]', function(e){
                    e.preventDefault();
                    var cmd = NG.$(this).attr('data-ng-sort').split(':');
                    $this.sort(cmd[0], cmd[1]);
                });
            }

            NG.$win.on('load resize orientationchange', NG.Utils.debounce(function(){

                if ($this.currentfilter) {
                    $this.filter($this.currentfilter);
                } else {
                    this.updateLayout();
                }

            }.bind(this), 100));

            this.on('display.ng.check', function(){
                if ($this.element.is(":visible"))  $this.updateLayout();
            });

            NG.domObserve(this.element, function(e) {
                $this.updateLayout();
            });

            if (this.options.filter !== false) {
                this.filter(this.options.filter);
            } else {
                this.updateLayout();
            }
        },

        _prepareElements: function() {

            var children = this.element.children(':not([data-grid-prepared])'), css;

            // exit if no already prepared elements found
            if (!children.length) {
                return;
            }

            css = {
                'position'   : 'absolute',
                'box-sizing' : 'border-box',
                'width'      : this.options.colwidth == 'auto' ? '' : this.options.colwidth
            };

            if (this.options.gutter) {

                css['padding-left']   = this.gutterh;
                css['padding-bottom'] = this.gutterv;

                this.element.css('margin-left', this.gutterh * -1);
            }

            children.attr('data-grid-prepared', 'true').css(css);
        },

        updateLayout: function(elements) {

            this._prepareElements();

            elements = elements || this.element.children(':visible');

            var children  = elements,
                maxwidth  = this.element.width() + (2*this.gutterh) + 2,
                left      = 0,
                top       = 0,
                positions = [],

                item, width, height, pos, i, z, max, size;

            this.trigger('beforeupdate.ng.grid', [children]);

            children.each(function(index){

                size   = getElementSize(this);

                item   = NG.$(this);
                width  = size.outerWidth;
                height = size.outerHeight;
                left   = 0;
                top    = 0;

                for (i=0,max=positions.length;i<max;i++) {

                    pos = positions[i];

                    if (left <= pos.aX) { left = pos.aX; }
                    if (maxwidth < (left + width)) { left = 0; }
                    if (top <= pos.aY) { top = pos.aY; }
                }

                positions.push({
                    "ele"    : item,
                    "top"    : top,
                    "left"   : left,
                    "width"  : width,
                    "height" : height,
                    "aY"     : (top  + height),
                    "aX"     : (left + width)
                });
            });

            var posPrev, maxHeight = 0;

            // fix top
            for (i=0,max=positions.length;i<max;i++) {

                pos = positions[i];
                top = 0;

                for (z=0;z<i;z++) {

                    posPrev = positions[z];

                    // (posPrev.left + 1) fixex 1px bug when using % based widths
                    if (pos.left < posPrev.aX && (posPrev.left +1) < pos.aX) {
                        top = posPrev.aY;
                    }
                }

                pos.top = top;
                pos.aY  = top + pos.height;

                maxHeight = Math.max(maxHeight, pos.aY);
            }

            maxHeight = maxHeight - this.gutterv;

            if (this.options.animation) {

                this.element.stop().animate({'height': maxHeight}, 100);

                positions.forEach(function(pos){
                    pos.ele.stop().animate({"top": pos.top, "left": pos.left, opacity: 1}, this.options.duration);
                }.bind(this));

            } else {

                this.element.css('height', maxHeight);

                positions.forEach(function(pos){
                    pos.ele.css({"top": pos.top, "left": pos.left, opacity: 1});
                }.bind(this));
            }

            // make sure to trigger possible scrollpies etc.
            setTimeout(function() {
                NG.$doc.trigger('scrolling.ng.document');
            }, 2 * this.options.duration * (this.options.animation ? 1:0));

            this.trigger('afterupdate.ng.grid', [children]);
        },

        filter: function(filter) {

            this.currentfilter = filter;

            filter = filter || [];

            if (typeof(filter) === 'number') {
                filter = filter.toString();
            }

            if (typeof(filter) === 'string') {
                filter = filter.split(/,/).map(function(item){ return item.trim(); });
            }

            var $this = this, children = this.element.children(), elements = {"visible": [], "hidden": []}, visible, hidden;

            children.each(function(index){

                var ele = NG.$(this), f = ele.attr('data-ng-filter'), infilter = filter.length ? false : true;

                if (f) {

                    f = f.split(/,/).map(function(item){ return item.trim(); });

                    filter.forEach(function(item){
                        if (f.indexOf(item) > -1) infilter = true;
                    });
                }

                elements[infilter ? "visible":"hidden"].push(ele);
            });

            // convert to jQuery collections
            elements.hidden  = NG.$(elements.hidden).map(function () {return this[0];});
            elements.visible = NG.$(elements.visible).map(function () {return this[0];});

            elements.hidden.attr('aria-hidden', 'true').filter(':visible').fadeOut(this.options.duration);
            elements.visible.attr('aria-hidden', 'false').filter(':hidden').css('opacity', 0).show();

            $this.updateLayout(elements.visible);

            if (this.controls && this.controls.length) {
                this.controls.find('[data-ng-filter]').removeClass('ng-active').filter('[data-ng-filter="'+filter+'"]').addClass('ng-active');
            }
        },

        sort: function(by, order){

            order = order || 1;

            // covert from string (asc|desc) to number
            if (typeof(order) === 'string') {
                order = order.toLowerCase() == 'desc' ? -1 : 1;
            }

            var elements = this.element.children();

            elements.sort(function(a, b){

                a = NG.$(a);
                b = NG.$(b);

                return (b.data(by) || '') < (a.data(by) || '') ? order : (order*-1);

            }).appendTo(this.element);

            this.updateLayout(elements.filter(':visible'));

            if (this.controls && this.controls.length) {
                this.controls.find('[data-ng-sort]').removeClass('ng-active').filter('[data-ng-sort="'+by+':'+(order == -1 ? 'desc':'asc')+'"]').addClass('ng-active');
            }
        }
    });


    /*!
    * getSize v1.2.2
    * measure size of elements
    * MIT license
    * https://github.com/desandro/get-size
    */
    var _getSize = (function(){

        var prefixes = 'Webkit Moz ms Ms O'.split(' ');
        var docElemStyle = document.documentElement.style;

        function getStyleProperty( propName ) {
            if ( !propName ) {
                return;
            }

            // test standard property first
            if ( typeof docElemStyle[ propName ] === 'string' ) {
                return propName;
            }

            // capitalize
            propName = propName.charAt(0).toUpperCase() + propName.slice(1);

            // test vendor specific properties
            var prefixed;
            for ( var i=0, len = prefixes.length; i < len; i++ ) {
                prefixed = prefixes[i] + propName;
                if ( typeof docElemStyle[ prefixed ] === 'string' ) {
                    return prefixed;
                }
            }
        }

        // -------------------------- helpers -------------------------- //

        // get a number from a string, not a percentage
        function getStyleSize( value ) {
            var num = parseFloat( value );
            // not a percent like '100%', and a number
            var isValid = value.indexOf('%') === -1 && !isNaN( num );
            return isValid && num;
        }

        function noop() {}

        var logError = typeof console === 'undefined' ? noop : function( message ) {
            console.error( message );
        };

        // -------------------------- measurements -------------------------- //

        var measurements = [
            'paddingLeft',
            'paddingRight',
            'paddingTop',
            'paddingBottom',
            'marginLeft',
            'marginRight',
            'marginTop',
            'marginBottom',
            'borderLeftWidth',
            'borderRightWidth',
            'borderTopWidth',
            'borderBottomWidth'
        ];

        function getZeroSize() {
            var size = {
                width: 0,
                height: 0,
                innerWidth: 0,
                innerHeight: 0,
                outerWidth: 0,
                outerHeight: 0
            };
            for ( var i=0, len = measurements.length; i < len; i++ ) {
                var measurement = measurements[i];
                size[ measurement ] = 0;
            }
            return size;
        }


        // -------------------------- setup -------------------------- //

        var isSetup = false;
        var getStyle, boxSizingProp, isBoxSizeOuter;

        /**
        * setup vars and functions
        * do it on initial getSize(), rather than on script load
        * For Firefox bug https://bugzilla.mozilla.org/show_bug.cgi?id=548397
        */
        function setup() {
            // setup once
            if ( isSetup ) {
                return;
            }
            isSetup = true;

            var getComputedStyle = window.getComputedStyle;
            getStyle = ( function() {
                var getStyleFn = getComputedStyle ?
                function( elem ) {
                    return getComputedStyle( elem, null );
                } :
                function( elem ) {
                    return elem.currentStyle;
                };

                return function getStyle( elem ) {
                    var style = getStyleFn( elem );
                    if ( !style ) {
                        logError( 'Style returned ' + style +
                        '. Are you running this code in a hidden iframe on Firefox? ' +
                        'See http://bit.ly/getsizebug1' );
                    }
                    return style;
                };
            })();

            // -------------------------- box sizing -------------------------- //

            boxSizingProp = getStyleProperty('boxSizing');

            /**
            * WebKit measures the outer-width on style.width on border-box elems
            * IE & Firefox measures the inner-width
            */
            if ( boxSizingProp ) {
                var div = document.createElement('div');
                div.style.width = '200px';
                div.style.padding = '1px 2px 3px 4px';
                div.style.borderStyle = 'solid';
                div.style.borderWidth = '1px 2px 3px 4px';
                div.style[ boxSizingProp ] = 'border-box';

                var body = document.body || document.documentElement;
                body.appendChild( div );
                var style = getStyle( div );

                isBoxSizeOuter = getStyleSize( style.width ) === 200;
                body.removeChild( div );
            }

        }

        // -------------------------- getSize -------------------------- //

        function getSize( elem ) {
            setup();

            // use querySeletor if elem is string
            if ( typeof elem === 'string' ) {
                elem = document.querySelector( elem );
            }

            // do not proceed on non-objects
            if ( !elem || typeof elem !== 'object' || !elem.nodeType ) {
                return;
            }

            var style = getStyle( elem );

            // if hidden, everything is 0
            if ( style.display === 'none' ) {
                return getZeroSize();
            }

            var size = {};
            size.width = elem.offsetWidth;
            size.height = elem.offsetHeight;

            var isBorderBox = size.isBorderBox = !!( boxSizingProp &&
                style[ boxSizingProp ] && style[ boxSizingProp ] === 'border-box' );

            // get all measurements
            for ( var i=0, len = measurements.length; i < len; i++ ) {
                var measurement = measurements[i];
                var value = style[ measurement ];

                var num = parseFloat( value );
                // any 'auto', 'medium' value will be 0
                size[ measurement ] = !isNaN( num ) ? num : 0;
            }

            var paddingWidth = size.paddingLeft + size.paddingRight;
            var paddingHeight = size.paddingTop + size.paddingBottom;
            var marginWidth = size.marginLeft + size.marginRight;
            var marginHeight = size.marginTop + size.marginBottom;
            var borderWidth = size.borderLeftWidth + size.borderRightWidth;
            var borderHeight = size.borderTopWidth + size.borderBottomWidth;

            var isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter;

            // overwrite width and height if we can get it from style
            var styleWidth = getStyleSize( style.width );
            if ( styleWidth !== false ) {
                size.width = styleWidth +
                // add padding and border unless it's already including it
                ( isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth );
            }

            var styleHeight = getStyleSize( style.height );
            if ( styleHeight !== false ) {
                size.height = styleHeight +
                // add padding and border unless it's already including it
                ( isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight );
            }

            size.innerWidth = size.width - ( paddingWidth + borderWidth );
            size.innerHeight = size.height - ( paddingHeight + borderHeight );

            size.outerWidth = size.width + marginWidth;
            size.outerHeight = size.height + marginHeight;

            return size;
        }

        return getSize;

    })();

    function getElementSize(ele) {
        return _getSize(ele);
    }
});


(function(addon) {

    var component;

    if (window.NGkit) {
        component = addon(NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-htmleditor", ["ngkit"], function(){
            return component || addon(NGkit);
        });
    }

})(function(NG) {

    "use strict";

    var editors = [];

    NG.component('htmleditor', {

        defaults: {
            iframe       : false,
            mode         : 'split',
            markdown     : false,
            autocomplete : true,
            height       : 500,
            maxsplitsize : 1000,
            codemirror   : { mode: 'htmlmixed', lineWrapping: true, dragDrop: false, autoCloseTags: true, matchTags: true, autoCloseBrackets: true, matchBrackets: true, indentUnit: 4, indentWithTabs: false, tabSize: 4, hintOptions: {completionSingle:false} },
            toolbar      : [ 'bold', 'italic', 'strike', 'link', 'image', 'blockquote', 'listUl', 'listOl' ],
            lblPreview   : 'Preview',
            lblCodeview  : 'HTML',
            lblMarkedview: 'Markdown'
        },

        boot: function() {

            // init code
            NG.ready(function(context) {

                NG.$('textarea[data-ng-htmleditor]', context).each(function() {

                    var editor = NG.$(this);

                    if (!editor.data('htmleditor')) {
                        NG.htmleditor(editor, NG.Utils.options(editor.attr('data-ng-htmleditor')));
                    }
                });
            });
        },

        init: function() {

            var $this = this, tpl = NG.components.htmleditor.template;

            this.CodeMirror = this.options.CodeMirror || CodeMirror;
            this.buttons    = {};

            tpl = tpl.replace(/\{:lblPreview}/g, this.options.lblPreview);
            tpl = tpl.replace(/\{:lblCodeview}/g, this.options.lblCodeview);

            this.htmleditor = NG.$(tpl);
            this.content    = this.htmleditor.find('.ng-htmleditor-content');
            this.toolbar    = this.htmleditor.find('.ng-htmleditor-toolbar');
            this.preview    = this.htmleditor.find('.ng-htmleditor-preview').children().eq(0);
            this.code       = this.htmleditor.find('.ng-htmleditor-code');

            this.element.before(this.htmleditor).appendTo(this.code);
            this.editor = this.CodeMirror.fromTextArea(this.element[0], this.options.codemirror);
            this.editor.htmleditor = this;
            this.editor.on('change', NG.Utils.debounce(function() { $this.render(); }, 150));
            this.editor.on('change', function() {
                $this.editor.save();
                $this.element.trigger('input');
            });
            this.code.find('.CodeMirror').css('height', this.options.height);

            // iframe mode?
            if (this.options.iframe) {

                this.iframe = NG.$('<iframe class="ng-htmleditor-iframe" frameborder="0" scrolling="auto" height="100" width="100%"></iframe>');
                this.preview.append(this.iframe);

                // must open and close document object to start using it!
                this.iframe[0].contentWindow.document.open();
                this.iframe[0].contentWindow.document.close();

                this.preview.container = NG.$(this.iframe[0].contentWindow.document).find('body');

                // append custom stylesheet
                if (typeof(this.options.iframe) === 'string') {
                    this.preview.container.parent().append('<link rel="stylesheet" href="'+this.options.iframe+'">');
                }

            } else {
                this.preview.container = this.preview;
            }

            NG.$win.on('resize load', NG.Utils.debounce(function() { $this.fit(); }, 200));

            var previewContainer = this.iframe ? this.preview.container:$this.preview.parent(),
                codeContent      = this.code.find('.CodeMirror-sizer'),
                codeScroll       = this.code.find('.CodeMirror-scroll').on('scroll', NG.Utils.debounce(function() {

                    if ($this.htmleditor.attr('data-mode') == 'tab') return;

                    // calc position
                    var codeHeight      = codeContent.height() - codeScroll.height(),
                        previewHeight   = previewContainer[0].scrollHeight - ($this.iframe ? $this.iframe.height() : previewContainer.height()),
                        ratio           = previewHeight / codeHeight,
                        previewPosition = codeScroll.scrollTop() * ratio;

                    // apply new scroll
                    previewContainer.scrollTop(previewPosition);

                }, 10));

            this.htmleditor.on('click', '.ng-htmleditor-button-code, .ng-htmleditor-button-preview', function(e) {

                e.preventDefault();

                if ($this.htmleditor.attr('data-mode') == 'tab') {

                    $this.htmleditor.find('.ng-htmleditor-button-code, .ng-htmleditor-button-preview').removeClass('ng-active').filter(this).addClass('ng-active');

                    $this.activetab = NG.$(this).hasClass('ng-htmleditor-button-code') ? 'code' : 'preview';
                    $this.htmleditor.attr('data-active-tab', $this.activetab);
                    $this.editor.refresh();
                }
            });

            // toolbar actions
            this.htmleditor.on('click', 'a[data-htmleditor-button]', function() {

                if (!$this.code.is(':visible')) return;

                $this.trigger('action.' + NG.$(this).data('htmleditor-button'), [$this.editor]);
            });

            this.preview.parent().css('height', this.code.height());

            // autocomplete
            if (this.options.autocomplete && this.CodeMirror.showHint && this.CodeMirror.hint && this.CodeMirror.hint.html) {

                this.editor.on('inputRead', NG.Utils.debounce(function() {
                    var doc = $this.editor.getDoc(), POS = doc.getCursor(), mode = $this.CodeMirror.innerMode($this.editor.getMode(), $this.editor.getTokenAt(POS).state).mode.name;

                    if (mode == 'xml') { //html depends on xml

                        var cur = $this.editor.getCursor(), token = $this.editor.getTokenAt(cur);

                        if (token.string.charAt(0) == '<' || token.type == 'attribute') {
                            $this.CodeMirror.showHint($this.editor, $this.CodeMirror.hint.html, { completeSingle: false });
                        }
                    }
                }, 100));
            }

            this.debouncedRedraw = NG.Utils.debounce(function () { $this.redraw(); }, 5);

            this.on('init.ng.component', function() {
                $this.debouncedRedraw();
            });

            this.element.attr('data-ng-check-display', 1).on('display.ng.check', function(e) {
                if (this.htmleditor.is(":visible")) this.fit();
            }.bind(this));

            editors.push(this);
        },

        addButton: function(name, button) {
            this.buttons[name] = button;
        },

        addButtons: function(buttons) {
            NG.$.extend(this.buttons, buttons);
        },

        replaceInPreview: function(regexp, callback) {

            var editor = this.editor, results = [], value = editor.getValue(), offset = -1, index = 0;

            this.currentvalue = this.currentvalue.replace(regexp, function() {

                offset = value.indexOf(arguments[0], ++offset);

                var match  = {
                    matches: arguments,
                    from   : translateOffset(offset),
                    to     : translateOffset(offset + arguments[0].length),
                    replace: function(value) {
                        editor.replaceRange(value, match.from, match.to);
                    },
                    inRange: function(cursor) {

                        if (cursor.line === match.from.line && cursor.line === match.to.line) {
                            return cursor.ch >= match.from.ch && cursor.ch < match.to.ch;
                        }

                        return  (cursor.line === match.from.line && cursor.ch   >= match.from.ch) ||
                                (cursor.line >   match.from.line && cursor.line <  match.to.line) ||
                                (cursor.line === match.to.line   && cursor.ch   <  match.to.ch);
                    }
                };

                var result = typeof(callback) === 'string' ? callback : callback(match, index);

                if (!result && result !== '') {
                    return arguments[0];
                }

                index++;

                results.push(match);
                return result;
            });

            function translateOffset(offset) {
                var result = editor.getValue().substring(0, offset).split('\n');
                return { line: result.length - 1, ch: result[result.length - 1].length }
            }

            return results;
        },

        _buildtoolbar: function() {

            if (!(this.options.toolbar && this.options.toolbar.length)) return;

            var $this = this, bar = [];

            this.toolbar.empty();

            this.options.toolbar.forEach(function(button) {
                if (!$this.buttons[button]) return;

                var title = $this.buttons[button].title ? $this.buttons[button].title : button;

                bar.push('<li><a data-htmleditor-button="'+button+'" title="'+title+'" data-ng-tooltip>'+$this.buttons[button].label+'</a></li>');
            });

            this.toolbar.html(bar.join('\n'));
        },

        fit: function() {

            var mode = this.options.mode;

            if (mode == 'split' && this.htmleditor.width() < this.options.maxsplitsize) {
                mode = 'tab';
            }

            if (mode == 'tab') {
                if (!this.activetab) {
                    this.activetab = 'code';
                    this.htmleditor.attr('data-active-tab', this.activetab);
                }

                this.htmleditor.find('.ng-htmleditor-button-code, .ng-htmleditor-button-preview').removeClass('ng-active')
                    .filter(this.activetab == 'code' ? '.ng-htmleditor-button-code' : '.ng-htmleditor-button-preview')
                    .addClass('ng-active');
            }

            this.editor.refresh();
            this.preview.parent().css('height', this.code.height());

            this.htmleditor.attr('data-mode', mode);
        },

        redraw: function() {
            this._buildtoolbar();
            this.render();
            this.fit();
        },

        getMode: function() {
            return this.editor.getOption('mode');
        },

        getCursorMode: function() {
            var param = { mode: 'html'};
            this.trigger('cursorMode', [param]);
            return param.mode;
        },

        render: function() {

            this.currentvalue = this.editor.getValue();

            // empty code
            if (!this.currentvalue) {

                this.element.val('');
                this.preview.container.html('');

                return;
            }

            this.trigger('render', [this]);
            this.trigger('renderLate', [this]);

            this.preview.container.html(this.currentvalue);
        },

        addShortcut: function(name, callback) {
            var map = {};
            if (!NG.$.isArray(name)) {
                name = [name];
            }

            name.forEach(function(key) {
                map[key] = callback;
            });

            this.editor.addKeyMap(map);

            return map;
        },

        addShortcutAction: function(action, shortcuts) {
            var editor = this;
            this.addShortcut(shortcuts, function() {
                editor.element.trigger('action.' + action, [editor.editor]);
            });
        },

        replaceSelection: function(replace) {

            var text = this.editor.getSelection();

            if (!text.length) {

                var cur     = this.editor.getCursor(),
                    curLine = this.editor.getLine(cur.line),
                    start   = cur.ch,
                    end     = start;

                while (end < curLine.length && /[\w$]+/.test(curLine.charAt(end))) ++end;
                while (start && /[\w$]+/.test(curLine.charAt(start - 1))) --start;

                var curWord = start != end && curLine.slice(start, end);

                if (curWord) {
                    this.editor.setSelection({ line: cur.line, ch: start}, { line: cur.line, ch: end });
                    text = curWord;
                }
            }

            var html = replace.replace('$1', text);

            this.editor.replaceSelection(html, 'end');
            this.editor.focus();
        },

        replaceLine: function(replace) {
            var pos  = this.editor.getDoc().getCursor(),
                text = this.editor.getLine(pos.line),
                html = replace.replace('$1', text);

            this.editor.replaceRange(html , { line: pos.line, ch: 0 }, { line: pos.line, ch: text.length });
            this.editor.setCursor({ line: pos.line, ch: html.length });
            this.editor.focus();
        },

        save: function() {
            this.editor.save();
        }
    });


    NG.components.htmleditor.template = [
        '<div class="ng-htmleditor ng-clearfix" data-mode="split">',
            '<div class="ng-htmleditor-navbar">',
                '<ul class="ng-htmleditor-navbar-nav ng-htmleditor-toolbar"></ul>',
                '<div class="ng-htmleditor-navbar-flip">',
                    '<ul class="ng-htmleditor-navbar-nav">',
                        '<li class="ng-htmleditor-button-code"><a>{:lblCodeview}</a></li>',
                        '<li class="ng-htmleditor-button-preview"><a>{:lblPreview}</a></li>',
                        '<li><a data-htmleditor-button="fullscreen"><i class="ng-icon-expand"></i></a></li>',
                    '</ul>',
                '</div>',
            '</div>',
            '<div class="ng-htmleditor-content">',
                '<div class="ng-htmleditor-code"></div>',
                '<div class="ng-htmleditor-preview"><div></div></div>',
            '</div>',
        '</div>'
    ].join('');


    NG.plugin('htmleditor', 'base', {

        init: function(editor) {

            editor.addButtons({

                fullscreen: {
                    title  : 'Fullscreen',
                    label  : '<i class="ng-icon-expand"></i>'
                },
                bold : {
                    title  : 'Bold',
                    label  : '<i class="ng-icon-bold"></i>'
                },
                italic : {
                    title  : 'Italic',
                    label  : '<i class="ng-icon-italic"></i>'
                },
                strike : {
                    title  : 'Strikethrough',
                    label  : '<i class="ng-icon-strikethrough"></i>'
                },
                blockquote : {
                    title  : 'Blockquote',
                    label  : '<i class="ng-icon-quote-right"></i>'
                },
                link : {
                    title  : 'Link',
                    label  : '<i class="ng-icon-link"></i>'
                },
                image : {
                    title  : 'Image',
                    label  : '<i class="ng-icon-picture-o"></i>'
                },
                listUl : {
                    title  : 'Unordered List',
                    label  : '<i class="ng-icon-list-ul"></i>'
                },
                listOl : {
                    title  : 'Ordered List',
                    label  : '<i class="ng-icon-list-ol"></i>'
                }

            });

            addAction('bold', '<strong>$1</strong>');
            addAction('italic', '<em>$1</em>');
            addAction('strike', '<del>$1</del>');
            addAction('blockquote', '<blockquote><p>$1</p></blockquote>', 'replaceLine');
            addAction('link', '<a href="http://">$1</a>');
            addAction('image', '<img src="http://" alt="$1">');

            var listfn = function(tag) {
                if (editor.getCursorMode() == 'html') {

                    tag = tag || 'ul';

                    var cm        = editor.editor,
                        doc       = cm.getDoc(),
                        pos       = doc.getCursor(true),
                        posend    = doc.getCursor(false),
                        im        = CodeMirror.innerMode(cm.getMode(), cm.getTokenAt(cm.getCursor()).state),
                        inList    = im && im.state && im.state.context && ['ul','ol'].indexOf(im.state.context.tagName) != -1;

                    for (var i=pos.line; i<(posend.line+1);i++) {
                        cm.replaceRange('<li>'+cm.getLine(i)+'</li>', { line: i, ch: 0 }, { line: i, ch: cm.getLine(i).length });
                    }

                    if (!inList) {
                        cm.replaceRange('<'+tag+'>'+"\n"+cm.getLine(pos.line), { line: pos.line, ch: 0 }, { line: pos.line, ch: cm.getLine(pos.line).length });
                        cm.replaceRange(cm.getLine((posend.line+1))+"\n"+'</'+tag+'>', { line: (posend.line+1), ch: 0 }, { line: (posend.line+1), ch: cm.getLine((posend.line+1)).length });
                        cm.setCursor({ line: posend.line+1, ch: cm.getLine(posend.line+1).length });
                    } else {
                        cm.setCursor({ line: posend.line, ch: cm.getLine(posend.line).length });
                    }

                    cm.focus();
                }
            };

            editor.on('action.listUl', function() {
                listfn('ul');
            });

            editor.on('action.listOl', function() {
                listfn('ol');
            });

            editor.htmleditor.on('click', 'a[data-htmleditor-button="fullscreen"]', function() {
                editor.htmleditor.toggleClass('ng-htmleditor-fullscreen');

                var wrap = editor.editor.getWrapperElement();

                if (editor.htmleditor.hasClass('ng-htmleditor-fullscreen')) {

                    editor.editor.state.fullScreenRestore = {scrollTop: window.pageYOffset, scrollLeft: window.pageXOffset, width: wrap.style.width, height: wrap.style.height};
                    wrap.style.width  = '';
                    wrap.style.height = editor.content.height()+'px';
                    document.documentElement.style.overflow = 'hidden';

                } else {

                    document.documentElement.style.overflow = '';
                    var info = editor.editor.state.fullScreenRestore;
                    wrap.style.width = info.width; wrap.style.height = info.height;
                    window.scrollTo(info.scrollLeft, info.scrollTop);
                }

                setTimeout(function() {
                    editor.fit();
                    NG.$win.trigger('resize');
                }, 50);
            });

            editor.addShortcut(['Ctrl-S', 'Cmd-S'], function() { editor.element.trigger('htmleditor-save', [editor]); });
            editor.addShortcutAction('bold', ['Ctrl-B', 'Cmd-B']);

            function addAction(name, replace, mode) {
                editor.on('action.'+name, function() {
                    if (editor.getCursorMode() == 'html') {
                        editor[mode == 'replaceLine' ? 'replaceLine' : 'replaceSelection'](replace);
                    }
                });
            }
        }
    });

    NG.plugin('htmleditor', 'markdown', {

        init: function(editor) {

            var parser = editor.options.mdparser || window.marked || null;

            if (!parser) return;

            if (editor.options.markdown) {
                enableMarkdown();
            }

            addAction('bold', '**$1**');
            addAction('italic', '*$1*');
            addAction('strike', '~~$1~~');
            addAction('blockquote', '> $1', 'replaceLine');
            addAction('link', '[$1](http://)');
            addAction('image', '![$1](http://)');

            editor.on('action.listUl', function() {

                if (editor.getCursorMode() == 'markdown') {

                    var cm      = editor.editor,
                        pos     = cm.getDoc().getCursor(true),
                        posend  = cm.getDoc().getCursor(false);

                    for (var i=pos.line; i<(posend.line+1);i++) {
                        cm.replaceRange('* '+cm.getLine(i), { line: i, ch: 0 }, { line: i, ch: cm.getLine(i).length });
                    }

                    cm.setCursor({ line: posend.line, ch: cm.getLine(posend.line).length });
                    cm.focus();
                }
            });

            editor.on('action.listOl', function() {

                if (editor.getCursorMode() == 'markdown') {

                    var cm      = editor.editor,
                        pos     = cm.getDoc().getCursor(true),
                        posend  = cm.getDoc().getCursor(false),
                        prefix  = 1;

                    if (pos.line > 0) {
                        var prevline = cm.getLine(pos.line-1), matches;

                        if(matches = prevline.match(/^(\d+)\./)) {
                            prefix = Number(matches[1])+1;
                        }
                    }

                    for (var i=pos.line; i<(posend.line+1);i++) {
                        cm.replaceRange(prefix+'. '+cm.getLine(i), { line: i, ch: 0 }, { line: i, ch: cm.getLine(i).length });
                        prefix++;
                    }

                    cm.setCursor({ line: posend.line, ch: cm.getLine(posend.line).length });
                    cm.focus();
                }
            });

            editor.on('renderLate', function() {
                if (editor.editor.options.mode == 'gfm') {
                    editor.currentvalue = parser(editor.currentvalue);
                }
            });

            editor.on('cursorMode', function(e, param) {
                if (editor.editor.options.mode == 'gfm') {
                    var pos = editor.editor.getDoc().getCursor();
                    if (!editor.editor.getTokenAt(pos).state.base.htmlState) {
                        param.mode = 'markdown';
                    }
                }
            });

            NG.$.extend(editor, {

                enableMarkdown: function() {
                    enableMarkdown();
                    this.render();
                },
                disableMarkdown: function() {
                    this.editor.setOption('mode', 'htmlmixed');
                    this.htmleditor.find('.ng-htmleditor-button-code a').html(this.options.lblCodeview);
                    this.render();
                }

            });

            // switch markdown mode on event
            editor.on({
                enableMarkdown  : function() { editor.enableMarkdown(); },
                disableMarkdown : function() { editor.disableMarkdown(); }
            });

            function enableMarkdown() {
                editor.editor.setOption('mode', 'gfm');
                editor.htmleditor.find('.ng-htmleditor-button-code a').html(editor.options.lblMarkedview);
            }

            function addAction(name, replace, mode) {
                editor.on('action.'+name, function() {
                    if (editor.getCursorMode() == 'markdown') {
                        editor[mode == 'replaceLine' ? 'replaceLine' : 'replaceSelection'](replace);
                    }
                });
            }
        }
    });

    return NG.htmleditor;
});


(function(addon) {

    var component;

    if (window.NGkit) {
        component = addon(NGkit);
    }

    if (typeof define == "function" && define.amd) { // AMD
        define("ngkit-lightbox", ["ngkit"], function(){
            return component || addon(NGkit);
        });
    }

})(function(NG){

    "use strict";

    var modal, cache = {};

    NG.component('lightbox', {

        defaults: {
            "group"      : false,
            "duration"   : 400,
            "keyboard"   : true
        },

        index : 0,
        items : false,

        boot: function() {

            NG.$html.on('click', '[data-ng-lightbox]', function(e){

                e.preventDefault();

                var link = NG.$(this);

                if (!link.data("lightbox")) {

                    NG.lightbox(link, NG.Utils.options(link.attr("data-ng-lightbox")));
                }

                link.data("lightbox").show(link);
            });

            // keyboard navigation
            NG.$doc.on('keyup', function(e) {

                if (modal && modal.is(':visible') && modal.lightbox.options.keyboard) {

                    e.preventDefault();

                    switch(e.keyCode) {
                        case 37:
                            modal.lightbox.previous();
                            break;
                        case 39:
                            modal.lightbox.next();
                            break;
                    }
                }
            });
        },

        init: function() {

            var siblings = [];

            this.index    = 0;
            this.siblings = [];

            if (this.element && this.element.length) {

                var domSiblings  = this.options.group ? NG.$([
                    '[data-ng-lightbox*="'+this.options.group+'"]',
                    "[data-ng-lightbox*='"+this.options.group+"']"
                ].join(',')) : this.element;

                domSiblings.each(function() {

                    var ele = NG.$(this);

                    siblings.push({
                        'source': ele.attr('href'),
                        'title' : ele.attr('data-title') || ele.attr('title'),
                        'type'  : ele.attr("data-lightbox-type") || 'auto',
                        'link'  : ele
                    });
                });

                this.index    = domSiblings.index(this.element);
                this.siblings = siblings;

            } else if (this.options.group && this.options.group.length) {
                this.siblings = this.options.group;
            }

            this.trigger('lightbox-init', [this]);
        },

        show: function(index) {

            this.modal = getModal(this);

            // stop previous animation
            this.modal.dialog.stop();
            this.modal.content.stop();

            var $this = this, promise = NG.$.Deferred(), data, item;

            index = index || 0;

            // index is a jQuery object or DOM element
            if (typeof(index) == 'object') {

                this.siblings.forEach(function(s, idx){

                    if (index[0] === s.link[0]) {
                        index = idx;
                    }
                });
            }

            // fix index if needed
            if ( index < 0 ) {
                index = this.siblings.length - index;
            } else if (!this.siblings[index]) {
                index = 0;
            }

            item   = this.siblings[index];

            data = {
                "lightbox" : $this,
                "source"   : item.source,
                "type"     : item.type,
                "index"    : index,
                "promise"  : promise,
                "title"    : item.title,
                "item"     : item,
                "meta"     : {
                    "content" : '',
                    "width"   : null,
                    "height"  : null
                }
            };

            this.index = index;

            this.modal.content.empty();

            if (!this.modal.is(':visible')) {
                this.modal.content.css({width:'', height:''}).empty();
                this.modal.modal.show();
            }

            this.modal.loader.removeClass('ng-hidden');

            promise.promise().done(function() {

                $this.data = data;
                $this.fitSize(data);

            }).fail(function(){

                data.meta.content = '<div class="ng-position-cover ng-flex ng-flex-middle ng-flex-center"><strong>Loading resource failed!</strong></div>';
                data.meta.width   = 400;
                data.meta.height  = 300;

                $this.data = data;
                $this.fitSize(data);
            });

            $this.trigger('showitem.ng.lightbox', [data]);
        },

        fitSize: function() {

            var $this    = this,
                data     = this.data,
                pad      = this.modal.dialog.outerWidth() - this.modal.dialog.width(),
                dpadTop  = parseInt(this.modal.dialog.css('margin-top'), 10),
                dpadBot  = parseInt(this.modal.dialog.css('margin-bottom'), 10),
                dpad     = dpadTop + dpadBot,
                content  = data.meta.content,
                duration = $this.options.duration;

            if (this.siblings.length > 1) {

                content = [
                    content,
                    '<a href="#" class="ng-slidenav ng-slidenav-contrast ng-slidenav-previous ng-hidden-touch" data-lightbox-previous></a>',
                    '<a href="#" class="ng-slidenav ng-slidenav-contrast ng-slidenav-next ng-hidden-touch" data-lightbox-next></a>'
                ].join('');
            }

            // calculate width
            var tmp = NG.$('<div>&nbsp;</div>').css({
                'opacity'   : 0,
                'position'  : 'absolute',
                'top'       : 0,
                'left'      : 0,
                'width'     : '100%',
                'max-width' : $this.modal.dialog.css('max-width'),
                'padding'   : $this.modal.dialog.css('padding'),
                'margin'    : $this.modal.dialog.css('margin')
            }), maxwidth, maxheight, w = data.meta.width, h = data.meta.height;

            tmp.appendTo('body').width();

            maxwidth  = tmp.width();
            maxheight = window.innerHeight - dpad;

            tmp.remove();

            this.modal.dialog.find('.ng-modal-caption').remove();

            if (data.title) {
                this.modal.dialog.append('<div class="ng-modal-caption">'+data.title+'</div>');
                maxheight -= this.modal.dialog.find('.ng-modal-caption').outerHeight();
            }

            if (maxwidth < data.meta.width) {

                h = Math.floor( h * (maxwidth / w) );
                w = maxwidth;
            }

            if (maxheight < h) {

                h = Math.floor(maxheight);
                w = Math.ceil(data.meta.width * (maxheight/data.meta.height));
            }

            this.modal.content.css('opacity', 0).width(w).html(content);

            if (data.type == 'iframe') {
                this.modal.content.find('iframe:first').height(h);
            }

            var dh   = h + pad,
                t    = Math.floor(window.innerHeight/2 - dh/2) - dpad;

            if (t < 0) { t = 0; }

            this.modal.closer.addClass('ng-hidden');

            if ($this.modal.data('mwidth') == w &&  $this.modal.data('mheight') == h) {
                duration = 0;
            }

            this.modal.dialog.animate({width: w + pad, height: h + pad, top: t }, duration, 'swing', function() {
                $this.modal.loader.addClass('ng-hidden');
                $this.modal.content.css({width:''}).animate({'opacity': 1}, function() {
                    $this.modal.closer.removeClass('ng-hidden');
                });

                $this.modal.data({'mwidth': w, 'mheight': h});
            });
        },

        next: function() {
            this.show(this.siblings[(this.index+1)] ? (this.index+1) : 0);
        },

        previous: function() {
            this.show(this.siblings[(this.index-1)] ? (this.index-1) : this.siblings.length-1);
        }
    });


    // Plugins

    NG.plugin('lightbox', 'image', {

        init: function(lightbox) {

            lightbox.on("showitem.ng.lightbox", function(e, data){

                if (data.type == 'image' || data.source && data.source.match(/\.(jpg|jpeg|png|gif|svg)$/i)) {

                    var resolve = function(source, width, height) {

                        data.meta = {
                            "content" : '<img class="ng-responsive-width" width="'+width+'" height="'+height+'" src ="'+source+'">',
                            "width"   : width,
                            "height"  : height
                        };

                        data.type = 'image';

                        data.promise.resolve();
                    };

                    if (!cache[data.source]) {

                        var img = new Image();

                        img.onerror = function(){
                            data.promise.reject('Loading image failed');
                        };

                        img.onload = function(){
                            cache[data.source] = {width: img.width, height: img.height};
                            resolve(data.source, cache[data.source].width, cache[data.source].height);
                        };

                        img.src = data.source;

                    } else {
                        resolve(data.source, cache[data.source].width, cache[data.source].height);
                    }
                }
            });
        }
    });

    NG.plugin("lightbox", "youtube", {

        init: function(lightbox) {

            var youtubeRegExp = /(\/\/.*?youtube\.[a-z]+)\/watch\?v=([^&]+)&?(.*)/,
                youtubeRegExpShort = /youtu\.be\/(.*)/;


            lightbox.on("showitem.ng.lightbox", function(e, data){

                var id, matches, resolve = function(id, width, height) {

                    data.meta = {
                        'content': '<iframe src="//www.youtube.com/embed/'+id+'" width="'+width+'" height="'+height+'" style="max-width:100%;"></iframe>',
                        'width': width,
                        'height': height
                    };

                    data.type = 'iframe';

                    data.promise.resolve();
                };

                if (matches = data.source.match(youtubeRegExp)) {
                    id = matches[2];
                }

                if (matches = data.source.match(youtubeRegExpShort)) {
                    id = matches[1];
                }

                if (id) {

                    if(!cache[id]) {

                        var img = new Image(), lowres = false;

                        img.onerror = function(){
                            cache[id] = {width:640, height:320};
                            resolve(id, cache[id].width, cache[id].height);
                        };

                        img.onload = function(){
                            //youtube default 404 thumb, fall back to lowres
                            if (img.width == 120 && img.height == 90) {
                                if (!lowres) {
                                    lowres = true;
                                    img.src = '//img.youtube.com/vi/' + id + '/0.jpg';
                                } else {
                                    cache[id] = {width: 640, height: 320};
                                    resolve(id, cache[id].width, cache[id].height);
                                }
                            } else {
                                cache[id] = {width: img.width, height: img.height};
                                resolve(id, img.width, img.height);
                            }
                        };

                        img.src = '//img.youtube.com/vi/'+id+'/maxresdefault.jpg';

                    } else {
                        resolve(id, cache[id].width, cache[id].height);
                    }

                    e.stopImmediatePropagation();
                }
            });
        }
    });


    NG.plugin("lightbox", "vimeo", {

        init: function(lightbox) {

            var regex = /(\/\/.*?)vimeo\.[a-z]+\/([0-9]+).*?/, matches;


            lightbox.on("showitem.ng.lightbox", function(e, data){

                var id, resolve = function(id, width, height) {

                    data.meta = {
                        'content': '<iframe src="//player.vimeo.com/video/'+id+'" width="'+width+'" height="'+height+'" style="width:100%;box-sizing:border-box;"></iframe>',
                        'width': width,
                        'height': height
                    };

                    data.type = 'iframe';

                    data.promise.resolve();
                };

                if (matches = data.source.match(regex)) {

                    id = matches[2];

                    if(!cache[id]) {

                        NG.$.ajax({
                            type     : 'GET',
                            url      : 'http://vimeo.com/api/oembed.json?url=' + encodeURI(data.source),
                            jsonp    : 'callback',
                            dataType : 'jsonp',
                            success  : function(data) {
                                cache[id] = {width:data.width, height:data.height};
                                resolve(id, cache[id].width, cache[id].height);
                            }
                        });

                    } else {
                        resolve(id, cache[id].width, cache[id].height);
                    }

                    e.stopImmediatePropagation();
                }
            });
        }
    });

    NG.plugin("lightbox", "video", {

        init: function(lightbox) {

            lightbox.on("showitem.ng.lightbox", function(e, data){


                var resolve = function(source, width, height) {

                    data.meta = {
                        'content': '<video class="ng-responsive-width" src="'+source+'" width="'+width+'" height="'+height+'" controls></video>',
                        'width': width,
                        'height': height
                    };

                    data.type = 'video';

                    data.promise.resolve();
                };

                if (data.type == 'video' || data.source.match(/\.(mp4|webm|ogv)$/i)) {

                    if (!cache[data.source]) {

                        var vid = NG.$('<video style="position:fixed;visibility:hidden;top:-10000px;"></video>').attr('src', data.source).appendTo('body');

                        var idle = setInterval(function() {

                            if (vid[0].videoWidth) {
                                clearInterval(idle);
                                cache[data.source] = {width: vid[0].videoWidth, height: vid[0].videoHeight};
                                resolve(data.source, cache[data.source].width, cache[data.source].height);
                                vid.remove();
                            }

                        }, 20);

                    } else {
                        resolve(data.source, cache[data.source].width, cache[data.source].height);
                    }
                }
            });
        }
    });


    NGkit.plugin("lightbox", "iframe", {

        init: function (lightbox) {

            lightbox.on("showitem.ng.lightbox", function (e, data) {

                var resolve = function (source, width, height) {

                    data.meta = {
                        'content': '<iframe class="ng-responsive-width" src="' + source + '" width="' + width + '" height="' + height + '"></iframe>',
                        'width': width,
                        'height': height
                    };

                    data.type = 'iframe';

                    data.promise.resolve();
                };

                if (data.type === 'iframe' || data.source.match(/\.(html|php)$/)) {
                    resolve(data.source, (lightbox.options.width || 800), (lightbox.options.height || 600));
                }
            });

        }
    });

    function getModal(lightbox) {

        if (modal) {
            modal.lightbox = lightbox;
            return modal;
        }

        // init lightbox container
        modal = NG.$([
            '<div class="ng-modal">',
                '<div class="ng-modal-dialog ng-modal-dialog-lightbox ng-slidenav-position" style="margin-left:auto;margin-right:auto;width:200px;height:200px;top:'+Math.abs(window.innerHeight/2 - 200)+'px;">',
                    '<a href="#" class="ng-modal-close ng-close ng-close-alt"></a>',
                    '<div class="ng-lightbox-content"></div>',
                    '<div class="ng-modal-spinner ng-hidden"></div>',
                '</div>',
            '</div>'
        ].join('')).appendTo('body');

        modal.dialog  = modal.find('.ng-modal-dialog:first');
        modal.content = modal.find('.ng-lightbox-content:first');
        modal.loader  = modal.find('.ng-modal-spinner:first');
        modal.closer  = modal.find('.ng-close.ng-close-alt');
        modal.modal   = NG.modal(modal, {modal:false});

        // next / previous
        modal.on("swipeRight swipeLeft", function(e) {
            modal.lightbox[e.type=='swipeLeft' ? 'next':'previous']();
        }).on("click", "[data-lightbox-previous], [data-lightbox-next]", function(e){
            e.preventDefault();
            modal.lightbox[NG.$(this).is('[data-lightbox-next]') ? 'next':'previous']();
        });

        // destroy content on modal hide
        modal.on("hide.ng.modal", function(e) {
            modal.content.html('');
        });

        var resizeCache = {w: window.innerWidth, h:window.innerHeight};

        NG.$win.on('load resize orientationchange', NG.Utils.debounce(function(e){

            if (resizeCache.w !== window.innerWidth && modal.is(':visible') && !NG.Utils.isFullscreen()) {
                modal.lightbox.fitSize();
            }

            resizeCache = {w: window.innerWidth, h:window.innerHeight};

        }, 100));

        modal.lightbox = lightbox;

        return modal;
    }

    NG.lightbox.create = function(items, options) {

        if (!items) return;

        var group = [], o;

        items.forEach(function(item) {

            group.push(NG.$.extend({
                'source' : '',
                'title'  : '',
                'type'   : 'auto',
                'link'   : false
            }, (typeof(item) == 'string' ? {'source': item} : item)));
        });

        o = NG.lightbox(NG.$.extend({}, options, {'group':group}));

        return o;
    };

    return NG.lightbox;
});


/*
 * Based on Nestable jQuery Plugin - Copyright (c) 2012 David Bushell - http://dbushell.com/
 */
(function(addon) {

    var component;

    if (window.NGkit) {
        component = addon(NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-nestable", ["ngkit"], function(){
            return component || addon(NGkit);
        });
    }

})(function(NG) {

    "use strict";

    var hasTouch     = 'ontouchstart' in window,
        html         = NG.$html,
        touchedlists = [],
        $win         = NG.$win,
        draggingElement;

    var eStart  = hasTouch ? 'touchstart'  : 'mousedown',
        eMove   = hasTouch ? 'touchmove'   : 'mousemove',
        eEnd    = hasTouch ? 'touchend'    : 'mouseup',
        eCancel = hasTouch ? 'touchcancel' : 'mouseup';


    NG.component('nestable', {

        defaults: {
            listBaseClass   : 'ng-nestable',
            listClass       : 'ng-nestable-list',
            listItemClass   : 'ng-nestable-item',
            dragClass       : 'ng-nestable-dragged',
            movingClass     : 'ng-nestable-moving',
            noChildrenClass : 'ng-nestable-nochildren',
            emptyClass      : 'ng-nestable-empty',
            handleClass     : '',
            collapsedClass  : 'ng-collapsed',
            placeholderClass: 'ng-nestable-placeholder',
            noDragClass     : 'ng-nestable-nodrag',
            group           : false,
            maxDepth        : 10,
            threshold       : 20,
            idlethreshold   : 10,
        },

        boot: function() {

            // adjust document scrolling
            NG.$html.on('mousemove touchmove', function(e) {

                if (draggingElement) {

                    var top = draggingElement.offset().top;

                    if (top < NG.$win.scrollTop()) {
                        NG.$win.scrollTop(NG.$win.scrollTop() - Math.ceil(draggingElement.height()/2));
                    } else if ( (top + draggingElement.height()) > (window.innerHeight + NG.$win.scrollTop()) ) {
                        NG.$win.scrollTop(NG.$win.scrollTop() + Math.ceil(draggingElement.height()/2));
                    }
                }
            });

            // init code
            NG.ready(function(context) {

                NG.$("[data-ng-nestable]", context).each(function(){

                    var ele = NG.$(this);

                    if (!ele.data("nestable")) {
                        NG.nestable(ele, NG.Utils.options(ele.attr("data-ng-nestable")));
                    }
                });
            });
        },

        init: function() {

            var $this = this;

            Object.keys(this.options).forEach(function(key){

                if(String(key).indexOf('Class')!=-1) {
                    $this.options['_'+key] = '.' + $this.options[key];
                }
            });

            this.find(this.options._listItemClass).find(">ul").addClass(this.options.listClass);

            this.checkEmptyList();

            this.reset();
            this.element.data('nestable-group', this.options.group || NG.Utils.uid('nestable-group'));

            this.find(this.options._listItemClass).each(function() {
                $this.setParent(NG.$(this));
            });

            this.on('click', '[data-nestable-action]', function(e) {

                if ($this.dragEl || (!hasTouch && e.button !== 0)) {
                    return;
                }

                e.preventDefault();

                var target = NG.$(e.currentTarget),
                    action = target.data('nestableAction'),
                    item   = target.closest($this.options._listItemClass);

                if (action === 'collapse') {
                    $this.collapseItem(item);
                }
                if (action === 'expand') {
                    $this.expandItem(item);
                }
                if (action === 'toggle') {
                    $this.toggleItem(item);
                }
            });

            var onStartEvent = function(e) {

                var handle = NG.$(e.target),
                    link   = handle.is('a[href]') ? handle:handle.parents('a[href]');

                if (e.target === $this.element[0]) {
                    return;
                }

                if (handle.is($this.options._noDragClass) || handle.closest($this.options._noDragClass).length) {
                    return;
                }

                if (handle.is('[data-nestable-action]') || handle.closest('[data-nestable-action]').length) {
                    return;
                }

                if ($this.options.handleClass && !handle.hasClass($this.options.handleClass)) {

                    if ($this.options.handleClass) {
                        handle = handle.closest($this.options._handleClass);
                    }
                }

                if (!handle.length || $this.dragEl || (!hasTouch && e.button !== 0) || (hasTouch && e.touches.length !== 1)) {
                    return;
                }

                if (e.originalEvent && e.originalEvent.touches) {
                    e = evt.originalEvent.touches[0];
                }

                $this.delayMove = function(evt) {

                    link = false;

                    evt.preventDefault();
                    $this.dragStart(e);
                    $this.trigger('start.ng.nestable', [$this]);

                    $this.delayMove = false;
                };

                $this.delayMove.x         = parseInt(e.pageX, 10);
                $this.delayMove.y         = parseInt(e.pageY, 10);
                $this.delayMove.threshold = $this.options.idlethreshold;

                if (link.length && eEnd == 'touchend') {

                    $this.one(eEnd, function(){
                        if (link && link.attr('href').trim()) {
                            location.href = link.attr('href');
                        }
                    });
                }

                e.preventDefault();
            };

            var onMoveEvent = function(e) {

                if (e.originalEvent && e.originalEvent.touches) {
                    e = e.originalEvent.touches[0];
                }

                if ($this.delayMove && (Math.abs(e.pageX - $this.delayMove.x) > $this.delayMove.threshold || Math.abs(e.pageY - $this.delayMove.y) > $this.delayMove.threshold)) {

                    if (!window.getSelection().toString()) {
                        $this.delayMove(e);
                    } else {
                        $this.delayMove = false;
                    }
                }

                if ($this.dragEl) {
                    e.preventDefault();
                    $this.dragMove(e);
                    $this.trigger('move.ng.nestable', [$this]);
                }
            };

            var onEndEvent = function(e) {

                if ($this.dragEl) {
                    e.preventDefault();
                    $this.dragStop(hasTouch ? e.touches[0] : e);
                }

                draggingElement = false;
                $this.delayMove = false;
            };

            if (hasTouch) {
                this.element[0].addEventListener(eStart, onStartEvent, false);
                window.addEventListener(eMove, onMoveEvent, false);
                window.addEventListener(eEnd, onEndEvent, false);
                window.addEventListener(eCancel, onEndEvent, false);
            } else {
                this.on(eStart, onStartEvent);
                $win.on(eMove, onMoveEvent);
                $win.on(eEnd, onEndEvent);
            }

        },

        serialize: function() {

            var data,
                depth = 0,
                list  = this,
                step  = function(level, depth) {

                    var array = [ ], items = level.children(list.options._listItemClass);

                    items.each(function() {

                        var li    = NG.$(this),
                            item  = {}, attribute,
                            sub   = li.children(list.options._listClass);

                        for (var i = 0, attr, val; i < li[0].attributes.length; i++) {
                            attribute = li[0].attributes[i];
                            if (attribute.name.indexOf('data-') === 0) {
                                attr       = attribute.name.substr(5);
                                val        =  NG.Utils.str2json(attribute.value);
                                item[attr] = (val || attribute.value=='false' || attribute.value=='0') ? val:attribute.value;
                            }
                        }

                        if (sub.length) {
                            item.children = step(sub, depth + 1);
                        }

                        array.push(item);

                    });
                    return array;
                };

            data = step(list.element, depth);

            return data;
        },

        list: function(options) {

            var data  = [],
                list  = this,
                depth = 0,
                step  = function(level, depth, parent) {

                    var items = level.children(options._listItemClass);

                    items.each(function(index) {
                        var li   = NG.$(this),
                            item = NG.$.extend({parent_id: (parent ? parent : null), depth: depth, order: index}, li.data()),
                            sub  = li.children(options._listClass);

                        data.push(item);

                        if (sub.length) {
                            step(sub, depth + 1, li.data(options.idProperty || 'id'));
                        }
                    });
                };

            options = NG.$.extend({}, list.options, options);

            step(list.element, depth);

            return data;
        },

        reset: function() {

            this.mouse = {
                offsetX   : 0,
                offsetY   : 0,
                startX    : 0,
                startY    : 0,
                lastX     : 0,
                lastY     : 0,
                nowX      : 0,
                nowY      : 0,
                distX     : 0,
                distY     : 0,
                dirAx     : 0,
                dirX      : 0,
                dirY      : 0,
                lastDirX  : 0,
                lastDirY  : 0,
                distAxX   : 0,
                distAxY   : 0
            };
            this.moving     = false;
            this.dragEl     = null;
            this.dragRootEl = null;
            this.dragDepth  = 0;
            this.hasNewRoot = false;
            this.pointEl    = null;

            for (var i=0; i<touchedlists.length; i++) {
                this.checkEmptyList(touchedlists[i]);
            }

            touchedlists = [];
        },

        toggleItem: function(li) {
            this[li.hasClass(this.options.collapsedClass) ? "expandItem":"collapseItem"](li);
        },

        expandItem: function(li) {
            li.removeClass(this.options.collapsedClass);
        },

        collapseItem: function(li) {
            var lists = li.children(this.options._listClass);
            if (lists.length) {
                li.addClass(this.options.collapsedClass);
            }
        },

        expandAll: function() {
            var list = this;
            this.find(list.options._listItemClass).each(function() {
                list.expandItem(NG.$(this));
            });
        },

        collapseAll: function() {
            var list = this;
            this.find(list.options._listItemClass).each(function() {
                list.collapseItem(NG.$(this));
            });
        },

        setParent: function(li) {

            if (li.children(this.options._listClass).length) {
                li.addClass("ng-parent");
            }
        },

        unsetParent: function(li) {
            li.removeClass('ng-parent '+this.options.collapsedClass);
            li.children(this.options._listClass).remove();
        },

        dragStart: function(e) {

            var mouse    = this.mouse,
                target   = NG.$(e.target),
                dragItem = target.closest(this.options._listItemClass),
                offset   = dragItem.offset();

            this.placeEl = dragItem;

            mouse.offsetX = e.pageX - offset.left;
            mouse.offsetY = e.pageY - offset.top;

            mouse.startX = mouse.lastX = offset.left;
            mouse.startY = mouse.lastY = offset.top;

            this.dragRootEl = this.element;

            this.dragEl = NG.$('<ul></ul>').addClass(this.options.listClass + ' ' + this.options.dragClass).append(dragItem.clone());
            this.dragEl.css('width', dragItem.width());
            this.placeEl.addClass(this.options.placeholderClass);

            draggingElement = this.dragEl;

            this.tmpDragOnSiblings = [dragItem[0].previousSibling, dragItem[0].nextSibling];

            NG.$body.append(this.dragEl);

            this.dragEl.css({
                left : offset.left,
                top  : offset.top
            });

            // total depth of dragging item
            var i, depth, items = this.dragEl.find(this.options._listItemClass);

            for (i = 0; i < items.length; i++) {
                depth = NG.$(items[i]).parents(this.options._listClass+','+this.options._listBaseClass).length;
                if (depth > this.dragDepth) {
                    this.dragDepth = depth;
                }
            }

            html.addClass(this.options.movingClass);
        },

        dragStop: function(e) {

            var el       = NG.$(this.placeEl),
                root     = this.placeEl.parents(this.options._listBaseClass+':first');

            this.placeEl.removeClass(this.options.placeholderClass);
            this.dragEl.remove();

            if (this.element[0] !== root[0]) {

                root.trigger('change.ng.nestable',[root.data('nestable'), el, 'added']);
                this.element.trigger('change.ng.nestable', [this, el, 'removed']);

            } else {
                this.element.trigger('change.ng.nestable',[this, el, "moved"]);
            }

            this.trigger('stop.ng.nestable', [this, el]);

            this.reset();

            html.removeClass(this.options.movingClass);
        },

        dragMove: function(e) {
            var list, parent, prev, next, depth,
                opt      = this.options,
                mouse    = this.mouse,
                maxDepth = this.dragRootEl ? this.dragRootEl.data('nestable').options.maxDepth : opt.maxDepth;

            this.dragEl.css({
                left : e.pageX - mouse.offsetX,
                top  : e.pageY - mouse.offsetY
            });

            // mouse position last events
            mouse.lastX = mouse.nowX;
            mouse.lastY = mouse.nowY;
            // mouse position this events
            mouse.nowX  = e.pageX;
            mouse.nowY  = e.pageY;
            // distance mouse moved between events
            mouse.distX = mouse.nowX - mouse.lastX;
            mouse.distY = mouse.nowY - mouse.lastY;
            // direction mouse was moving
            mouse.lastDirX = mouse.dirX;
            mouse.lastDirY = mouse.dirY;
            // direction mouse is now moving (on both axis)
            mouse.dirX = mouse.distX === 0 ? 0 : mouse.distX > 0 ? 1 : -1;
            mouse.dirY = mouse.distY === 0 ? 0 : mouse.distY > 0 ? 1 : -1;
            // axis mouse is now moving on
            var newAx   = Math.abs(mouse.distX) > Math.abs(mouse.distY) ? 1 : 0;

            // do nothing on first move
            if (!mouse.moving) {
                mouse.dirAx  = newAx;
                mouse.moving = true;
                return;
            }

            // calc distance moved on this axis (and direction)
            if (mouse.dirAx !== newAx) {
                mouse.distAxX = 0;
                mouse.distAxY = 0;
            } else {
                mouse.distAxX += Math.abs(mouse.distX);
                if (mouse.dirX !== 0 && mouse.dirX !== mouse.lastDirX) {
                    mouse.distAxX = 0;
                }
                mouse.distAxY += Math.abs(mouse.distY);
                if (mouse.dirY !== 0 && mouse.dirY !== mouse.lastDirY) {
                    mouse.distAxY = 0;
                }
            }
            mouse.dirAx = newAx;

            /**
             * move horizontal
             */
            if (mouse.dirAx && mouse.distAxX >= opt.threshold) {
                // reset move distance on x-axis for new phase
                mouse.distAxX = 0;
                prev = this.placeEl.prev('li');

                // increase horizontal level if previous sibling exists, is not collapsed, and does not have a 'no children' class
                if (mouse.distX > 0 && prev.length && !prev.hasClass(opt.collapsedClass) && !prev.hasClass(opt.noChildrenClass)) {

                    // cannot increase level when item above is collapsed
                    list = prev.find(opt._listClass).last();

                    // check if depth limit has reached
                    depth = this.placeEl.parents(opt._listClass+','+opt._listBaseClass).length;

                    if (depth + this.dragDepth <= maxDepth) {

                        // create new sub-level if one doesn't exist
                        if (!list.length) {
                            list = NG.$('<ul/>').addClass(opt.listClass);
                            list.append(this.placeEl);
                            prev.append(list);
                            this.setParent(prev);
                        } else {
                            // else append to next level up
                            list = prev.children(opt._listClass).last();
                            list.append(this.placeEl);
                        }
                    }
                }

                // decrease horizontal level
                if (mouse.distX < 0) {

                    // we cannot decrease the level if an item precedes the current one
                    next = this.placeEl.next(opt._listItemClass);
                    if (!next.length) {

                        // get parent ul of the list item
                        var parentUl = this.placeEl.closest([opt._listBaseClass, opt._listClass].join(','));
                        // try to get the li surrounding the ul
                        var surroundingLi = parentUl.closest(opt._listItemClass);

                        // if the ul is inside of a li (meaning it is nested)
                        if (surroundingLi.length) {
                            // we can decrease the horizontal level
                            surroundingLi.after(this.placeEl);
                            // if the previous parent ul is now empty
                            if (!parentUl.children().length) {
                                this.unsetParent(surroundingLi);
                            }
                        }
                    }
                }
            }

            var isEmpty = false;

            // find list item under cursor
            var pointX = e.pageX - (window.pageXOffset || document.scrollLeft || 0),
                pointY = e.pageY - (window.pageYOffset || document.documentElement.scrollTop);
            this.pointEl = NG.$(document.elementFromPoint(pointX, pointY));

            if (opt.handleClass && this.pointEl.hasClass(opt.handleClass)) {

                this.pointEl = this.pointEl.closest(opt._listItemClass);

            } else {

                var nestableitem = this.pointEl.closest(opt._listItemClass);

                if (nestableitem.length) {
                    this.pointEl = nestableitem;
                }
            }

            if (this.placeEl.find(this.pointEl).length) {
                return;
            }

            if (this.pointEl.data('nestable') && !this.pointEl.children().length) {
                isEmpty = true;
                this.checkEmptyList(this.pointEl);
            } else if (!this.pointEl.length || !this.pointEl.hasClass(opt.listItemClass)) {
                return;
            }

            // find parent list of item under cursor
            var pointElRoot = this.element,
                tmpRoot     = this.pointEl.closest(this.options._listBaseClass),
                isNewRoot   = pointElRoot[0] != tmpRoot[0];

            /**
             * move vertical
             */
            if (!mouse.dirAx || isNewRoot || isEmpty) {

                // check if groups match if dragging over new root
                if (isNewRoot && opt.group !== tmpRoot.data('nestable-group')) {
                    return;
                } else {
                    touchedlists.push(pointElRoot);
                }

                // check depth limit
                depth = this.dragDepth - 1 + this.pointEl.parents(opt._listClass+','+opt._listBaseClass).length;

                if (depth > maxDepth) {
                    return;
                }

                var before = e.pageY < (this.pointEl.offset().top + this.pointEl.height() / 2);

                parent = this.placeEl.parent();

                if (isEmpty) {
                    this.pointEl.append(this.placeEl);
                } else if (before) {
                    this.pointEl.before(this.placeEl);
                } else {
                    this.pointEl.after(this.placeEl);
                }

                if (!parent.children().length) {
                    if (!parent.data("nestable")) this.unsetParent(parent.parent());
                }

                this.checkEmptyList(this.dragRootEl);
                this.checkEmptyList(pointElRoot);

                // parent root list has changed
                if (isNewRoot) {
                    this.dragRootEl = tmpRoot;
                    this.hasNewRoot = this.element[0] !== this.dragRootEl[0];
                }
            }
        },

        checkEmptyList: function(list) {

            list  = list ? NG.$(list) : this.element;

            if (this.options.emptyClass) {
                list[!list.children().length ? 'addClass':'removeClass'](this.options.emptyClass);
            }
        }

    });

    return NG.nestable;
});


(function(addon) {

    var component;

    if (window.NGkit) {
        component = addon(NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-notify", ["ngkit"], function(){
            return component || addon(NGkit);
        });
    }

})(function(NG){

    "use strict";

    var containers = {},
        messages   = {},

        notify     =  function(options){

            if (NG.$.type(options) == 'string') {
                options = { message: options };
            }

            if (arguments[1]) {
                options = NG.$.extend(options, NG.$.type(arguments[1]) == 'string' ? {status:arguments[1]} : arguments[1]);
            }

            return (new Message(options)).show();
        },
        closeAll  = function(group, instantly){

            var id;

            if (group) {
                for(id in messages) { if(group===messages[id].group) messages[id].close(instantly); }
            } else {
                for(id in messages) { messages[id].close(instantly); }
            }
        };

    var Message = function(options){

        this.options = NG.$.extend({}, Message.defaults, options);

        this.uuid    = NG.Utils.uid("notifymsg");
        this.element = NG.$([

            '<div class="ng-notify-message">',
                '<a class="ng-close"></a>',
                '<div></div>',
            '</div>'

        ].join('')).data("notifyMessage", this);

        this.content(this.options.message);

        // status
        if (this.options.status) {
            this.element.addClass('ng-notify-message-'+this.options.status);
            this.currentstatus = this.options.status;
        }

        this.group = this.options.group;

        messages[this.uuid] = this;

        if(!containers[this.options.pos]) {
            containers[this.options.pos] = NG.$('<div class="ng-notify ng-notify-'+this.options.pos+'"></div>').appendTo('body').on("click", ".ng-notify-message", function(){

                var message = NG.$(this).data("notifyMessage");

                message.element.trigger('manualclose.ng.notify', [message]);
                message.close();
            });
        }
    };


    NG.$.extend(Message.prototype, {

        uuid: false,
        element: false,
        timout: false,
        currentstatus: "",
        group: false,

        show: function() {

            if (this.element.is(":visible")) return;

            var $this = this;

            containers[this.options.pos].show().prepend(this.element);

            var marginbottom = parseInt(this.element.css("margin-bottom"), 10);

            this.element.css({"opacity":0, "margin-top": -1*this.element.outerHeight(), "margin-bottom":0}).animate({"opacity":1, "margin-top": 0, "margin-bottom":marginbottom}, function(){

                if ($this.options.timeout) {

                    var closefn = function(){ $this.close(); };

                    $this.timeout = setTimeout(closefn, $this.options.timeout);

                    $this.element.hover(
                        function() { clearTimeout($this.timeout); },
                        function() { $this.timeout = setTimeout(closefn, $this.options.timeout);  }
                    );
                }

            });

            return this;
        },

        close: function(instantly) {

            var $this    = this,
                finalize = function(){
                    $this.element.remove();

                    if (!containers[$this.options.pos].children().length) {
                        containers[$this.options.pos].hide();
                    }

                    $this.options.onClose.apply($this, []);
                    $this.element.trigger('close.ng.notify', [$this]);

                    delete messages[$this.uuid];
                };

            if (this.timeout) clearTimeout(this.timeout);

            if (instantly) {
                finalize();
            } else {
                this.element.animate({"opacity":0, "margin-top": -1* this.element.outerHeight(), "margin-bottom":0}, function(){
                    finalize();
                });
            }
        },

        content: function(html){

            var container = this.element.find(">div");

            if(!html) {
                return container.html();
            }

            container.html(html);

            return this;
        },

        status: function(status) {

            if (!status) {
                return this.currentstatus;
            }

            this.element.removeClass('ng-notify-message-'+this.currentstatus).addClass('ng-notify-message-'+status);

            this.currentstatus = status;

            return this;
        }
    });

    Message.defaults = {
        message: "",
        status: "",
        timeout: 5000,
        group: null,
        pos: 'top-center',
        onClose: function() {}
    };

    NG.notify          = notify;
    NG.notify.message  = Message;
    NG.notify.closeAll = closeAll;

    return notify;
});


/*
 * Based on simplePagination - Copyright (c) 2012 Flavius Matis - http://flaviusmatis.github.com/simplePagination.js/ (MIT)
 */
(function(addon) {

    var component;

    if (window.NGkit) {
        component = addon(NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-pagination", ["ngkit"], function(){
            return component || addon(NGkit);
        });
    }

})(function(NG){

    "use strict";

    NG.component('pagination', {

        defaults: {
            items          : 1,
            itemsOnPage    : 1,
            pages          : 0,
            displayedPages : 7,
            edges          : 1,
            currentPage    : 0,
            lblPrev        : false,
            lblNext        : false,
            onSelectPage   : function() {}
        },

        boot: function() {

            // init code
            NG.ready(function(context) {

                NG.$("[data-ng-pagination]", context).each(function(){
                    var ele = NG.$(this);

                    if (!ele.data("pagination")) {
                        NG.pagination(ele, NG.Utils.options(ele.attr("data-ng-pagination")));
                    }
                });
            });
        },

        init: function() {

            var $this = this;

            this.pages         = this.options.pages ?  this.options.pages : Math.ceil(this.options.items / this.options.itemsOnPage) ? Math.ceil(this.options.items / this.options.itemsOnPage) : 1;
            this.currentPage   = this.options.currentPage;
            this.halfDisplayed = this.options.displayedPages / 2;

            this.on("click", "a[data-page]", function(e){
                e.preventDefault();
                $this.selectPage(NG.$(this).data("page"));
            });

            this._render();
        },

        _getInterval: function() {

            return {
                start: Math.ceil(this.currentPage > this.halfDisplayed ? Math.max(Math.min(this.currentPage - this.halfDisplayed, (this.pages - this.options.displayedPages)), 0) : 0),
                end  : Math.ceil(this.currentPage > this.halfDisplayed ? Math.min(this.currentPage + this.halfDisplayed, this.pages) : Math.min(this.options.displayedPages, this.pages))
            };
        },

        render: function(pages) {
            this.pages = pages ? pages : this.pages;
            this._render();
        },

        selectPage: function(pageIndex, pages) {
            this.currentPage = pageIndex;
            this.render(pages);

            this.options.onSelectPage.apply(this, [pageIndex]);
            this.trigger('select.ng.pagination', [pageIndex, this]);
        },

        _render: function() {

            var o = this.options, interval = this._getInterval(), i;

            this.element.empty();

            // Generate Prev link
            if (o.lblPrev) this._append(this.currentPage - 1, {text: o.lblPrev});

            // Generate start edges
            if (interval.start > 0 && o.edges > 0) {

                var end = Math.min(o.edges, interval.start);

                for (i = 0; i < end; i++) this._append(i);

                if (o.edges < interval.start && (interval.start - o.edges != 1)) {
                    this.element.append('<li><span>...</span></li>');
                } else if (interval.start - o.edges == 1) {
                    this._append(o.edges);
                }
            }

            // Generate interval links
            for (i = interval.start; i < interval.end; i++) this._append(i);

            // Generate end edges
            if (interval.end < this.pages && o.edges > 0) {

                if (this.pages - o.edges > interval.end && (this.pages - o.edges - interval.end != 1)) {
                    this.element.append('<li><span>...</span></li>');
                } else if (this.pages - o.edges - interval.end == 1) {
                    this._append(interval.end++);
                }

                var begin = Math.max(this.pages - o.edges, interval.end);

                for (i = begin; i < this.pages; i++) this._append(i);
            }

            // Generate Next link (unless option is set for at front)
            if (o.lblNext) this._append(this.currentPage + 1, {text: o.lblNext});
        },

        _append: function(pageIndex, opts) {

            var item, options;

            pageIndex = pageIndex < 0 ? 0 : (pageIndex < this.pages ? pageIndex : this.pages - 1);
            options   = NG.$.extend({ text: pageIndex + 1 }, opts);

            item = (pageIndex == this.currentPage) ? '<li class="ng-active"><span>' + (options.text) + '</span></li>' : '<li><a href="#page-'+(pageIndex+1)+'" data-page="'+pageIndex+'">'+options.text+'</a></li>';

            this.element.append(item);
        }
    });

    return NG.pagination;
});


(function(addon) {

    var component;

    if (window.NGkit) {
        component = addon(NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-parallax", ["ngkit"], function(){
            return component || addon(NGkit);
        });
    }

})(function(NG){

    "use strict";

    var parallaxes      = [],
        supports3d      = false,
        scrolltop       = 0,
        wh              = window.innerHeight,
        checkParallaxes = function() {

            scrolltop = NG.$win.scrollTop();

            window.requestAnimationFrame(function(){
                for (var i=0; i < parallaxes.length; i++) {
                    parallaxes[i].process();
                }
            });
        };


    NG.component('parallax', {

        defaults: {
            velocity : 0.5,
            target   : false,
            viewport : false,
            media    : false
        },

        boot: function() {

            supports3d = (function(){

                var el = document.createElement('div'),
                    has3d,
                    transforms = {
                        'WebkitTransform':'-webkit-transform',
                        'MSTransform':'-ms-transform',
                        'MozTransform':'-moz-transform',
                        'Transform':'transform'
                    };

                // Add it to the body to get the computed style.
                document.body.insertBefore(el, null);

                for (var t in transforms) {
                    if (el.style[t] !== undefined) {
                        el.style[t] = "translate3d(1px,1px,1px)";
                        has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
                    }
                }

                document.body.removeChild(el);

                return (has3d !== undefined && has3d.length > 0 && has3d !== "none");
            })();

            // listen to scroll and resize
            NG.$doc.on("scrolling.ng.document", checkParallaxes);
            NG.$win.on("load resize orientationchange", NG.Utils.debounce(function(){
                wh = window.innerHeight;
                checkParallaxes();
            }, 50));

            // init code
            NG.ready(function(context) {

                NG.$('[data-ng-parallax]', context).each(function() {

                    var parallax = NG.$(this);

                    if (!parallax.data("parallax")) {
                        NG.parallax(parallax, NG.Utils.options(parallax.attr("data-ng-parallax")));
                    }
                });
            });
        },

        init: function() {

            this.base     = this.options.target ? NG.$(this.options.target) : this.element;
            this.props    = {};
            this.velocity = (this.options.velocity || 1);

            var reserved  = ['target','velocity','viewport','plugins','media'];

            Object.keys(this.options).forEach(function(prop){

                if (reserved.indexOf(prop) !== -1) {
                    return;
                }

                var start, end, dir, diff, startend = String(this.options[prop]).split(',');

                if (prop.match(/color/i)) {
                    start = startend[1] ? startend[0] : this._getStartValue(prop),
                    end   = startend[1] ? startend[1] : startend[0];

                    if (!start) {
                        start = 'rgba(255,255,255,0)';
                    }

                } else {
                    start = parseFloat(startend[1] ? startend[0] : this._getStartValue(prop)),
                    end   = parseFloat(startend[1] ? startend[1] : startend[0]);
                    diff  = (start < end ? (end-start):(start-end));
                    dir   = (start < end ? 1:-1);
                }

                this.props[prop] = { 'start': start, 'end': end, 'dir': dir, 'diff': diff };

            }.bind(this));

            parallaxes.push(this);
        },

        process: function() {

            if (this.options.media) {

                switch(typeof(this.options.media)) {
                    case 'number':
                        if (window.innerWidth < this.options.media) {
                            return false;
                        }
                        break;
                    case 'string':
                        if (window.matchMedia && !window.matchMedia(this.options.media).matches) {
                            return false;
                        }
                        break;
                }
            }

            var percent = this.percentageInViewport();

            if (this.options.viewport !== false) {
                percent = (this.options.viewport === 0) ? 1 : percent / this.options.viewport;
            }

            this.update(percent);
        },

        percentageInViewport: function() {

            var top     = this.base.offset().top,
                height  = this.base.outerHeight(),
                distance, percentage, percent;

            if (top > (scrolltop + wh)) {
                percent = 0;
            } else if ((top + height) < scrolltop) {
                percent = 1;
            } else {

                if ((top + height) < wh) {

                    percent = (scrolltop < wh ? scrolltop : scrolltop - wh) / (top+height);

                } else {

                    distance   = (scrolltop + wh) - top;
                    percentage = Math.round(distance / ((wh + height) / 100));
                    percent    = percentage/100;
                }
            }

            return percent;
        },

        update: function(percent) {

            var $this      = this,
                css        = {transform:'', filter:''},
                compercent = percent * (1 - (this.velocity - (this.velocity * percent))),
                opts, val;

            if (compercent < 0) compercent = 0;
            if (compercent > 1) compercent = 1;

            if (this._percent !== undefined && this._percent == compercent) {
                return;
            }

            Object.keys(this.props).forEach(function(prop) {

                opts = this.props[prop];

                if (percent === 0) {
                    val = opts.start;
                } else if(percent === 1) {
                    val = opts.end;
                } else if(opts.diff !== undefined) {
                    val = opts.start + (opts.diff * compercent * opts.dir);
                }

                if ((prop == 'bg' || prop == 'bgp') && !this._bgcover) {
                    this._bgcover = initBgImageParallax(this, prop, opts);
                }

                switch(prop) {

                    // transforms
                    case 'x':
                        css.transform += supports3d ? ' translate3d('+val+'px, 0, 0)':' translateX('+val+'px)';
                        break;
                    case 'xp':
                        css.transform += supports3d ? ' translate3d('+val+'%, 0, 0)':' translateX('+val+'%)';
                        break;
                    case 'y':
                        css.transform += supports3d ? ' translate3d(0, '+val+'px, 0)':' translateY('+val+'px)';
                        break;
                    case 'yp':
                        css.transform += supports3d ? ' translate3d(0, '+val+'%, 0)':' translateY('+val+'%)';
                        break;
                    case 'rotate':
                        css.transform += ' rotate('+val+'deg)';
                        break;
                    case 'scale':
                        css.transform += ' scale('+val+')';
                        break;

                    // bg image
                    case 'bg':

                        // don't move if image height is too small
                        // if ($this.element.data('bgsize') && ($this.element.data('bgsize').h + val - window.innerHeight) < 0) {
                        //     break;
                        // }

                        css['background-position'] = '50% '+val+'px';
                        break;
                    case 'bgp':
                        css['background-position'] = '50% '+val+'%';
                        break;

                    // color
                    case 'color':
                    case 'background-color':
                    case 'border-color':
                        css[prop] = calcColor(opts.start, opts.end, compercent);
                        break;

                    // CSS Filter
                    case 'blur':
                        css.filter += ' blur('+val+'px)';
                        break;
                    case 'hue':
                        css.filter += ' hue-rotate('+val+'deg)';
                        break;
                    case 'grayscale':
                        css.filter += ' grayscale('+val+'%)';
                        break;
                    case 'invert':
                        css.filter += ' invert('+val+'%)';
                        break;
                    case 'fopacity':
                        css.filter += ' opacity('+val+'%)';
                        break;
                    case 'saturate':
                        css.filter += ' saturate('+val+'%)';
                        break;
                    case 'sepia':
                        css.filter += ' sepia('+val+'%)';
                        break;

                    default:
                        css[prop] = val;
                        break;
                }

            }.bind(this));

            if (css.filter) {
                css['-webkit-filter'] = css.filter;
            }

            this.element.css(css);

            this._percent = compercent;
        },

        _getStartValue: function(prop) {

            var value = 0;

            switch(prop) {
                case 'scale':
                    value = 1;
                    break;
                default:
                    value = this.element.css(prop);
            }

            return (value || 0);
        }

    });


    // helper

    function initBgImageParallax(obj, prop, opts) {

        var img = new Image(), url, element, size, check, ratio, width, height;

        element = obj.element.css({'background-size': 'cover',  'background-repeat': 'no-repeat'});
        url     = element.css('background-image').replace(/^url\(/g, '').replace(/\)$/g, '').replace(/("|')/g, '');
        check   = function() {

            var w = element.innerWidth(), h = element.innerHeight(), extra = (prop=='bg') ? opts.diff : (opts.diff/100) * h;

            h += extra;
            w += Math.ceil(extra * ratio);

            if (w-extra < size.w && h < size.h) {
                return obj.element.css({'background-size': 'auto'});
            }

            // if element height < parent height (gap underneath)
            if ((w / ratio) < h) {

                width  = Math.ceil(h * ratio);
                height = h;

                if (h > window.innerHeight) {
                    width  = width * 1.2;
                    height = height * 1.2;
                }

            // element width < parent width (gap to right)
            } else {

                width  = w;
                height = Math.ceil(w / ratio);
            }

            element.css({'background-size': (width+'px '+height+'px')}).data('bgsize', {w:width,h:height});
        };

        img.onerror = function(){
            // image url doesn't exist
        };

        img.onload = function(){
            size  = {w:img.width, h:img.height};
            ratio = img.width / img.height;

            NG.$win.on("load resize orientationchange", NG.Utils.debounce(function(){
                check();
            }, 50));

            check();
        };

        img.src = url;

        return true;
    }


    // Some named colors to work with, added by Bradley Ayers
    // From Interface by Stefan Petre
    // http://interface.eyecon.ro/
    var colors = {
        'black': [0,0,0,1],
        'blue': [0,0,255,1],
        'brown': [165,42,42,1],
        'cyan': [0,255,255,1],
        'fuchsia': [255,0,255,1],
        'gold': [255,215,0,1],
        'green': [0,128,0,1],
        'indigo': [75,0,130,1],
        'khaki': [240,230,140,1],
        'lime': [0,255,0,1],
        'magenta': [255,0,255,1],
        'maroon': [128,0,0,1],
        'navy': [0,0,128,1],
        'olive': [128,128,0,1],
        'orange': [255,165,0,1],
        'pink': [255,192,203,1],
        'purple': [128,0,128,1],
        'violet': [128,0,128,1],
        'red': [255,0,0,1],
        'silver': [192,192,192,1],
        'white': [255,255,255,1],
        'yellow': [255,255,0,1],
        'transparent': [255,255,255,0]
    };

    function calcColor(start, end, pos) {

        start = parseColor(start);
        end   = parseColor(end);
        pos   = pos || 0;

        return calculateColor(start, end, pos);
    }

    /**!
     * @preserve Color animation 1.6.0
     * http://www.bitstorm.org/jquery/color-animation/
     * Copyright 2011, 2013 Edwin Martin <edwin@bitstorm.org>
     * Released under the MIT and GPL licenses.
     */

    // Calculate an in-between color. Returns "#aabbcc"-like string.
    function calculateColor(begin, end, pos) {
        var color = 'rgba('
                + parseInt((begin[0] + pos * (end[0] - begin[0])), 10) + ','
                + parseInt((begin[1] + pos * (end[1] - begin[1])), 10) + ','
                + parseInt((begin[2] + pos * (end[2] - begin[2])), 10) + ','
                + (begin && end ? parseFloat(begin[3] + pos * (end[3] - begin[3])) : 1);

        color += ')';
        return color;
    }

    // Parse an CSS-syntax color. Outputs an array [r, g, b]
    function parseColor(color) {

        var match, quadruplet;

        // Match #aabbcc
        if (match = /#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/.exec(color)) {
            quadruplet = [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16), 1];

            // Match #abc
        } else if (match = /#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])/.exec(color)) {
            quadruplet = [parseInt(match[1], 16) * 17, parseInt(match[2], 16) * 17, parseInt(match[3], 16) * 17, 1];

            // Match rgb(n, n, n)
        } else if (match = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(color)) {
            quadruplet = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), 1];

        } else if (match = /rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9\.]*)\s*\)/.exec(color)) {
            quadruplet = [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10),parseFloat(match[4])];

            // No browser returns rgb(n%, n%, n%), so little reason to support this format.
        } else {
            quadruplet = colors[color] || [255,255,255,0];
        }
        return quadruplet;
    }

    return NG.parallax;
});


(function(addon) {

    var component;

    if (window.NGkit) {
        component = addon(NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-search", ["ngkit"], function(){
            return component || addon(NGkit);
        });
    }

})(function(NG){

    "use strict";

    NG.component('search', {
        defaults: {
            msgResultsHeader   : 'Search Results',
            msgMoreResults     : 'More Results',
            msgNoResults       : 'No results found',
            template           : '<ul class="ng-nav ng-nav-search ng-autocomplete-results">\
                                      {{#msgResultsHeader}}<li class="ng-nav-header ng-skip">{{msgResultsHeader}}</li>{{/msgResultsHeader}}\
                                      {{#items && items.length}}\
                                          {{~items}}\
                                          <li data-url="{{!$item.url}}">\
                                              <a href="{{!$item.url}}">\
                                                  {{{$item.title}}}\
                                                  {{#$item.text}}<div>{{{$item.text}}}</div>{{/$item.text}}\
                                              </a>\
                                          </li>\
                                          {{/items}}\
                                          {{#msgMoreResults}}\
                                              <li class="ng-nav-divider ng-skip"></li>\
                                              <li class="ng-search-moreresults" data-moreresults="true"><a href="#" onclick="jQuery(this).closest(\'form\').submit();">{{msgMoreResults}}</a></li>\
                                          {{/msgMoreResults}}\
                                      {{/end}}\
                                      {{^items.length}}\
                                        {{#msgNoResults}}<li class="ng-skip"><a>{{msgNoResults}}</a></li>{{/msgNoResults}}\
                                      {{/end}}\
                                  </ul>',

            renderer: function(data) {

                var opts = this.options;

                this.dropdown.append(this.template({"items":data.results || [], "msgResultsHeader":opts.msgResultsHeader, "msgMoreResults": opts.msgMoreResults, "msgNoResults": opts.msgNoResults}));
                this.show();
            }
        },

        boot: function() {

            // init code
            NG.$html.on("focus.search.ngkit", "[data-ng-search]", function(e) {
                var ele =NG.$(this);

                if (!ele.data("search")) {
                    NG.search(ele, NG.Utils.options(ele.attr("data-ng-search")));
                }
            });
        },

        init: function() {
            var $this = this;

            this.autocomplete = NG.autocomplete(this.element, this.options);

            this.autocomplete.dropdown.addClass('ng-dropdown-search');

            this.autocomplete.input.on("keyup", function(){
                $this.element[$this.autocomplete.input.val() ? "addClass":"removeClass"]("ng-active");
            }).closest("form").on("reset", function(){
                $this.value="";
                $this.element.removeClass("ng-active");
            });

            this.on('selectitem.ng.autocomplete', function(e, data) {
                if (data.url) {
                  location.href = data.url;
                } else if(data.moreresults) {
                  $this.autocomplete.input.closest('form').submit();
                }
            });

            this.element.data("search", this);
        }
    });
});


(function(addon) {

    var component;

    if (window.NGkit) {
        component = addon(NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-slider", ["ngkit"], function(){
            return component || addon(NGkit);
        });
    }

})(function(NG){

    "use strict";

    var dragging, delayIdle, anchor, dragged, store = {};

    NG.component('slider', {

        defaults: {
            center           : false,
            threshold        : 10,
            infinite         : true,
            autoplay         : false,
            autoplayInterval : 7000,
            pauseOnHover     : true,
            activecls        : 'ng-active'
        },

        boot:  function() {

            // init code
            NG.ready(function(context) {

                setTimeout(function(){

                    NG.$('[data-ng-slider]', context).each(function(){

                        var ele = NG.$(this);

                        if (!ele.data('slider')) {
                            NG.slider(ele, NG.Utils.options(ele.attr('data-ng-slider')));
                        }
                    });

                }, 0);
            });
        },

        init: function() {

            var $this = this;

            this.container = this.element.find('.ng-slider');
            this.focus     = 0;

            NG.$win.on('resize load', NG.Utils.debounce(function() {
                $this.resize(true);
            }, 100));

            this.on('click.ng.slider', '[data-ng-slider-item]', function(e) {

                e.preventDefault();

                var item = NG.$(this).attr('data-ng-slider-item');

                if ($this.focus == item) return;

                // stop autoplay
                $this.stop();

                switch(item) {
                    case 'next':
                    case 'previous':
                        $this[item=='next' ? 'next':'previous']();
                        break;
                    default:
                        $this.updateFocus(parseInt(item, 10));
                }
            });

            this.container.on({

                'touchstart mousedown': function(evt) {

                    if (evt.originalEvent && evt.originalEvent.touches) {
                        evt = evt.originalEvent.touches[0];
                    }

                    // ignore right click button
                    if (evt.button && evt.button==2 || !$this.active) {
                        return;
                    }

                    // stop autoplay
                    $this.stop();

                    anchor  = NG.$(evt.target).is('a') ? NG.$(evt.target) : NG.$(evt.target).parents('a:first');
                    dragged = false;

                    if (anchor.length) {

                        anchor.one('click', function(e){
                            if (dragged) e.preventDefault();
                        });
                    }

                    delayIdle = function(e) {

                        dragged  = true;
                        dragging = $this;
                        store    = {
                            touchx : parseInt(e.pageX, 10),
                            dir    : 1,
                            focus  : $this.focus,
                            base   : $this.options.center ? 'center':'area'
                        };

                        if (e.originalEvent && e.originalEvent.touches) {
                            e = e.originalEvent.touches[0];
                        }

                        dragging.element.data({
                            'pointer-start': {x: parseInt(e.pageX, 10), y: parseInt(e.pageY, 10)},
                            'pointer-pos-start': $this.pos
                        });

                        $this.container.addClass('ng-drag');

                        delayIdle = false;
                    };

                    delayIdle.x         = parseInt(evt.pageX, 10);
                    delayIdle.threshold = $this.options.threshold;

                },

                mouseenter: function() { if ($this.options.pauseOnHover) $this.hovering = true;  },
                mouseleave: function() { $this.hovering = false; }
            });

            this.resize(true);

            this.on('display.ng.check', function(){
                if ($this.element.is(":visible")) {
                    $this.resize(true);
                }
            });

            // prevent dragging links + images
            this.element.find('a,img').attr('draggable', 'false');

            // Set autoplay
            if (this.options.autoplay) {
                this.start();
            }

        },

        resize: function(focus) {

            var $this = this, pos = 0, maxheight = 0, item, width, cwidth, size;

            this.items = this.container.children().filter(':visible');
            this.vp    = this.element[0].getBoundingClientRect().width;

            this.container.css({'min-width': '', 'min-height': ''});

            this.items.each(function(idx){

                item      = NG.$(this);
                size      = item.css({'left': '', 'width':''})[0].getBoundingClientRect();
                width     = size.width;
                cwidth    = item.width();
                maxheight = Math.max(maxheight, size.height);

                item.css({'left': pos, 'width':width}).data({'idx':idx, 'left': pos, 'width': width, 'cwidth':cwidth, 'area': (pos+width), 'center':(pos - ($this.vp/2 - cwidth/2))});

                pos += width;
            });

            this.container.css({'min-width': pos, 'min-height': maxheight});

            if (this.options.infinite && (pos <= (2*this.vp) || this.items.length < 5) && !this.itemsResized) {

                // fill with cloned items
                this.container.children().each(function(idx){
                   $this.container.append($this.items.eq(idx).clone(true).attr('id', ''));
                }).each(function(idx){
                   $this.container.append($this.items.eq(idx).clone(true).attr('id', ''));
                });

                this.itemsResized = true;

                return this.resize();
            }

            this.cw     = pos;
            this.pos    = 0;
            this.active = pos >= this.vp;

            this.container.css({
                '-ms-transform': '',
                '-webkit-transform': '',
                'transform': ''
            });

            if (focus) this.updateFocus(this.focus);
        },

        updatePos: function(pos) {
            this.pos = pos;
            this.container.css({
                '-ms-transform': 'translateX('+pos+'px)',
                '-webkit-transform': 'translateX('+pos+'px)',
                'transform': 'translateX('+pos+'px)'
            });
        },

        updateFocus: function(idx, dir) {

            if (!this.active) {
                return;
            }

            dir = dir || (idx > this.focus ? 1:-1);

            var item = this.items.eq(idx), area, i;

            if (this.options.infinite) {
                this.infinite(idx, dir);
            }

            if (this.options.center) {

                this.updatePos(item.data('center')*-1);

                this.items.filter('.'+this.options.activecls).removeClass(this.options.activecls);
                item.addClass(this.options.activecls);

            } else {

                if (this.options.infinite) {

                    this.updatePos(item.data('left')*-1);

                } else {

                    area = 0;

                    for (i=idx;i<this.items.length;i++) {
                        area += this.items.eq(i).data('width');
                    }


                    if (area > this.vp) {

                        this.updatePos(item.data('left')*-1);

                    } else {

                        if (dir == 1) {

                            area = 0;

                            for (i=this.items.length-1;i>=0;i--) {

                                area += this.items.eq(i).data('width');

                                if (area == this.vp) {
                                    idx = i;
                                    break;
                                }

                                if (area > this.vp) {
                                    idx = (i < this.items.length-1) ? i+1 : i;
                                    break;
                                }
                            }

                            if (area > this.vp) {
                                this.updatePos((this.container.width() - this.vp) * -1);
                            } else {
                                this.updatePos(this.items.eq(idx).data('left')*-1);
                            }
                        }
                    }
                }
            }

            // mark elements
            var left = this.items.eq(idx).data('left');

            this.items.removeClass('ng-slide-before ng-slide-after').each(function(i){
                if (i!==idx) {
                    NG.$(this).addClass(NG.$(this).data('left') < left ? 'ng-slide-before':'ng-slide-after');
                }
            });

            this.focus = idx;

            this.trigger('focusitem.ng.slider', [idx,this.items.eq(idx),this]);
        },

        next: function() {

            var focus = this.items[this.focus + 1] ? (this.focus + 1) : (this.options.infinite ? 0:this.focus);

            this.updateFocus(focus, 1);
        },

        previous: function() {

            var focus = this.items[this.focus - 1] ? (this.focus - 1) : (this.options.infinite ? (this.items[this.focus - 1] ? this.items-1:this.items.length-1):this.focus);

            this.updateFocus(focus, -1);
        },

        start: function() {

            this.stop();

            var $this = this;

            this.interval = setInterval(function() {
                if (!$this.hovering) $this.next();
            }, this.options.autoplayInterval);

        },

        stop: function() {
            if (this.interval) clearInterval(this.interval);
        },

        infinite: function(baseidx, direction) {

            var $this = this, item = this.items.eq(baseidx), i, z = baseidx, move = [], area = 0;

            if (direction == 1) {


                for (i=0;i<this.items.length;i++) {

                    if (z != baseidx) {
                        area += this.items.eq(z).data('width');
                        move.push(this.items.eq(z));
                    }

                    if (area > this.vp) {
                        break;
                    }

                    z = z+1 == this.items.length ? 0:z+1;
                }

                if (move.length) {

                    move.forEach(function(itm){

                        var left = item.data('area');

                        itm.css({'left': left}).data({
                            'left'  : left,
                            'area'  : (left+itm.data('width')),
                            'center': (left - ($this.vp/2 - itm.data('cwidth')/2))
                        });

                        item = itm;
                    });
                }


            } else {

                for (i=this.items.length-1;i >-1 ;i--) {

                    area += this.items.eq(z).data('width');

                    if (z != baseidx) {
                        move.push(this.items.eq(z));
                    }

                    if (area > this.vp) {
                        break;
                    }

                    z = z-1 == -1 ? this.items.length-1:z-1;
                }

                if (move.length) {

                    move.forEach(function(itm){

                        var left = item.data('left') - itm.data('width');

                        itm.css({'left': left}).data({
                            'left'  : left,
                            'area'  : (left+itm.data('width')),
                            'center': (left - ($this.vp/2 - itm.data('cwidth')/2))
                        });

                        item = itm;
                    });
                }
            }
        }
    });

    // handle dragging
    NG.$doc.on('mousemove.ng.slider touchmove.ng.slider', function(e) {

        if (e.originalEvent && e.originalEvent.touches) {
            e = e.originalEvent.touches[0];
        }

        if (delayIdle && Math.abs(e.pageX - delayIdle.x) > delayIdle.threshold) {

            if (!window.getSelection().toString()) {
                delayIdle(e);
            } else {
                dragging = delayIdle = false;
            }
        }

        if (!dragging) {
            return;
        }

        var x, xDiff, pos, dir, focus, item, next, diff, i, z, itm;

        if (e.clientX || e.clientY) {
            x = e.clientX;
        } else if (e.pageX || e.pageY) {
            x = e.pageX - document.body.scrollLeft - document.documentElement.scrollLeft;
        }

        focus = store.focus;
        xDiff = x - dragging.element.data('pointer-start').x;
        pos   = dragging.element.data('pointer-pos-start') + xDiff;
        dir   = x > dragging.element.data('pointer-start').x ? -1:1;
        item  = dragging.items.eq(store.focus);

        if (dir == 1) {

            diff = item.data('left') + Math.abs(xDiff);

            for (i=0,z=store.focus;i<dragging.items.length;i++) {

                itm = dragging.items.eq(z);

                if (z != store.focus && itm.data('left') < diff && itm.data('area') > diff) {
                    focus = z;
                    break;
                }

                z = z+1 == dragging.items.length ? 0:z+1;
            }

        } else {

            diff = item.data('left') - Math.abs(xDiff);

            for (i=0,z=store.focus;i<dragging.items.length;i++) {

                itm = dragging.items.eq(z);

                if (z != store.focus && itm.data('area') <= item.data('left') && itm.data('center') < diff) {
                    focus = z;
                    break;
                }

                z = z-1 == -1 ? dragging.items.length-1:z-1;
            }
        }

        if (dragging.options.infinite && focus!=store._focus) {
            dragging.infinite(focus, dir);
        }

        dragging.updatePos(pos);

        store.dir     = dir;
        store._focus  = focus;
        store.touchx  = parseInt(e.pageX, 10);
        store.diff    = diff;
    });

    NG.$doc.on('mouseup.ng.slider touchend.ng.slider', function(e) {

        if (dragging) {

            dragging.container.removeClass('ng-drag');

            // TODO is this needed?
            dragging.items.eq(store.focus);

            var itm, focus = false, i, z;

            if (store.dir == 1) {

                for (i=0,z=store.focus;i<dragging.items.length;i++) {

                    itm = dragging.items.eq(z);

                    if (z != store.focus && itm.data('left') > store.diff) {
                        focus = z;
                        break;
                    }

                    z = z+1 == dragging.items.length ? 0:z+1;
                }

            } else {

                for (i=0,z=store.focus;i<dragging.items.length;i++) {

                    itm = dragging.items.eq(z);

                    if (z != store.focus && itm.data('left') < store.diff) {
                        focus = z;
                        break;
                    }

                    z = z-1 == -1 ? dragging.items.length-1:z-1;
                }
            }

            dragging.updateFocus(focus!==false ? focus:store._focus);

        }

        dragging = delayIdle = false;
    });

    return NG.slider;
});


(function(addon) {

    var component;

    if (window.NGkit) {
        component = addon(NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-slideset", ["ngkit"], function(){
            return component || addon(NGkit);
        });
    }

})(function(NG){

    "use strict";

    var Animations;

    NG.component('slideset', {

        defaults: {
            default          : 1,
            animation        : 'fade',
            duration         : 200,
            filter           : '',
            delay            : false,
            controls         : false,
            autoplay         : false,
            autoplayInterval : 7000,
            pauseOnHover     : true
        },

        sets: [],

        boot: function() {

            // auto init
            NG.ready(function(context) {

                NG.$("[data-ng-slideset]", context).each(function(){

                    var ele = NG.$(this);

                    if(!ele.data("slideset")) {
                        NG.slideset(ele, NG.Utils.options(ele.attr("data-ng-slideset")));
                    }
                });
            });
        },

        init: function() {

            var $this = this;

            this.activeSet = false;
            this.list      = this.element.find('.ng-slideset');
            this.nav       = this.element.find('.ng-slideset-nav');
            this.controls  = this.options.controls ? NG.$(this.options.controls) : this.element;

            NG.$win.on("resize load", NG.Utils.debounce(function() {
                $this.updateSets();
            }, 100));

            $this.list.addClass('ng-grid-width-1-'+$this.options.default);

            ['xlarge', 'large', 'medium', 'small'].forEach(function(bp) {

                if (!$this.options[bp]) {
                    return;
                }

                $this.list.addClass('ng-grid-width-'+bp+'-1-'+$this.options[bp]);
            });

            this.on("click.ng.slideset", '[data-ng-slideset-item]', function(e) {

                e.preventDefault();

                if ($this.animating) {
                    return;
                }

                var set = NG.$(this).attr('data-ng-slideset-item');

                if ($this.activeSet === set) return;

                switch(set) {
                    case 'next':
                    case 'previous':
                        $this[set=='next' ? 'next':'previous']();
                        break;
                    default:
                        $this.show(parseInt(set, 10));
                }

            });

            this.controls.on('click.ng.slideset', '[data-ng-filter]', function(e) {

                var ele = NG.$(this);

                if (ele.parent().hasClass('ng-slideset')) {
                    return;
                }

                e.preventDefault();

                if ($this.animating || $this.currentFilter == ele.attr('data-ng-filter')) {
                    return;
                }

                $this.updateFilter(ele.attr('data-ng-filter'));

                $this._hide().then(function(){

                    $this.updateSets(true, true);
                });
            });

            this.on('swipeRight swipeLeft', function(e) {
                $this[e.type=='swipeLeft' ? 'next' : 'previous']();
            });

            this.updateFilter(this.options.filter);
            this.updateSets();

            this.element.on({
                mouseenter: function() { if ($this.options.pauseOnHover) $this.hovering = true;  },
                mouseleave: function() { $this.hovering = false; }
            });

            // Set autoplay
            if (this.options.autoplay) {
                this.start();
            }
        },

        updateSets: function(animate, force) {

            var visible = this.visible, i;

            this.visible  = this.getVisibleOnCurrenBreakpoint();

            if (visible == this.visible && !force) {
                return;
            }

            this.children = this.list.children().hide();
            this.items    = this.getItems();
            this.sets     = array_chunk(this.items, this.visible);

            for (i=0;i<this.sets.length;i++) {
                this.sets[i].css({'display': 'none'});
            }

            // update nav
            if (this.nav.length && this.nav.empty()) {

                for (i=0;i<this.sets.length;i++) {
                    this.nav.append('<li data-ng-slideset-item="'+i+'"><a></a></li>');
                }

                this.nav[this.nav.children().length==1 ? 'addClass':'removeClass']('ng-invisible');
            }

            this.activeSet = false;
            this.show(0, !animate);
        },

        updateFilter: function(currentfilter) {

            var $this = this, filter;

            this.currentFilter = currentfilter;

            this.controls.find('[data-ng-filter]').each(function(){

                filter = NG.$(this);

                if (!filter.parent().hasClass('ng-slideset')) {

                    if (filter.attr('data-ng-filter') == $this.currentFilter) {
                        filter.addClass('ng-active');
                    } else {
                        filter.removeClass('ng-active');
                    }
                }
            });
        },

        getVisibleOnCurrenBreakpoint: function() {

            var breakpoint  = null,
                tmp         = NG.$('<div style="position:absolute;height:1px;top:-1000px;width:100px"><div></div></div>').appendTo('body'),
                testdiv     = tmp.children().eq(0),
                breakpoints = this.options;

                ['xlarge', 'large', 'medium', 'small'].forEach(function(bp) {

                    if (!breakpoints[bp] || breakpoint) {
                        return;
                    }

                    tmp.attr('class', 'ng-grid-width-'+bp+'-1-2').width();

                    if (testdiv.width() == 50) {
                        breakpoint = bp;
                    }
                });

                tmp.remove();

                return this.options[breakpoint] || this.options['default'];
        },

        getItems: function() {

            var items = [], filter;

            if (this.currentFilter) {

                filter = this.currentFilter || [];

                if (typeof(filter) === 'string') {
                    filter = filter.split(/,/).map(function(item){ return item.trim(); });
                }

                this.children.each(function(index){

                    var ele = NG.$(this), f = ele.attr('data-ng-filter'), infilter = filter.length ? false : true;

                    if (f) {

                        f = f.split(/,/).map(function(item){ return item.trim(); });

                        filter.forEach(function(item){
                            if (f.indexOf(item) > -1) infilter = true;
                        });
                    }

                    if(infilter) items.push(ele[0]);
                });

                items = NG.$(items);

            } else {
                items = this.list.children();
            }

            return items;
        },

        show: function(setIndex, noanimate, dir) {

            var $this = this;

            if (this.activeSet === setIndex || this.animating) {
                return;
            }

            dir = dir || (setIndex < this.activeSet ? -1:1);

            var current   = this.sets[this.activeSet] || [],
                next      = this.sets[setIndex],
                animation = this._getAnimation();

            if (noanimate || !NG.support.animation) {
                animation = Animations.none;
            }

            this.animating = true;

            if (this.nav.length) {
                this.nav.children().removeClass('ng-active').eq(setIndex).addClass('ng-active');
            }

            animation.apply($this, [current, next, dir]).then(function(){

                NG.Utils.checkDisplay(next, true);

                $this.children.hide().removeClass('ng-active');
                next.addClass('ng-active').css({'display': '', 'opacity':''});

                $this.animating = false;
                $this.activeSet = setIndex;

                NG.Utils.checkDisplay(next, true);

                $this.trigger('show.ng.slideset', [next]);
            });

        },

        _getAnimation: function() {

            var animation = Animations[this.options.animation] || Animations.none;

            if (!NG.support.animation) {
                animation = Animations.none;
            }

            return animation;
        },

        _hide: function() {

            var $this     = this,
                current   = this.sets[this.activeSet] || [],
                animation = this._getAnimation();

            this.animating = true;

            return animation.apply($this, [current, [], 1]).then(function(){
                $this.animating = false;
            });
        },

        next: function() {
            this.show(this.sets[this.activeSet + 1] ? (this.activeSet + 1) : 0, false, 1);
        },

        previous: function() {
            this.show(this.sets[this.activeSet - 1] ? (this.activeSet - 1) : (this.sets.length - 1), false, -1);
        },

        start: function() {

            this.stop();

            var $this = this;

            this.interval = setInterval(function() {
                if (!$this.hovering && !$this.animating) $this.next();
            }, this.options.autoplayInterval);

        },

        stop: function() {
            if (this.interval) clearInterval(this.interval);
        }
    });

    Animations = {

        'none': function() {
            var d = NG.$.Deferred();
            d.resolve();
            return d.promise();
        },

        'fade': function(current, next) {
            return coreAnimation.apply(this, ['ng-animation-fade', current, next]);
        },

        'slide-bottom': function(current, next) {
            return coreAnimation.apply(this, ['ng-animation-slide-bottom', current, next]);
        },

        'slide-top': function(current, next) {
            return coreAnimation.apply(this, ['ng-animation-slide-top', current, next]);
        },

        'slide-vertical': function(current, next, dir) {

            var anim = ['ng-animation-slide-top', 'ng-animation-slide-bottom'];

            if (dir == -1) {
                anim.reverse();
            }

            return coreAnimation.apply(this, [anim, current, next]);
        },

        'slide-horizontal': function(current, next, dir) {

            var anim = ['ng-animation-slide-right', 'ng-animation-slide-left'];

            if (dir == -1) {
                anim.reverse();
            }

            return coreAnimation.apply(this, [anim, current, next, dir]);
        },

        'scale': function(current, next) {
            return coreAnimation.apply(this, ['ng-animation-scale-up', current, next]);
        }
    };

    NG.slideset.animations = Animations;

    // helpers

    function coreAnimation(cls, current, next, dir) {

        var d     = NG.$.Deferred(),
            delay = (this.options.delay === false) ? Math.floor(this.options.duration/2) : this.options.delay,
            $this = this, clsIn, clsOut, release, i;

        dir = dir || 1;

        this.element.css('min-height', this.element.height());

        if (next[0]===current[0]) {
            d.resolve();
            return d.promise();
        }

        if (typeof(cls) == 'object') {
            clsIn  = cls[0];
            clsOut = cls[1] || cls[0];
        } else {
            clsIn  = cls;
            clsOut = clsIn;
        }

        release = function() {

            if (current && current.length) {
                current.hide().removeClass(clsOut+' ng-animation-reverse').css({'opacity':'', 'animation-delay': '', 'animation':''});
            }

            if (!next.length) {
                d.resolve();
                return;
            }

            for (i=0;i<next.length;i++) {
                next.eq(dir == 1 ? i:(next.length - i)-1).css('animation-delay', (i*delay)+'ms');
            }

            var finish = function() {
                next.removeClass(''+clsIn+'').css({opacity:'', display:'', 'animation-delay':'', 'animation':''});
                d.resolve();
                $this.element.css('min-height', '');
                finish = false;
            };

            next.addClass(clsIn)[dir==1 ? 'last':'first']().one(NG.support.animation.end, function(){
                if(finish) finish();
            }).end().css('display', '');

            // make sure everything resolves really
            setTimeout(function() {
                if(finish) finish();
            },  next.length * delay * 2);
        };

        if (next.length) {
            next.css('animation-duration', this.options.duration+'ms');
        }

        if (current && current.length) {

            current.css('animation-duration', this.options.duration+'ms')[dir==1 ? 'last':'first']().one(NG.support.animation.end, function() {
                release();
            });

            for (i=0;i<current.length;i++) {

                (function (index, ele){

                    setTimeout(function(){

                        ele.css('display', 'none').css('display', '').css('opacity', 0).on(NG.support.animation.end, function(){
                            ele.removeClass(clsOut);
                        }).addClass(clsOut+' ng-animation-reverse');

                    }.bind(this), i * delay);

                })(i, current.eq(dir == 1 ? i:(current.length - i)-1));
            }

        } else {
            release();
        }

        return d.promise();
    }

    function array_chunk(input, size) {

        var x, i = 0, c = -1, l = input.length || 0, n = [];

        if (size < 1) return null;

        while (i < l) {

            x = i % size;

            if(x) {
                n[c][x] = input[i];
            } else {
                n[++c] = [input[i]];
            }

            i++;
        }

        i = 0;
        l = n.length;

        while (i < l) {
            n[i] = jQuery(n[i]);
            i++;
        }

        return n;
    }

});


(function(addon) {

    var component;

    if (window.NGkit) {
        component = addon(NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-slideshow", ["ngkit"], function() {
            return component || addon(NGkit);
        });
    }

})(function(NG) {

    "use strict";

    var Animations, playerId = 0;

    NG.component('slideshow', {

        defaults: {
            animation          : "fade",
            duration           : 500,
            height             : "auto",
            start              : 0,
            autoplay           : false,
            autoplayInterval   : 7000,
            videoautoplay      : true,
            videomute          : true,
            slices             : 15,
            pauseOnHover       : true,
            kenburns           : false,
            kenburnsanimations : [
                'ng-animation-middle-left',
                'ng-animation-top-right',
                'ng-animation-bottom-left',
                'ng-animation-top-center',
                '', // middle-center
                'ng-animation-bottom-right'
            ]
        },

        current  : false,
        interval : null,
        hovering : false,

        boot: function() {

            // init code
            NG.ready(function(context) {

                NG.$('[data-ng-slideshow]', context).each(function() {

                    var slideshow = NG.$(this);

                    if (!slideshow.data("slideshow")) {
                        NG.slideshow(slideshow, NG.Utils.options(slideshow.attr("data-ng-slideshow")));
                    }
                });
            });
        },

        init: function() {

            var $this = this, canvas, kbanimduration;

            this.container     = this.element.hasClass('ng-slideshow') ? this.element : NG.$(this.find('.ng-slideshow'));
            this.slides        = this.container.children();
            this.slidesCount   = this.slides.length;
            this.current       = this.options.start;
            this.animating     = false;
            this.triggers      = this.find('[data-ng-slideshow-item]');
            this.visibility    = this.find('.ng-dotnav');
            this.fixFullscreen = navigator.userAgent.match(/(iPad|iPhone|iPod)/g) && this.container.hasClass('ng-slideshow-fullscreen'); // viewport unit fix for height:100vh - should be fixed in iOS 8

            if (this.options.kenburns) {

                kbanimduration = this.options.kenburns === true ? '15s': this.options.kenburns;

                if (!String(kbanimduration).match(/(ms|s)$/)) {
                    kbanimduration += 'ms';
                }

                if (typeof(this.options.kenburnsanimations) == 'string') {
                    this.options.kenburnsanimations = this.options.kenburnsanimations.split(',');
                }
            }

            this.slides.each(function(index) {

                var slide = NG.$(this),
                    media = slide.children('img,video,iframe').eq(0);

                slide.data('media', media);
                slide.data('sizer', media);

                if (media.length) {

                    var placeholder;

                    switch(media[0].nodeName) {
                        case 'IMG':

                            var cover = NG.$('<div class="ng-cover-background ng-position-cover"></div>').css({'background-image':'url('+ media.attr('src') + ')'});

                            if (media.attr('width') && media.attr('height')) {
                                placeholder = NG.$('<canvas></canvas>').attr({width:media.attr('width'), height:media.attr('height')});
                                media.replaceWith(placeholder);
                                media = placeholder;
                                placeholder = undefined;
                            }

                            media.css({width: '100%',height: 'auto', opacity:0});
                            slide.prepend(cover).data('cover', cover);
                            break;

                        case 'IFRAME':

                            var src = media[0].src, iframeId = 'sw-'+(++playerId);

                            media
                                .attr('src', '').on('load', function(){

                                    if (index !== $this.current || (index == $this.current && !$this.options.videoautoplay)) {
                                        $this.pausemedia(media);
                                    }

                                    if ($this.options.videomute) {

                                        $this.mutemedia(media);

                                        var inv = setInterval((function(ic) {
                                            return function() {
                                                $this.mutemedia(media);
                                                if (++ic >= 4) clearInterval(inv);
                                            };
                                        })(0), 250);
                                    }

                                })
                                .data('slideshow', $this)  // add self-reference for the vimeo-ready listener
                                .attr('data-player-id', iframeId)  // add frameId for the vimeo-ready listener
                                .attr('src', [src, (src.indexOf('?') > -1 ? '&':'?'), 'enablejsapi=1&api=1&player_id='+iframeId].join(''))
                                .addClass('ng-position-absolute');

                            // disable pointer events
                            if(!NG.support.touch) media.css('pointer-events', 'none');

                            placeholder = true;

                            if (NG.cover) {
                                NG.cover(media);
                                media.attr('data-ng-cover', '{}');
                            }

                            break;

                        case 'VIDEO':
                            media.addClass('ng-cover-object ng-position-absolute');
                            placeholder = true;

                            if ($this.options.videomute) $this.mutemedia(media);
                    }

                    if (placeholder) {

                        canvas  = NG.$('<canvas></canvas>').attr({'width': media[0].width, 'height': media[0].height});
                        var img = NG.$('<img style="width:100%;height:auto;">').attr('src', canvas[0].toDataURL());

                        slide.prepend(img);
                        slide.data('sizer', img);
                    }

                } else {
                    slide.data('sizer', slide);
                }

                if ($this.hasKenBurns(slide)) {

                    slide.data('cover').css({
                        '-webkit-animation-duration': kbanimduration,
                        'animation-duration': kbanimduration
                    });
                }
            });

            this.on("click.ngkit.slideshow", '[data-ng-slideshow-item]', function(e) {

                e.preventDefault();

                var slide = NG.$(this).attr('data-ng-slideshow-item');

                if ($this.current == slide) return;

                switch(slide) {
                    case 'next':
                    case 'previous':
                        $this[slide=='next' ? 'next':'previous']();
                        break;
                    default:
                        $this.show(parseInt(slide, 10));
                }

                $this.stop();
            });

            // Set start slide
            this.slides.attr('aria-hidden', 'true').eq(this.current).addClass('ng-active').attr('aria-hidden', 'false');
            this.triggers.filter('[data-ng-slideshow-item="'+this.current+'"]').addClass('ng-active');
            // changes visibility on `dotnav` for delayed
            this.visibility.delay(300).queue(function() {
                $(this).css('visibility', 'visible');
            });
            NG.$win.on("resize load", NG.Utils.debounce(function() {
                $this.resize();

                if ($this.fixFullscreen) {
                    $this.container.css('height', window.innerHeight);
                    $this.slides.css('height', window.innerHeight);
                }
            }, 100));

            // chrome image load fix
            setTimeout(function(){
                $this.resize();
            }, 80);

            // Set autoplay
            if (this.options.autoplay) {
                this.start();
            }

            if (this.options.videoautoplay && this.slides.eq(this.current).data('media')) {
                this.playmedia(this.slides.eq(this.current).data('media'));
            }

            if (this.options.kenburns) {
                this.applyKenBurns(this.slides.eq(this.current));
            }

            this.container.on({
                mouseenter: function() { if ($this.options.pauseOnHover) $this.hovering = true;  },
                mouseleave: function() { $this.hovering = false; }
            });

            this.on('swipeRight swipeLeft', function(e) {
                $this[e.type=='swipeLeft' ? 'next' : 'previous']();
            });

            this.on('display.ng.check', function(){
                if ($this.element.is(":visible")) {

                    $this.resize();

                    if ($this.fixFullscreen) {
                        $this.container.css('height', window.innerHeight);
                        $this.slides.css('height', window.innerHeight);
                    }
                }
            });
        },


        resize: function() {

            if (this.container.hasClass('ng-slideshow-fullscreen')) return;

            var height = this.options.height;

            if (this.options.height === 'auto') {

                height = 0;

                this.slides.css('height', '').each(function() {
                    height = Math.max(height, NG.$(this).height());
                });
            }

            this.container.css('height', height);
            this.slides.css('height', height);
        },

        show: function(index, direction) {

            if (this.animating || this.current == index) return;

            this.animating = true;

            var $this        = this,
                current      = this.slides.eq(this.current),
                next         = this.slides.eq(index),
                dir          = direction ? direction : this.current < index ? -1 : 1,
                currentmedia = current.data('media'),
                animation    = Animations[this.options.animation] ? this.options.animation : 'fade',
                nextmedia    = next.data('media'),
                finalize     = function() {

                    if (!$this.animating) return;

                    if (currentmedia && currentmedia.is('video,iframe')) {
                        $this.pausemedia(currentmedia);
                    }

                    if (nextmedia && nextmedia.is('video,iframe')) {
                        $this.playmedia(nextmedia);
                    }

                    next.addClass("ng-active").attr('aria-hidden', 'false');
                    current.removeClass("ng-active").attr('aria-hidden', 'true');

                    $this.animating = false;
                    $this.current   = index;

                    NG.Utils.checkDisplay(next, '[class*="ng-animation-"]:not(.ng-cover-background.ng-position-cover)');

                    $this.trigger('show.ng.slideshow', [next, current, $this]);

                    // Update slideshowcounter's current slide num if there.
                    $this.element.find(".ng-slideshowcounter").html((index+1) + " / <span>" + $this.slidesCount + "</span>");
                    
                };

            $this.applyKenBurns(next);

            // animation fallback
            if (!NG.support.animation) {
                animation = 'none';
            }

            current = NG.$(current);
            next    = NG.$(next);

            $this.trigger('beforeshow.ng.slideshow', [next, current, $this]);

            Animations[animation].apply(this, [current, next, dir]).then(finalize);

            $this.triggers.removeClass('ng-active');
            $this.triggers.filter('[data-ng-slideshow-item="'+index+'"]').addClass('ng-active');
        },

        applyKenBurns: function(slide) {

            if (!this.hasKenBurns(slide)) {
                return;
            }

            var animations = this.options.kenburnsanimations,
                index      = this.kbindex || 0;


            slide.data('cover').attr('class', 'ng-cover-background ng-position-cover').width();
            slide.data('cover').addClass(['ng-animation-scale', 'ng-animation-reverse', animations[index].trim()].join(' '));

            this.kbindex = animations[index + 1] ? (index+1):0;
        },

        hasKenBurns: function(slide) {
            return (this.options.kenburns && slide.data('cover'));
        },

        next: function() {
            this.show(this.slides[this.current + 1] ? (this.current + 1) : 0, 1);
        },

        previous: function() {
            this.show(this.slides[this.current - 1] ? (this.current - 1) : (this.slides.length - 1), -1);
        },

        start: function() {

            this.stop();

            var $this = this;

            this.interval = setInterval(function() {
                if (!$this.hovering) $this.next();
            }, this.options.autoplayInterval);

        },

        stop: function() {
            if (this.interval) clearInterval(this.interval);
        },

        playmedia: function(media) {

            if (!(media && media[0])) return;

            switch(media[0].nodeName) {
                case 'VIDEO':

                    if (!this.options.videomute) {
                        media[0].muted = false;
                    }

                    media[0].play();
                    break;
                case 'IFRAME':

                    if (!this.options.videomute) {
                        media[0].contentWindow.postMessage('{ "event": "command", "func": "unmute", "method":"setVolume", "value":1}', '*');
                    }

                    media[0].contentWindow.postMessage('{ "event": "command", "func": "playVideo", "method":"play"}', '*');
                    break;
            }
        },

        pausemedia: function(media) {

            switch(media[0].nodeName) {
                case 'VIDEO':
                    media[0].pause();
                    break;
                case 'IFRAME':
                    media[0].contentWindow.postMessage('{ "event": "command", "func": "pauseVideo", "method":"pause"}', '*');
                    break;
            }
        },

        mutemedia: function(media) {

            switch(media[0].nodeName) {
                case 'VIDEO':
                    media[0].muted = true;
                    break;
                case 'IFRAME':
                    media[0].contentWindow.postMessage('{ "event": "command", "func": "mute", "method":"setVolume", "value":0}', '*');
                    break;
            }
        }
    });

    Animations = {

        'none': function() {

            var d = NG.$.Deferred();
            d.resolve();
            return d.promise();
        },

        'scroll': function(current, next, dir) {

            var d = NG.$.Deferred();

            current.css('animation-duration', this.options.duration+'ms');
            next.css('animation-duration', this.options.duration+'ms');

            next.css('opacity', 1).one(NG.support.animation.end, function() {

                current.removeClass(dir === 1 ? 'ng-slideshow-scroll-backward-out' : 'ng-slideshow-scroll-forward-out');
                next.css('opacity', '').removeClass(dir === 1 ? 'ng-slideshow-scroll-backward-in' : 'ng-slideshow-scroll-forward-in');
                d.resolve();

            }.bind(this));

            current.addClass(dir == 1 ? 'ng-slideshow-scroll-backward-out' : 'ng-slideshow-scroll-forward-out');
            next.addClass(dir == 1 ? 'ng-slideshow-scroll-backward-in' : 'ng-slideshow-scroll-forward-in');
            next.width(); // force redraw

            return d.promise();
        },

        'swipe': function(current, next, dir) {

            var d = NG.$.Deferred();

            current.css('animation-duration', this.options.duration+'ms');
            next.css('animation-duration', this.options.duration+'ms');

            next.css('opacity', 1).one(NG.support.animation.end, function() {

                current.removeClass(dir === 1 ? 'ng-slideshow-swipe-backward-out' : 'ng-slideshow-swipe-forward-out');
                next.css('opacity', '').removeClass(dir === 1 ? 'ng-slideshow-swipe-backward-in' : 'ng-slideshow-swipe-forward-in');
                d.resolve();

            }.bind(this));

            current.addClass(dir == 1 ? 'ng-slideshow-swipe-backward-out' : 'ng-slideshow-swipe-forward-out');
            next.addClass(dir == 1 ? 'ng-slideshow-swipe-backward-in' : 'ng-slideshow-swipe-forward-in');
            next.width(); // force redraw

            return d.promise();
        },

        'scale': function(current, next, dir) {

            var d = NG.$.Deferred();

            current.css('animation-duration', this.options.duration+'ms');
            next.css('animation-duration', this.options.duration+'ms');

            next.css('opacity', 1);

            current.one(NG.support.animation.end, function() {

                current.removeClass('ng-slideshow-scale-out');
                next.css('opacity', '');
                d.resolve();

            }.bind(this));

            current.addClass('ng-slideshow-scale-out');
            current.width(); // force redraw

            return d.promise();
        },

        'fade': function(current, next, dir) {

            var d = NG.$.Deferred();

            current.css('animation-duration', this.options.duration+'ms');
            next.css('animation-duration', this.options.duration+'ms');

            next.css('opacity', 1);

            // for plain text content slides - looks smoother
            if (!(next.data('cover') || next.data('placeholder'))) {

                next.css('opacity', 1).one(NG.support.animation.end, function() {
                    next.removeClass('ng-slideshow-fade-in');
                }).addClass('ng-slideshow-fade-in');
            }

            current.one(NG.support.animation.end, function() {

                current.removeClass('ng-slideshow-fade-out');
                next.css('opacity', '');
                d.resolve();

            }.bind(this));

            current.addClass('ng-slideshow-fade-out');
            current.width(); // force redraw

            return d.promise();
        }
    };

    NG.slideshow.animations = Animations;

    // Listen for messages from the vimeo player
    window.addEventListener('message', function onMessageReceived(e) {

        var data = e.data, iframe;

        if (typeof(data) == 'string') {

            try {
                data = JSON.parse(data);
            } catch(err) {
                data = {};
            }
        }

        if (e.origin && e.origin.indexOf('vimeo') > -1 && data.event == 'ready' && data.player_id) {
            iframe = NG.$('[data-player-id="'+ data.player_id+'"]');

            if (iframe.length) {
                iframe.data('slideshow').mutemedia(iframe);
            }
        }
    }, false);

});


(function(addon) {

    var component;

    if (window.NGkit) {
        component = addon(NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-slideshow-fx", ["ngkit"], function() {
            return component || addon(NGkit);
        });
    }

})(function(NG) {

    "use strict";

    var Animations = NG.slideshow.animations;

    NG.$.extend(NG.slideshow.animations, {
        'slice': function(current, next, dir, fromfx) {

            if (!current.data('cover')) {
                return Animations.fade.apply(this, arguments);
            }

            var d = NG.$.Deferred();

            var sliceWidth = Math.ceil(this.element.width() / this.options.slices),
                bgimage    = next.data('cover').css('background-image'),
                ghost      = NG.$('<li></li>').css({
                    top    : 0,
                    left   : 0,
                    width  : this.container.width(),
                    height : this.container.height(),
                    opacity: 1,
                    zIndex : 15
                }),
                ghostWidth  = ghost.width(),
                ghostHeight = ghost.height(),
                pos         = fromfx == 'slice-up' ? ghostHeight:'0',
                bar;

            for (var i = 0; i < this.options.slices; i++) {

                if (fromfx == 'slice-up-down') {
                    pos = ((i % 2) + 2) % 2==0 ? '0':ghostHeight;
                }

                var width    = (i == this.options.slices-1) ? sliceWidth : sliceWidth,
                    clipto   = ('rect(0px, '+(width*(i+1))+'px, '+ghostHeight+'px, '+(sliceWidth*i)+'px)'),
                    clipfrom;

                //slice-down - default
                clipfrom = ('rect(0px, '+(width*(i+1))+'px, 0px, '+(sliceWidth*i)+'px)');

                if (fromfx == 'slice-up' || (fromfx == 'slice-up-down' && ((i % 2) + 2) % 2==0 )) {
                    clipfrom = ('rect('+ghostHeight+'px, '+(width*(i+1))+'px, '+ghostHeight+'px, '+(sliceWidth*i)+'px)');
                }

                bar = NG.$('<div class="ng-cover-background"></div>').css({
                    'position'           : 'absolute',
                    'top'                : 0,
                    'left'               : 0,
                    'width'              : ghostWidth,
                    'height'             : ghostHeight,
                    'background-image'   : bgimage,
                    'clip'               : clipfrom,
                    'opacity'            : 0,
                    'transition'         : 'all '+this.options.duration+'ms ease-in-out '+(i*60)+'ms',
                    '-webkit-transition' : 'all '+this.options.duration+'ms ease-in-out '+(i*60)+'ms'

                }).data('clip', clipto);

                ghost.append(bar);
            }

            this.container.append(ghost);

            ghost.children().last().on(NG.support.transition.end, function() {
                ghost.remove();
                d.resolve();
            });

            ghost.width();

            ghost.children().each(function() {
                var bar = NG.$(this);

                bar.css({
                    'clip': bar.data('clip'),
                    'opacity': 1
                });
            });

            return d.promise();
        },

        'slice-up': function(current, next, dir) {
            return Animations.slice.apply(this, [current, next, dir, 'slice-up']);
        },

        'slice-down': function(current, next, dir) {
            return Animations.slice.apply(this, [current, next, dir, 'slice-down']);
        },

        'slice-up-down': function(current, next, dir) {
            return Animations.slice.apply(this, [current, next, dir, 'slice-up-down']);
        },

        'fold': function(current, next, dir) {

            if (!next.data('cover')) {
                return Animations.fade.apply(this, arguments);
            }

            var d = NG.$.Deferred();

            var sliceWidth = Math.ceil(this.element.width() / this.options.slices),
                bgimage    = next.data('cover').css('background-image'),
                ghost      = NG.$('<li></li>').css({
                    width  : next.width(),
                    height : next.height(),
                    opacity: 1,
                    zIndex : 15
                }),
                ghostWidth  = next.width(),
                ghostHeight = next.height(),
                bar;

            for (var i = 0; i < this.options.slices; i++) {

                bar = NG.$('<div class="ng-cover-background"></div>').css({
                    'position'           : 'absolute',
                    'top'                : 0,
                    'left'               : 0,
                    'width'              : ghostWidth,
                    'height'             : ghostHeight,
                    'background-image'   : bgimage,
                    'transform-origin'   : (sliceWidth*i)+'px 0 0',
                    'clip'               : ('rect(0px, '+(sliceWidth*(i+1))+'px, '+ghostHeight+'px, '+(sliceWidth*i)+'px)'),
                    'opacity'            : 0,
                    'transform'          : 'scaleX(0.000001)',
                    'transition'         : 'all '+this.options.duration+'ms ease-in-out '+(100+i*60)+'ms',
                    '-webkit-transition' : 'all '+this.options.duration+'ms ease-in-out '+(100+i*60)+'ms'
                });

                ghost.prepend(bar);
            }

            this.container.append(ghost);

            ghost.width();

            ghost.children().first().on(NG.support.transition.end, function() {
                ghost.remove();
                d.resolve();
            }).end().css({
                'transform': 'scaleX(1)',
                'opacity': 1
            });

            return d.promise();
        },

        'puzzle': function(current, next, dir) {

            if (!next.data('cover')) {
                return Animations.fade.apply(this, arguments);
            }

            var d = NG.$.Deferred(), $this = this;

            var boxCols   = Math.round(this.options.slices/2),
                boxWidth  = Math.round(next.width()/boxCols),
                boxRows   = Math.round(next.height()/boxWidth),
                boxHeight = Math.round(next.height()/boxRows)+1,
                bgimage   = next.data('cover').css('background-image'),
                ghost     = NG.$('<li></li>').css({
                    width   : this.container.width(),
                    height  : this.container.height(),
                    opacity : 1,
                    zIndex  : 15
                }),
                ghostWidth  = this.container.width(),
                ghostHeight = this.container.height(),
                box, rect, width;

            for (var rows = 0; rows < boxRows; rows++) {

                for (var cols = 0; cols < boxCols; cols++) {

                    width  = (cols == boxCols-1) ? (boxWidth + 2) : boxWidth;

                    rect = [
                        (boxHeight * rows)       +'px', // top
                        (width  * (cols+1))      +'px', // right
                        (boxHeight * (rows + 1)) +'px', // bottom
                        (boxWidth  * cols)       +'px'  // left
                    ];

                    box = NG.$('<div class="ng-cover-background"></div>').css({
                        'position'          : 'absolute',
                        'top'               : 0,
                        'left'              : 0,
                        'opacity'           : 0,
                        'width'             : ghostWidth,
                        'height'            : ghostHeight,
                        'background-image'  : bgimage,
                        'clip'              : ('rect('+rect.join(',')+')'),
                        '-webkit-transform' : 'translateZ(0)', // fixes webkit opacity flickering bug
                        'transform'         : 'translateZ(0)'          // fixes moz opacity flickering bug
                    });

                    ghost.append(box);
                }
            }

            this.container.append(ghost);

            var boxes = shuffle(ghost.children());

            boxes.each(function(i) {
                NG.$(this).css({
                    'transition': 'all '+$this.options.duration+'ms ease-in-out '+(50+i*25)+'ms',
                    '-webkit-transition': 'all '+$this.options.duration+'ms ease-in-out '+(50+i*25)+'ms'
                });
            }).last().on(NG.support.transition.end, function() {
                ghost.remove();
                d.resolve();
            });

            ghost.width();

            boxes.css({'opacity': 1});

            return d.promise();
        },

        'boxes': function(current, next, dir, fromfx) {

            if (!next.data('cover')) {
                return Animations.fade.apply(this, arguments);
            }

            var d = NG.$.Deferred();

            var boxCols   = Math.round(this.options.slices/2),
                boxWidth  = Math.round(next.width()/boxCols),
                boxRows   = Math.round(next.height()/boxWidth),
                boxHeight = Math.round(next.height()/boxRows)+1,
                bgimage   = next.data('cover').css('background-image'),
                ghost     = NG.$('<li></li>').css({
                    width   : next.width(),
                    height  : next.height(),
                    opacity : 1,
                    zIndex  : 15
                }),
                ghostWidth  = next.width(),
                ghostHeight = next.height(),
                box, rect, width, cols;

            for (var rows = 0; rows < boxRows; rows++) {

                for (cols = 0; cols < boxCols; cols++) {

                    width  = (cols == boxCols-1) ? (boxWidth + 2) : boxWidth;

                    rect = [
                        (boxHeight * rows)       +'px', // top
                        (width  * (cols+1))      +'px', // right
                        (boxHeight * (rows + 1)) +'px', // bottom
                        (boxWidth  * cols)       +'px'  // left
                    ];

                    box = NG.$('<div class="ng-cover-background"></div>').css({
                        'position'          : 'absolute',
                        'top'               : 0,
                        'left'              : 0,
                        'opacity'           : 1,
                        'width'             : ghostWidth,
                        'height'            : ghostHeight,
                        'background-image'  : bgimage,
                        'transform-origin'  : rect[3]+' '+rect[0]+' 0',
                        'clip'              : ('rect('+rect.join(',')+')'),
                        '-webkit-transform' : 'scale(0.0000000000000001)',
                        'transform'         : 'scale(0.0000000000000001)'
                    });

                    ghost.append(box);
                }
            }

            this.container.append(ghost);

            var rowIndex = 0, colIndex = 0, timeBuff = 0, box2Darr = [[]], boxes = ghost.children(), prevCol;

            if (fromfx == 'boxes-reverse') {
                boxes = [].reverse.apply(boxes);
            }

            boxes.each(function() {

                box2Darr[rowIndex][colIndex] = NG.$(this);
                colIndex++;

                if(colIndex == boxCols) {
                    rowIndex++;
                    colIndex = 0;
                    box2Darr[rowIndex] = [];
                }
            });

            for (cols = 0, prevCol = 0; cols < (boxCols * boxRows); cols++) {

                prevCol = cols;

                for (var row = 0; row < boxRows; row++) {

                    if (prevCol >= 0 && prevCol < boxCols) {

                        box2Darr[row][prevCol].css({
                            'transition': 'all '+this.options.duration+'ms linear '+(50+timeBuff)+'ms',
                            '-webkit-transition': 'all '+this.options.duration+'ms linear '+(50+timeBuff)+'ms'
                        });
                    }
                    prevCol--;
                }
                timeBuff += 100;
            }

            boxes.last().on(NG.support.transition.end, function() {
                ghost.remove();
                d.resolve();
            });

            ghost.width();

            boxes.css({
                '-webkit-transform': 'scale(1)',
                'transform': 'scale(1)'
            });

            return d.promise();
        },

        'boxes-reverse': function(current, next, dir) {
            return Animations.boxes.apply(this, [current, next, dir, 'boxes-reverse']);
        },

        'random-fx': function(){

            var animations = ['slice-up', 'fold', 'puzzle', 'slice-down', 'boxes', 'slice-up-down', 'boxes-reverse'];

            this.fxIndex = (this.fxIndex === undefined ? -1 : this.fxIndex) + 1;

            if (!animations[this.fxIndex]) this.fxIndex = 0;

            return Animations[animations[this.fxIndex]].apply(this, arguments);
        }
    });


    // helper functions

    // Shuffle an array
    var shuffle = function(arr) {
        for (var j, x, i = arr.length; i; j = parseInt(Math.random() * i), x = arr[--i], arr[i] = arr[j], arr[j] = x) {}
        return arr;
    };

    return NG.slideshow.animations;
});


/*
  * Based on nativesortable - Copyright (c) Brian Grinstead - https://github.com/bgrins/nativesortable
  */
(function(addon) {

    var component;

    if (window.NGkit) {
        component = addon(NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-sortable", ["ngkit"], function(){
            return component || addon(NGkit);
        });
    }

})(function(NG){

    "use strict";

    var supportsTouch       = ('ontouchstart' in window || 'MSGesture' in window) || (window.DocumentTouch && document instanceof DocumentTouch),
        draggingPlaceholder, currentlyDraggingElement, currentlyDraggingTarget, dragging, moving, clickedlink, delayIdle, touchedlists, moved, overElement;

    function closestSortable(ele) {

        ele = NG.$(ele);

        do {
            if (ele.data('sortable')) {
                return ele;
            }
            ele = NG.$(ele).parent();
        } while(ele.length);

        return ele;
    }

    NG.component('sortable', {

        defaults: {

            animation        : 150,
            threshold        : 10,

            childClass       : 'ng-sortable-item',
            placeholderClass : 'ng-sortable-placeholder',
            overClass        : 'ng-sortable-over',
            draggingClass    : 'ng-sortable-dragged',
            dragMovingClass  : 'ng-sortable-moving',
            baseClass        : 'ng-sortable',
            noDragClass      : 'ng-sortable-nodrag',
            emptyClass       : 'ng-sortable-empty',
            dragCustomClass  : '',
            handleClass      : false,
            group            : false,

            stop             : function() {},
            start            : function() {},
            change           : function() {}
        },

        boot: function() {

            // auto init
            NG.ready(function(context) {

                NG.$("[data-ng-sortable]", context).each(function(){

                    var ele = NG.$(this);

                    if(!ele.data("sortable")) {
                        NG.sortable(ele, NG.Utils.options(ele.attr("data-ng-sortable")));
                    }
                });
            });

            NG.$html.on('mousemove touchmove', function(e) {

                if (delayIdle) {

                    var src = e.originalEvent.targetTouches ? e.originalEvent.targetTouches[0] : e;
                    if (Math.abs(src.pageX - delayIdle.pos.x) > delayIdle.threshold || Math.abs(src.pageY - delayIdle.pos.y) > delayIdle.threshold) {
                        delayIdle.apply(src);
                    }
                }

                if (draggingPlaceholder) {

                    if (!moving) {
                        moving = true;
                        draggingPlaceholder.show();

                        draggingPlaceholder.$current.addClass(draggingPlaceholder.$sortable.options.placeholderClass);
                        draggingPlaceholder.$sortable.element.children().addClass(draggingPlaceholder.$sortable.options.childClass);

                        NG.$html.addClass(draggingPlaceholder.$sortable.options.dragMovingClass);
                    }

                    var offset = draggingPlaceholder.data('mouse-offset'),
                        left   = parseInt(e.originalEvent.pageX, 10) + offset.left,
                        top    = parseInt(e.originalEvent.pageY, 10) + offset.top;

                    draggingPlaceholder.css({'left': left, 'top': top });

                    // adjust document scrolling

                    if (top + (draggingPlaceholder.height()/3) > document.body.offsetHeight) {
                        return;
                    }

                    if (top < NG.$win.scrollTop()) {
                        NG.$win.scrollTop(NG.$win.scrollTop() - Math.ceil(draggingPlaceholder.height()/3));
                    } else if ( (top + (draggingPlaceholder.height()/3)) > (window.innerHeight + NG.$win.scrollTop()) ) {
                        NG.$win.scrollTop(NG.$win.scrollTop() + Math.ceil(draggingPlaceholder.height()/3));
                    }
                }
            });

            NG.$html.on('mouseup touchend', function(e) {

                delayIdle = clickedlink = false;

                // dragging?
                if (!currentlyDraggingElement || !draggingPlaceholder) {
                    // completely reset dragging attempt. will cause weird delay behavior elsewise
                    currentlyDraggingElement = draggingPlaceholder = null;
                    return;
                }

                // inside or outside of sortable?
                var sortable  = closestSortable(currentlyDraggingElement),
                    component = draggingPlaceholder.$sortable,
                    ev        = { type: e.type };

                if (sortable[0]) {
                    component.dragDrop(ev, component.element);
                }
                component.dragEnd(ev, component.element);
            });
        },

        init: function() {

            var $this   = this,
                element = this.element[0];

            touchedlists = [];

            this.checkEmptyList();

            this.element.data('sortable-group', this.options.group ? this.options.group : NG.Utils.uid('sortable-group'));

            var handleDragStart = delegate(function(e) {

                if (e.data && e.data.sortable) {
                    return;
                }

                var $target = NG.$(e.target),
                    $link   = $target.is('a[href]') ? $target:$target.parents('a[href]');

                if ($target.is(':input')) {
                    return;
                }

                if ($this.options.handleClass) {
                    var handle = $target.hasClass($this.options.handleClass) ? $target : $target.closest('.'+$this.options.handleClass, $this.element);
                    if (!handle.length) return;
                }

                e.preventDefault();

                if ($link.length) {

                    $link.one('click', function(e){
                        e.preventDefault();
                    }).one('mouseup touchend', function(){

                        if (!moved) {
                            $link.trigger('click');
                            if (supportsTouch && $link.attr('href').trim()) {
                                location.href = $link.attr('href');
                            }
                        }
                    });
                }

                e.data = e.data || {};

                e.data.sortable = element;

                return $this.dragStart(e, this);
            });

            var handleDragEnter = delegate(NG.Utils.debounce(function(e) {
                return $this.dragEnter(e, this);
            }), 40);

            var handleDragLeave = delegate(function(e) {

                // Prevent dragenter on a child from allowing a dragleave on the container
                var previousCounter = $this.dragenterData(this);
                $this.dragenterData(this, previousCounter - 1);

                // This is a fix for child elements firing dragenter before the parent fires dragleave
                if (!$this.dragenterData(this)) {
                    NG.$(this).removeClass($this.options.overClass);
                    $this.dragenterData(this, false);
                }
            });

            var handleTouchMove = delegate(function(e) {

                if (!currentlyDraggingElement ||
                    currentlyDraggingElement === this ||
                    currentlyDraggingTarget === this) {
                    return true;
                }

                $this.element.children().removeClass($this.options.overClass);
                currentlyDraggingTarget = this;

                $this.moveElementNextTo(currentlyDraggingElement, this);

                return prevent(e);
            });

            // Bind/unbind standard mouse/touch events as a polyfill.
            function addDragHandlers() {
                if (supportsTouch) {
                    element.addEventListener("touchmove", handleTouchMove, false);
                } else {
                    element.addEventListener('mouseover', handleDragEnter, false);
                    element.addEventListener('mouseout', handleDragLeave, false);
                }

                // document.addEventListener("selectstart", prevent, false);
            }

            function removeDragHandlers() {
                if (supportsTouch) {
                    element.removeEventListener("touchmove", handleTouchMove, false);
                } else {
                    element.removeEventListener('mouseover', handleDragEnter, false);
                    element.removeEventListener('mouseout', handleDragLeave, false);
                }

                // document.removeEventListener("selectstart", prevent, false);
            }

            this.addDragHandlers    = addDragHandlers;
            this.removeDragHandlers = removeDragHandlers;

            function handleDragMove(e) {

                if (!currentlyDraggingElement) {
                    return;
                }

                $this.dragMove(e, $this);
            }

            function delegate(fn) {

                return function(e) {

                    var touch, target, context;

                    if (e) {
                        touch  = (supportsTouch && e.touches && e.touches[0]) || { };
                        target = touch.target || e.target;

                        // Fix event.target for a touch event
                        if (supportsTouch && document.elementFromPoint) {
                            target = document.elementFromPoint(e.pageX - document.body.scrollLeft, e.pageY - document.body.scrollTop);
                        }

                        overElement = NG.$(target);
                    }

                    if (NG.$(target).hasClass($this.options.childClass)) {
                        fn.apply(target, [e]);
                    } else if (target !== element) {

                        // If a child is initiating the event or ending it, then use the container as context for the callback.
                        context = moveUpToChildNode(element, target);

                        if (context) {
                            fn.apply(context, [e]);
                        }
                    }
                };
            }

            window.addEventListener(supportsTouch ? 'touchmove' : 'mousemove', handleDragMove, false);
            element.addEventListener(supportsTouch ? 'touchstart': 'mousedown', handleDragStart, false);
        },

        dragStart: function(e, elem) {

            moved    = false;
            moving   = false;
            dragging = false;

            var $this    = this,
                target   = NG.$(e.target);

            if (!supportsTouch && e.button==2) {
                return;
            }

            if (target.is('.'+$this.options.noDragClass) || target.closest('.'+$this.options.noDragClass).length) {
                return;
            }

            // prevent dragging if taget is a form field
            if (target.is(':input')) {
                return;
            }

            currentlyDraggingElement = elem;

            // init drag placeholder
            if (draggingPlaceholder) {
                draggingPlaceholder.remove();
            }

            var $current = NG.$(currentlyDraggingElement), offset = $current.offset();

            delayIdle = {

                pos       : { x:e.pageX, y:e.pageY },
                threshold : $this.options.handleClass ? 1 : $this.options.threshold,
                apply     : function(evt) {

                    draggingPlaceholder = NG.$('<div class="'+([$this.options.draggingClass, $this.options.dragCustomClass].join(' '))+'"></div>').css({
                        display : 'none',
                        top     : offset.top,
                        left    : offset.left,
                        width   : $current.width(),
                        height  : $current.height(),
                        padding : $current.css('padding')
                    }).data({
                        'mouse-offset': {
                            'left'   : offset.left - parseInt(evt.pageX, 10),
                            'top'    : offset.top  - parseInt(evt.pageY, 10)
                        },
                        'origin' : $this.element,
                        'index'  : $current.index()
                    }).append($current.html()).appendTo('body');

                    draggingPlaceholder.$current  = $current;
                    draggingPlaceholder.$sortable = $this;

                    $current.data({
                        'start-list': $current.parent(),
                        'start-index': $current.index(),
                        'sortable-group': $this.options.group
                    });

                    $this.addDragHandlers();

                    $this.options.start(this, currentlyDraggingElement);
                    $this.trigger('start.ng.sortable', [$this, currentlyDraggingElement]);

                    moved     = true;
                    delayIdle = false;
                }
            };
        },

        dragMove: function(e, elem) {

            overElement = NG.$(document.elementFromPoint(e.pageX - (document.body.scrollLeft || document.scrollLeft || 0), e.pageY - (document.body.scrollTop || document.documentElement.scrollTop || 0)));

            var overRoot     = overElement.closest('.'+this.options.baseClass),
                groupOver    = overRoot.data("sortable-group"),
                $current     = NG.$(currentlyDraggingElement),
                currentRoot  = $current.parent(),
                groupCurrent = $current.data("sortable-group"),
                overChild;

            if (overRoot[0] !== currentRoot[0] && groupCurrent !== undefined && groupOver === groupCurrent) {

                overRoot.data('sortable').addDragHandlers();

                touchedlists.push(overRoot);
                overRoot.children().addClass(this.options.childClass);

                // swap root
                if (overRoot.children().length > 0) {
                    overChild = overElement.closest('.'+this.options.childClass);

                    if (overChild.length) {
                        overChild.before($current);
                    } else {
                        overRoot.append($current);
                    }

                } else { // empty list
                    overElement.append($current);
                }

                NGkit.$doc.trigger('mouseover');
            }

            this.checkEmptyList();
            this.checkEmptyList(currentRoot);
        },

        dragEnter: function(e, elem) {

            if (!currentlyDraggingElement || currentlyDraggingElement === elem) {
                return true;
            }

            var previousCounter = this.dragenterData(elem);

            this.dragenterData(elem, previousCounter + 1);

            // Prevent dragenter on a child from allowing a dragleave on the container
            if (previousCounter === 0) {

                var currentlist = NG.$(elem).parent(),
                    startlist   = NG.$(currentlyDraggingElement).data("start-list");

                if (currentlist[0] !== startlist[0]) {

                    var groupOver    = currentlist.data('sortable-group'),
                        groupCurrent = NG.$(currentlyDraggingElement).data("sortable-group");

                    if ((groupOver ||  groupCurrent) && (groupOver != groupCurrent)) {
                        return false;
                    }
                }

                NG.$(elem).addClass(this.options.overClass);
                this.moveElementNextTo(currentlyDraggingElement, elem);
            }

            return false;
        },

        dragEnd: function(e, elem) {

            var $this = this;

            // avoid triggering event twice
            if (currentlyDraggingElement) {
                // TODO: trigger on right element?
                this.options.stop(elem);
                this.trigger('stop.ng.sortable', [this]);
            }

            currentlyDraggingElement = null;
            currentlyDraggingTarget  = null;

            touchedlists.push(this.element);
            touchedlists.forEach(function(el, i) {
                NG.$(el).children().each(function() {
                    if (this.nodeType === 1) {
                        NG.$(this).removeClass($this.options.overClass)
                            .removeClass($this.options.placeholderClass)
                            .removeClass($this.options.childClass);
                        $this.dragenterData(this, false);
                    }
                });
            });

            touchedlists = [];

            NG.$html.removeClass(this.options.dragMovingClass);

            this.removeDragHandlers();

            if (draggingPlaceholder) {
                draggingPlaceholder.remove();
                draggingPlaceholder = null;
            }
        },

        dragDrop: function(e, elem) {

            if (e.type === 'drop') {

                if (e.stopPropagation) {
                    e.stopPropagation();
                }

                if (e.preventDefault) {
                    e.preventDefault();
                }
            }

            this.triggerChangeEvents();
        },

        triggerChangeEvents: function() {

            // trigger events once
            if (!currentlyDraggingElement) return;

            var $current = NG.$(currentlyDraggingElement),
                oldRoot  = draggingPlaceholder.data("origin"),
                newRoot  = $current.closest('.'+this.options.baseClass),
                triggers = [],
                el       = NG.$(currentlyDraggingElement);

            // events depending on move inside lists or across lists
            if (oldRoot[0] === newRoot[0] && draggingPlaceholder.data('index') != $current.index() ) {
                triggers.push({sortable: this, mode: 'moved'});
            } else if (oldRoot[0] != newRoot[0]) {
                triggers.push({sortable: NG.$(newRoot).data('sortable'), mode: 'added'}, {sortable: NG.$(oldRoot).data('sortable'), mode: 'removed'});
            }

            triggers.forEach(function (trigger, i) {
                if (trigger.sortable) {
                    trigger.sortable.element.trigger('change.ng.sortable', [trigger.sortable, el, trigger.mode]);
                }
            });
        },

        dragenterData: function(element, val) {

            element = NG.$(element);

            if (arguments.length == 1) {
                return parseInt(element.data('child-dragenter'), 10) || 0;
            } else if (!val) {
                element.removeData('child-dragenter');
            } else {
                element.data('child-dragenter', Math.max(0, val));
            }
        },

        moveElementNextTo: function(element, elementToMoveNextTo) {

            dragging = true;

            var $this    = this,
                list     = NG.$(element).parent().css('min-height', ''),
                next     = isBelow(element, elementToMoveNextTo) ? elementToMoveNextTo : elementToMoveNextTo.nextSibling,
                children = list.children(),
                count    = children.length;

            if (!$this.options.animation) {
                elementToMoveNextTo.parentNode.insertBefore(element, next);
                NG.Utils.checkDisplay($this.element.parent());
                return;
            }

            list.css('min-height', list.height());

            children.stop().each(function(){
                var ele = NG.$(this),
                    offset = ele.position();

                    offset.width = ele.width();

                ele.data('offset-before', offset);
            });

            elementToMoveNextTo.parentNode.insertBefore(element, next);

            NG.Utils.checkDisplay($this.element.parent());

            children = list.children().each(function() {
                var ele    = NG.$(this);
                ele.data('offset-after', ele.position());
            }).each(function() {
                var ele    = NG.$(this),
                    before = ele.data('offset-before');
                ele.css({'position':'absolute', 'top':before.top, 'left':before.left, 'min-width':before.width });
            });

            children.each(function(){

                var ele    = NG.$(this),
                    before = ele.data('offset-before'),
                    offset = ele.data('offset-after');

                    ele.css('pointer-events', 'none').width();

                    setTimeout(function(){
                        ele.animate({'top':offset.top, 'left':offset.left}, $this.options.animation, function() {
                            ele.css({'position':'','top':'', 'left':'', 'min-width': '', 'pointer-events':''}).removeClass($this.options.overClass).removeData('child-dragenter');
                            count--;
                            if (!count) {
                                list.css('min-height', '');
                                NG.Utils.checkDisplay($this.element.parent());
                            }
                        });
                    }, 0);
            });
        },

        serialize: function() {

            var data = [], item, attribute;

            this.element.children().each(function(j, child) {
                item = {};
                for (var i = 0, attr, val; i < child.attributes.length; i++) {
                    attribute = child.attributes[i];
                    if (attribute.name.indexOf('data-') === 0) {
                        attr       = attribute.name.substr(5);
                        val        =  NG.Utils.str2json(attribute.value);
                        item[attr] = (val || attribute.value=='false' || attribute.value=='0') ? val:attribute.value;
                    }
                }
                data.push(item);
            });

            return data;
        },

        checkEmptyList: function(list) {

            list  = list ? NG.$(list) : this.element;

            if (this.options.emptyClass) {
                list[!list.children().length ? 'addClass':'removeClass'](this.options.emptyClass);
            }
        }
    });

    // helpers

    function isBelow(el1, el2) {

        var parent = el1.parentNode;

        if (el2.parentNode != parent) {
            return false;
        }

        var cur = el1.previousSibling;

        while (cur && cur.nodeType !== 9) {
            if (cur === el2) {
                return true;
            }
            cur = cur.previousSibling;
        }

        return false;
    }

    function moveUpToChildNode(parent, child) {
        var cur = child;
        if (cur == parent) { return null; }

        while (cur) {
            if (cur.parentNode === parent) {
                return cur;
            }

            cur = cur.parentNode;
            if ( !cur || !cur.ownerDocument || cur.nodeType === 11 ) {
                break;
            }
        }
        return null;
    }

    function prevent(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.returnValue = false;
    }

    return NG.sortable;
});


(function(addon) {

    var component;

    if (window.NGkit) {
        component = addon(NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-sticky", ["ngkit"], function(){
            return component || addon(NGkit);
        });
    }

})(function(NG){

    "use strict";

    var $win         = NG.$win,
        $doc         = NG.$doc,
        sticked      = [],
        direction    = 1;

    NG.component('sticky', {

        defaults: {
            top          : 0,
            bottom       : 0,
            animation    : '',
            clsinit      : 'ng-sticky-init',
            clsactive    : 'ng-active',
            clsinactive  : '',
            getWidthFrom : '',
            showup      : false,
            boundary     : false,
            media        : false,
            target       : false,
            disabled     : false
        },

        boot: function() {

            // should be more efficient than using $win.scroll(checkscrollposition):
            NG.$doc.on('scrolling.ng.document', function(e, data) {
                if (!data || !data.dir) return;
                direction = data.dir.y;
                checkscrollposition();
            });

            NG.$win.on('resize orientationchange', NG.Utils.debounce(function() {

                if (!sticked.length) return;

                for (var i = 0; i < sticked.length; i++) {
                    sticked[i].reset(true);
                    //sticked[i].self.computeWrapper();
                }

                checkscrollposition();
            }, 100));

            // init code
            NG.ready(function(context) {

                setTimeout(function(){

                    NG.$("[data-ng-sticky]", context).each(function(){

                        var $ele = NG.$(this);

                        if(!$ele.data("sticky")) {
                            NG.sticky($ele, NG.Utils.options($ele.attr('data-ng-sticky')));
                        }
                    });

                    checkscrollposition();
                }, 0);
            });
        },

        init: function() {

            var boundary = this.options.boundary, boundtoparent;

            this.wrapper = this.element.wrap('<div class="ng-sticky-placeholder"></div>').parent();
            this.computeWrapper();
            this.element.css('margin', 0);

            if (boundary) {

                if (boundary === true || boundary[0] === '!') {

                    boundary      = boundary === true ? this.wrapper.parent() : this.wrapper.closest(boundary.substr(1));
                    boundtoparent = true;

                } else if (typeof boundary === "string") {
                    boundary = NG.$(boundary);
                }
            }

            this.sticky = {
                self          : this,
                options       : this.options,
                element       : this.element,
                currentTop    : null,
                wrapper       : this.wrapper,
                init          : false,
                getWidthFrom  : NG.$(this.options.getWidthFrom || this.wrapper),
                boundary      : boundary,
                boundtoparent : boundtoparent,
                top           : 0,
                calcTop       : function() {

                    var top = this.options.top;

                    // dynamic top parameter
                    if (this.options.top && typeof(this.options.top) == 'string') {

                        // e.g. 50vh
                        if (this.options.top.match(/^(-|)(\d+)vh$/)) {
                            top = window.innerHeight * parseInt(this.options.top, 10)/100;
                        // e.g. #elementId, or .class-1,class-2,.class-3 (first found is used)
                        } else {

                            var topElement = NG.$(this.options.top).first();

                            if (topElement.length && topElement.is(':visible')) {
                                top = -1 * ((topElement.offset().top + topElement.outerHeight()) - this.wrapper.offset().top);
                            }
                        }

                    }

                    this.top = top;
                },

                reset: function(force) {

                    this.calcTop();

                    var finalize = function() {
                        this.element.css({"position":"", "top":"", "width":"", "left":"", "margin":"0"});
                        this.element.removeClass([this.options.animation, 'ng-animation-reverse', this.options.clsactive].join(' '));
                        this.element.addClass(this.options.clsinactive);
                        this.element.trigger('inactive.ng.sticky');

                        this.currentTop = null;
                        this.animate    = false;
                    }.bind(this);


                    if (!force && this.options.animation && NG.support.animation && !NG.Utils.isInView(this.wrapper)) {

                        this.animate = true;

                        this.element.removeClass(this.options.animation).one(NG.support.animation.end, function(){
                            finalize();
                        }).width(); // force redraw

                        this.element.addClass(this.options.animation+' '+'ng-animation-reverse');
                    } else {
                        finalize();
                    }
                },

                check: function() {

                    if (this.options.disabled) {
                        return false;
                    }

                    if (this.options.media) {

                        switch(typeof(this.options.media)) {
                            case 'number':
                                if (window.innerWidth < this.options.media) {
                                    return false;
                                }
                                break;
                            case 'string':
                                if (window.matchMedia && !window.matchMedia(this.options.media).matches) {
                                    return false;
                                }
                                break;
                        }
                    }

                    var scrollTop      = $win.scrollTop(),
                        documentHeight = $doc.height(),
                        dwh            = documentHeight - window.innerHeight,
                        extra          = (scrollTop > dwh) ? dwh - scrollTop : 0,
                        elementTop     = this.wrapper.offset().top,
                        etse           = elementTop - this.top - extra,
                        active         = (scrollTop  >= etse);

                    if (active && this.options.showup) {

                        // set inactiv if scrolling down
                        if (direction == 1) {
                            active = false;
                        }

                        // set inactive when wrapper is still in view
                        if (direction == -1 && !this.element.hasClass(this.options.clsactive) && NG.Utils.isInView(this.wrapper)) {
                            active = false;
                        }
                    }

                    return active;
                }
            };

            this.sticky.calcTop();

            sticked.push(this.sticky);
        },

        update: function() {
            checkscrollposition(this.sticky);
        },

        enable: function() {
            this.options.disabled = false;
            this.update();
        },

        disable: function(force) {
            this.options.disabled = true;
            this.sticky.reset(force);
        },

        computeWrapper: function() {

            this.wrapper.css({
                'height' : ['absolute','fixed'].indexOf(this.element.css('position')) == -1 ? this.element.outerHeight() : '',
                'float'  : this.element.css('float') != 'none' ? this.element.css('float') : '',
                'margin' : this.element.css('margin')
            });

            if (this.element.css('position') == 'fixed') {
                this.element.css({
                    width: this.sticky.getWidthFrom.length ? this.sticky.getWidthFrom.width() : this.element.width()
                });
            }
        }
    });

    function checkscrollposition(direction) {

        var stickies = arguments.length ? arguments : sticked;

        if (!stickies.length || $win.scrollTop() < 0) return;

        var scrollTop       = $win.scrollTop(),
            documentHeight  = $doc.height(),
            windowHeight    = $win.height(),
            dwh             = documentHeight - windowHeight,
            extra           = (scrollTop > dwh) ? dwh - scrollTop : 0,
            newTop, containerBottom, stickyHeight, sticky;

        for (var i = 0; i < stickies.length; i++) {

            sticky = stickies[i];

            if (!sticky.element.is(":visible") || sticky.animate) {
                continue;
            }

            if (!sticky.check()) {

                if (sticky.currentTop !== null) {
                    sticky.reset();
                }

            } else {

                if (sticky.top < 0) {
                    newTop = 0;
                } else {
                    stickyHeight = sticky.element.outerHeight();
                    newTop = documentHeight - stickyHeight - sticky.top - sticky.options.bottom - scrollTop - extra;
                    newTop = newTop < 0 ? newTop + sticky.top : sticky.top;
                }

                if (sticky.boundary && sticky.boundary.length) {

                    var bTop = sticky.boundary.offset().top;

                    if (sticky.boundtoparent) {
                        containerBottom = documentHeight - (bTop + sticky.boundary.outerHeight()) + parseInt(sticky.boundary.css('padding-bottom'));
                    } else {
                        containerBottom = documentHeight - bTop;
                    }

                    newTop = (scrollTop + stickyHeight) > (documentHeight - containerBottom - (sticky.top < 0 ? 0 : sticky.top)) ? (documentHeight - containerBottom) - (scrollTop + stickyHeight) : newTop;
                }


                if (sticky.currentTop != newTop) {

                    sticky.element.css({
                        position : "fixed",
                        top      : newTop,
                        width    : sticky.getWidthFrom.length ? sticky.getWidthFrom.width() : sticky.element.width()
                    });

                    if (!sticky.init) {

                        sticky.element.addClass(sticky.options.clsinit);

                        if (location.hash && scrollTop > 0 && sticky.options.target) {

                            var $target = NG.$(location.hash);

                            if ($target.length) {

                                setTimeout((function($target, sticky){

                                    return function() {

                                        sticky.element.width(); // force redraw

                                        var offset       = $target.offset(),
                                            maxoffset    = offset.top + $target.outerHeight(),
                                            stickyOffset = sticky.element.offset(),
                                            stickyHeight = sticky.element.outerHeight(),
                                            stickyMaxOffset = stickyOffset.top + stickyHeight;

                                        if (stickyOffset.top < maxoffset && offset.top < stickyMaxOffset) {
                                            scrollTop = offset.top - stickyHeight - sticky.options.target;
                                            window.scrollTo(0, scrollTop);
                                        }
                                    };

                                })($target, sticky), 0);
                            }
                        }
                    }

                    sticky.element.addClass(sticky.options.clsactive).removeClass(sticky.options.clsinactive);
                    sticky.element.trigger('active.ng.sticky');
                    sticky.element.css('margin', '');

                    if (sticky.options.animation && sticky.init && !NG.Utils.isInView(sticky.wrapper)) {
                        sticky.element.addClass(sticky.options.animation);
                    }

                    sticky.currentTop = newTop;
                }
            }

            sticky.init = true;
        }
    }

    return NG.sticky;
});


(function(addon) {

    var component;

    if (window.NGkit) {
        component = addon(NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-timepicker", ["ngkit"], function(){
            return component || addon(NGkit);
        });
    }

})(function(NG){

    "use strict";


    NG.component('timepicker', {

        defaults: {
            format : '24h',
            delay  : 0,
            start  : 0,
            end    : 24
        },

        boot: function() {

            // init code
            NG.$html.on("focus.timepicker.ngkit", "[data-ng-timepicker]", function(e) {

                var ele = NG.$(this);

                if (!ele.data("timepicker")) {
                    var obj = NG.timepicker(ele, NG.Utils.options(ele.attr("data-ng-timepicker")));

                    setTimeout(function(){
                        obj.autocomplete.input.focus();
                    }, 40);
                }
            });
        },

        init: function() {

            var $this  = this, times = getTimeRange(this.options.start, this.options.end), container;

            this.options.minLength = 0;
            this.options.template  = '<ul class="ng-nav ng-nav-autocomplete ng-autocomplete-results">{{~items}}<li data-value="{{$item.value}}"><a>{{$item.value}}</a></li>{{/items}}</ul>';

            this.options.source = function(release) {
                release(times[$this.options.format] || times['12h']);
            };

            if (this.element.is('input')) {
                this.element.wrap('<div class="ng-autocomplete"></div>');
                container = this.element.parent();
            } else {
                container = this.element.addClass('ng-autocomplete');
            }

            this.autocomplete = NG.autocomplete(container, this.options);
            this.autocomplete.dropdown.addClass('ng-dropdown-small ng-dropdown-scrollable');

            this.autocomplete.on('show.ng.autocomplete', function() {

                var selected = $this.autocomplete.dropdown.find('[data-value="'+$this.autocomplete.input.val()+'"]');

                setTimeout(function(){
                    $this.autocomplete.pick(selected, true);
                }, 10);
            });

            this.autocomplete.input.on('focus', function(){

                $this.autocomplete.value = Math.random();
                $this.autocomplete.triggercomplete();

            }).on('blur', NG.Utils.debounce(function() {
                $this.checkTime();
            }, 100));

            this.element.data("timepicker", this);
        },

        checkTime: function() {

            var arr, timeArray, meridian = 'AM', hour, minute, time = this.autocomplete.input.val();

            if (this.options.format == '12h') {
                arr = time.split(' ');
                timeArray = arr[0].split(':');
                meridian = arr[1];
            } else {
                timeArray = time.split(':');
            }

            hour   = parseInt(timeArray[0], 10);
            minute = parseInt(timeArray[1], 10);

            if (isNaN(hour))   hour = 0;
            if (isNaN(minute)) minute = 0;

            if (this.options.format == '12h') {
                if (hour > 12) {
                    hour = 12;
                } else if (hour < 0) {
                    hour = 12;
                }

                if (meridian === 'am' || meridian === 'a') {
                    meridian = 'AM';
                } else if (meridian === 'pm' || meridian === 'p') {
                    meridian = 'PM';
                }

                if (meridian !== 'AM' && meridian !== 'PM') {
                    meridian = 'AM';
                }

            } else {

                if (hour >= 24) {
                    hour = 23;
                } else if (hour < 0) {
                    hour = 0;
                }
            }

            if (minute < 0) {
                minute = 0;
            } else if (minute >= 60) {
                minute = 0;
            }

            this.autocomplete.input.val(this.formatTime(hour, minute, meridian)).trigger('change');
        },

        formatTime: function(hour, minute, meridian) {
            hour = hour < 10 ? '0' + hour : hour;
            minute = minute < 10 ? '0' + minute : minute;
            return hour + ':' + minute + (this.options.format == '12h' ? ' ' + meridian : '');
        }
    });

    // helper

    function getTimeRange(start, end) {

        start = start || 0;
        end   = end || 24;

        var times = {'12h':[], '24h':[]}, i, h;

        for (i = start, h=''; i<end; i++) {

            h = ''+i;

            if (i<10)  h = '0'+h;

            times['24h'].push({value: (h+':00')});
            times['24h'].push({value: (h+':30')});

            if (i === 0) {
                h = 12;
                times['12h'].push({value: (h+':00 AM')});
                times['12h'].push({value: (h+':30 AM')});
            }

            if (i > 0 && i<13 && i!==12) {
                times['12h'].push({value: (h+':00 AM')});
                times['12h'].push({value: (h+':30 AM')});
            }

            if (i >= 12) {

                h = h-12;
                if (h === 0) h = 12;
                if (h < 10) h = '0'+String(h);

                times['12h'].push({value: (h+':00 PM')});
                times['12h'].push({value: (h+':30 PM')});
            }
        }

        return times;
    }

});


(function(addon) {
    var component;

    if (window.NGkit) {
        component = addon(NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-tooltip", ["ngkit"], function(){
            return component || addon(NGkit);
        });
    }

})(function(NG){

    "use strict";

    var $tooltip,   // tooltip container
        tooltipdelay, checkdelay;

    NG.component('tooltip', {

        defaults: {
            "offset": 5,
            "pos": "top",
            "animation": false,
            "delay": 0, // in miliseconds
            "cls": "",
            "activeClass": "ng-active",
            "src": function(ele) {
                var title = ele.attr('title');

                if (title !== undefined) {
                    ele.data('cached-title', title).removeAttr('title');
                }

                return ele.data("cached-title");
            }
        },

        tip: "",

        boot: function() {

            // init code
            NG.$html.on("mouseenter.tooltip.ngkit focus.tooltip.ngkit", "[data-ng-tooltip]", function(e) {
                var ele = NG.$(this);

                if (!ele.data("tooltip")) {
                    NG.tooltip(ele, NG.Utils.options(ele.attr("data-ng-tooltip")));
                    ele.trigger("mouseenter");
                }
            });
        },

        init: function() {

            var $this = this;

            if (!$tooltip) {
                $tooltip = NG.$('<div class="ng-tooltip"></div>').appendTo("body");
            }

            this.on({
                focus      : function(e) { $this.show(); },
                blur       : function(e) { $this.hide(); },
                mouseenter : function(e) { $this.show(); },
                mouseleave : function(e) { $this.hide(); }
            });
        },

        show: function() {

            this.tip = typeof(this.options.src) === "function" ? this.options.src(this.element) : this.options.src;

            if (tooltipdelay)     clearTimeout(tooltipdelay);
            if (checkdelay)       clearTimeout(checkdelay);

            if (typeof(this.tip) === 'string' ? !this.tip.length:true) return;

            $tooltip.stop().css({"top": -2000, "visibility": "hidden"}).removeClass(this.options.activeClass).show();
            $tooltip.html('<div class="ng-tooltip-inner">' + this.tip + '</div>');

            var $this      = this,
                pos        = NG.$.extend({}, this.element.offset(), {width: this.element[0].offsetWidth, height: this.element[0].offsetHeight}),
                width      = $tooltip[0].offsetWidth,
                height     = $tooltip[0].offsetHeight,
                offset     = typeof(this.options.offset) === "function" ? this.options.offset.call(this.element) : this.options.offset,
                position   = typeof(this.options.pos) === "function" ? this.options.pos.call(this.element) : this.options.pos,
                tmppos     = position.split("-"),
                tcss       = {
                    "display"    : "none",
                    "visibility" : "visible",
                    "top"        : (pos.top + pos.height + height),
                    "left"       : pos.left
                };


            // prevent strange position
            // when tooltip is in offcanvas etc.
            if (NG.$html.css('position')=='fixed' || NG.$body.css('position')=='fixed'){
                var bodyoffset = NG.$('body').offset(),
                    htmloffset = NG.$('html').offset(),
                    docoffset  = {'top': (htmloffset.top + bodyoffset.top), 'left': (htmloffset.left + bodyoffset.left)};

                pos.left -= docoffset.left;
                pos.top  -= docoffset.top;
            }


            if ((tmppos[0] == "left" || tmppos[0] == "right") && NG.langdirection == 'right') {
                tmppos[0] = tmppos[0] == "left" ? "right" : "left";
            }

            var variants =  {
                "bottom"  : {top: pos.top + pos.height + offset, left: pos.left + pos.width / 2 - width / 2},
                "top"     : {top: pos.top - height - offset, left: pos.left + pos.width / 2 - width / 2},
                "left"    : {top: pos.top + pos.height / 2 - height / 2, left: pos.left - width - offset},
                "right"   : {top: pos.top + pos.height / 2 - height / 2, left: pos.left + pos.width + offset}
            };

            NG.$.extend(tcss, variants[tmppos[0]]);

            if (tmppos.length == 2) tcss.left = (tmppos[1] == 'left') ? (pos.left) : ((pos.left + pos.width) - width);

            var boundary = this.checkBoundary(tcss.left, tcss.top, width, height);

            if(boundary) {

                switch(boundary) {
                    case "x":

                        if (tmppos.length == 2) {
                            position = tmppos[0]+"-"+(tcss.left < 0 ? "left": "right");
                        } else {
                            position = tcss.left < 0 ? "right": "left";
                        }

                        break;

                    case "y":
                        if (tmppos.length == 2) {
                            position = (tcss.top < 0 ? "bottom": "top")+"-"+tmppos[1];
                        } else {
                            position = (tcss.top < 0 ? "bottom": "top");
                        }

                        break;

                    case "xy":
                        if (tmppos.length == 2) {
                            position = (tcss.top < 0 ? "bottom": "top")+"-"+(tcss.left < 0 ? "left": "right");
                        } else {
                            position = tcss.left < 0 ? "right": "left";
                        }

                        break;

                }

                tmppos = position.split("-");

                NG.$.extend(tcss, variants[tmppos[0]]);

                if (tmppos.length == 2) tcss.left = (tmppos[1] == 'left') ? (pos.left) : ((pos.left + pos.width) - width);
            }


            tcss.left -= NG.$body.position().left;

            tooltipdelay = setTimeout(function(){

                $tooltip.css(tcss).attr("class", ["ng-tooltip", "ng-tooltip-"+position, $this.options.cls].join(' '));

                if ($this.options.animation) {
                    $tooltip.css({opacity: 0, display: 'block'}).addClass($this.options.activeClass).animate({opacity: 1}, parseInt($this.options.animation, 10) || 400);
                } else {
                    $tooltip.show().addClass($this.options.activeClass);
                }

                tooltipdelay = false;

                // close tooltip if element was removed or hidden
                checkdelay = setInterval(function(){
                    if(!$this.element.is(':visible')) $this.hide();
                }, 150);

            }, parseInt(this.options.delay, 10) || 0);
        },

        hide: function() {
            if(this.element.is("input") && this.element[0]===document.activeElement) return;

            if(tooltipdelay) clearTimeout(tooltipdelay);
            if (checkdelay)  clearTimeout(checkdelay);

            $tooltip.stop();

            if (this.options.animation) {

                var $this = this;

                $tooltip.fadeOut(parseInt(this.options.animation, 10) || 400, function(){
                    $tooltip.removeClass($this.options.activeClass)
                });

            } else {
                $tooltip.hide().removeClass(this.options.activeClass);
            }
        },

        content: function() {
            return this.tip;
        },

        checkBoundary: function(left, top, width, height) {

            var axis = "";

            if(left < 0 || ((left - NG.$win.scrollLeft())+width) > window.innerWidth) {
               axis += "x";
            }

            if(top < 0 || ((top - NG.$win.scrollTop())+height) > window.innerHeight) {
               axis += "y";
            }

            return axis;
        }
    });

    return NG.tooltip;
});


(function(addon) {

    var component;

    if (window.NGkit) {
        component = addon(NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-upload", ["ngkit"], function(){
            return component || addon(NGkit);
        });
    }

})(function(NG){

    "use strict";

    NG.component('uploadSelect', {

        init: function() {

            var $this = this;

            this.on("change", function() {
                xhrupload($this.element[0].files, $this.options);
                var twin = $this.element.clone(true).data('uploadSelect', $this);
                $this.element.replaceWith(twin);
                $this.element = twin;
            });
        }
    });

    NG.component('uploadDrop', {

        defaults: {
            'dragoverClass': 'ng-dragover'
        },

        init: function() {

            var $this = this, hasdragCls = false;

            this.on("drop", function(e){

                if (e.dataTransfer && e.dataTransfer.files) {

                    e.stopPropagation();
                    e.preventDefault();

                    $this.element.removeClass($this.options.dragoverClass);
                    $this.element.trigger('dropped.ng.upload', [e.dataTransfer.files]);

                    xhrupload(e.dataTransfer.files, $this.options);
                }

            }).on("dragenter", function(e){
                e.stopPropagation();
                e.preventDefault();
            }).on("dragover", function(e){
                e.stopPropagation();
                e.preventDefault();

                if (!hasdragCls) {
                    $this.element.addClass($this.options.dragoverClass);
                    hasdragCls = true;
                }
            }).on("dragleave", function(e){
                e.stopPropagation();
                e.preventDefault();
                $this.element.removeClass($this.options.dragoverClass);
                hasdragCls = false;
            });
        }
    });


    NG.support.ajaxupload = (function() {

        function supportFileAPI() {
            var fi = document.createElement('INPUT'); fi.type = 'file'; return 'files' in fi;
        }

        function supportAjaxUploadProgressEvents() {
            var xhr = new XMLHttpRequest(); return !! (xhr && ('upload' in xhr) && ('onprogress' in xhr.upload));
        }

        function supportFormData() {
            return !! window.FormData;
        }

        return supportFileAPI() && supportAjaxUploadProgressEvents() && supportFormData();
    })();

    if (NG.support.ajaxupload){
        NG.$.event.props.push("dataTransfer");
    }

    function xhrupload(files, settings) {

        if (!NG.support.ajaxupload){
            return this;
        }

        settings = NG.$.extend({}, xhrupload.defaults, settings);

        if (!files.length){
            return;
        }

        if (settings.allow !== '*.*') {

            for(var i=0,file;file=files[i];i++) {

                if(!matchName(settings.allow, file.name)) {

                    if(typeof(settings.notallowed) == 'string') {
                       alert(settings.notallowed);
                    } else {
                       settings.notallowed(file, settings);
                    }
                    return;
                }
            }
        }

        var complete = settings.complete;

        if (settings.single){

            var count    = files.length,
                uploaded = 0,
                allow    = true;

                settings.beforeAll(files);

                settings.complete = function(response, xhr){

                    uploaded = uploaded + 1;

                    complete(response, xhr);

                    if (settings.filelimit && uploaded >= settings.filelimit){
                        allow = false;
                    }

                    if (allow && uploaded<count){
                        upload([files[uploaded]], settings);
                    } else {
                        settings.allcomplete(response, xhr);
                    }
                };

                upload([files[0]], settings);

        } else {

            settings.complete = function(response, xhr){
                complete(response, xhr);
                settings.allcomplete(response, xhr);
            };

            upload(files, settings);
        }

        function upload(files, settings){

            // upload all at once
            var formData = new FormData(), xhr = new XMLHttpRequest();

            if (settings.before(settings, files)===false) return;

            for (var i = 0, f; f = files[i]; i++) { formData.append(settings.param, f); }
            for (var p in settings.params) { formData.append(p, settings.params[p]); }

            // Add any event handlers here...
            xhr.upload.addEventListener("progress", function(e){
                var percent = (e.loaded / e.total)*100;
                settings.progress(percent, e);
            }, false);

            xhr.addEventListener("loadstart", function(e){ settings.loadstart(e); }, false);
            xhr.addEventListener("load",      function(e){ settings.load(e);      }, false);
            xhr.addEventListener("loadend",   function(e){ settings.loadend(e);   }, false);
            xhr.addEventListener("error",     function(e){ settings.error(e);     }, false);
            xhr.addEventListener("abort",     function(e){ settings.abort(e);     }, false);

            xhr.open(settings.method, settings.action, true);

            if (settings.type=="json") {
                xhr.setRequestHeader("Accept", "application/json");
            }

            xhr.onreadystatechange = function() {

                settings.readystatechange(xhr);

                if (xhr.readyState==4){

                    var response = xhr.responseText;

                    if (settings.type=="json") {
                        try {
                            response = NG.$.parseJSON(response);
                        } catch(e) {
                            response = false;
                        }
                    }

                    settings.complete(response, xhr);
                }
            };
            settings.beforeSend(xhr);
            xhr.send(formData);
        }
    }

    xhrupload.defaults = {
        'action': '',
        'single': true,
        'method': 'POST',
        'param' : 'files[]',
        'params': {},
        'allow' : '*.*',
        'type'  : 'text',
        'filelimit': false,

        // events
        'before'          : function(o){},
        'beforeSend'      : function(xhr){},
        'beforeAll'       : function(){},
        'loadstart'       : function(){},
        'load'            : function(){},
        'loadend'         : function(){},
        'error'           : function(){},
        'abort'           : function(){},
        'progress'        : function(){},
        'complete'        : function(){},
        'allcomplete'     : function(){},
        'readystatechange': function(){},
        'notallowed'      : function(file, settings){ alert('Only the following file types are allowed: '+settings.allow); }
    };

    function matchName(pattern, path) {

        var parsedPattern = '^' + pattern.replace(/\//g, '\\/').
            replace(/\*\*/g, '(\\/[^\\/]+)*').
            replace(/\*/g, '[^\\/]+').
            replace(/((?!\\))\?/g, '$1.') + '$';

        parsedPattern = '^' + parsedPattern + '$';

        return (path.match(new RegExp(parsedPattern, 'i')) !== null);
    }

    NG.Utils.xhrupload = xhrupload;

    return xhrupload;
});


(function($, NG){

    "use strict";

    var SubnavAccordion = function(element, options) {
        var $this = this,
            $element = $(element);

        if($element.data("subnavaccordion")) return;

        this.options  = $.extend({}, SubnavAccordion.defaults, options);
        this.element = $element.on({
            "focus"     : function(e) { $this.open(e); },
            "mouseenter": function(e) { $this.open(e); },
            "ng-close": function(e) { $this.close(e); },
            "ng-open": function(e) { $this.open(e); }
        });

        if (this.options.alwaysClose){
            $element.on({
                "mouseleave": function(e) { $this.close(e); },
                "blur": function(e) { $this.close(e); }
            });
        }
        this.element.data("subnavaccordion", this);
        if (this.options.initialWidth) {
            this.closed_width = this.options.initialWidth;
        } else {
            this.closed_width = $element.find(this.options.selector).width();
        }
        this.opened_width = $element.width();
        this.css_height = $element.height();
        $element.css({
            width: this.closed_width + 'px',
            height: this.css_height + 'px',
            overflow: 'hidden'
        });
    };

    SubnavAccordion.defaults = {
        alwaysClose: false,
        initiallyOpen: 0,
        initialWidth: null,
        selector: '> a > *:first'
    };

    $.extend(SubnavAccordion.prototype, {
        close: function(e) {
            // Close a li element to the width of the .ng-swatch child
            $(this.element[0]).stop();
            $(this.element[0]).animate({
                width: this.closed_width + 'px'
            }, 500);
        },
        open: function(e) {
            // Show the entire li element
            $(this.element[0]).stop();
            $(this.element[0]).siblings().each(function(index, element){
                $(element).data("subnavaccordion").close();
            });
            $(this.element[0]).animate({
                width: this.opened_width + "px"
            }, 500);
        }
    });
    NG.ready(function(context) {
        $("[data-ng-subnavaccordion]", context).each(function() {
            var subnav = $(this),
                obj,
                opts = $.extend({}, SubnavAccordion.defaults, NG.Utils.options(subnav.attr("data-ng-subnavaccordion")));
            $.each(subnav[0].children, function(index, item){
                if (!$(item).data("subnavaccordion")) {
                    obj = new SubnavAccordion($(item), NG.Utils.options(subnav.attr("data-ng-subnavaccordion")));
                }
            });
            if (opts.initiallyOpen >= 0) {
                $(subnav[0].children[opts.initiallyOpen]).trigger('ng-open');
            }
        });
    });

})(jQuery, jQuery.NGkit);


/* There are two components: the drawer and the trigger

    The drawer is the definition of how the drawer interacts with its parent, e.g.
    the closed width, the height, if it is initially open.

    A drawer can have multiple triggers. Triggers tell the drawer to open or close.

    If the drawer is partially open (closedWith > 0), the drawer itself can act
    as a trigger, opening on mouse over.
*/
(function(addon) {
    var component;

    if (jQuery && jQuery.NGkit) {
        component = addon(jQuery, jQuery.NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-drawer", ["ngkit"], function(){
            return component || addon(jQuery, jQuery.NGkit);
        });
        define("ngkit-drawertrigger", ["ngkit"], function(){
            return component || addon(jQuery, jQuery.NGkit);
        });
    }
})(function($, NG){

    "use strict";

    NG.component('drawer', {
        defaults: {
            openOnHover: false,
            initiallyOpen: false,
            minWidth: 0,
            maxWidth: null,
            minHeight: 0,
            maxHeight: null,
            closedWidth: 0,
            closedHeight: 0
        },

        // Methods
        init: function() {
            var $this   = this,
                $element = $(this.element);

            this.element.data("drawer", this);
            this.flipped = $element.hasClass('ng-drawer-flip');
            this.vertical = $element.hasClass('ng-drawer-top') || $element.hasClass('ng-drawer-bottom');
            this.closedWidth = this.options.closedWidth;
            if (this.options.maxWidth === null)
                this.options.maxWidth = $element.parent().width();
            if (this.options.maxHeight === null)
                this.options.maxHeight = $element.parent().height();
            this.checksize(true);
            $element.parent().css('overflow', 'hidden');
            this.element = $element.on({
                "focus"     : function(e) { $this.open(e); },
                "ng-close": function(e) { $this.close(e); },
                "ng-open": function(e) { $this.open(e); },
                "ng-toggle": function(e) {if ($this.element.hasClass('ng-open')) $this.close(e); else $this.open(e);},
                "ng-check-display": function(e) {$this.checksize();},
            });
            $(window).on({
                "resize": function(e) {$this.checksize();},
                "orientationchange": function(e) {$this.checksize();}
            });

            if (this.options.openOnHover && this.options.minWith > 0){
                $element.on({
                    "mouseenter": function(e) { $this.open(e); },
                    "mouseleave": function(e) { $this.close(e); },
                    "blur": function(e) { $this.close(e); }
                });
            }
        },
        close: function(e) {
            this.element.removeClass('ng-open');
            this.checksize();
        },
        open: function(e) {
            this.element.addClass('ng-open');
            this.checksize();
        },
        checksize: function(isInitial) {
            var cssAttrs = {};
            isInitial = isInitial || false;  // Is this the first time we are setting it up?

            if(!this.vertical){
                this.openedWidth = Math.max(this.options.minWidth, $(this.element).width());
                this.openedWidth = Math.min(this.openedWidth, this.options.maxWidth);
                this.openedHeight = '100%';
                cssAttrs = {
                    width: this.openedWidth + 'px',
                    height: this.openedHeight,
                    display: 'block'
                };
            } else {
                this.openedHeight = Math.max(this.options.minHeight, $(this.element).height());
                this.openedHeight = Math.min(this.openedHeight, this.options.maxHeight);
                this.openedWidth = '100%';
                cssAttrs = {
                    width: this.openedWidth,
                    height: this.openedHeight + 'px',
                    display: 'block'
                };
            }
            var isOpen = $(this.element).hasClass('ng-open');
            // If closedWidth > 0 (meaning the default CSS doesn't work correctly)
            // AND the drawer is not currently open
            //     OR this is the first time through
            //        AND it is not initially open
            if (!this.vertical &&
                this.options.closedWidth > 0 &&
                (!isOpen ||
                (isInitial && !this.options.initiallyOpen))) {
                    var widthDelta = this.openedWidth - this.options.closedWidth;
                    cssAttrs.transform = 'translateX(' + widthDelta + 'px)';
            } else if (this.vertical &&
                this.options.closedHeight > 0 &&
                (!isOpen ||
                (isInitial && !this.options.initiallyOpen))) {
                    var heightDelta = this.openedHeight - this.options.closedHeight;
                    cssAttrs.transform = 'translateX(' + heightDelta + 'px)';
            } else {
                cssAttrs.transform = '';
            }
            $(this.element).css(cssAttrs);
        }
    });
    NG.component('drawertrigger', {
        defaults: {
            target: '', // an anchor's href attribute will set this if not set explicitly
            action: 'toggle' // choices: open, close, toggle
        },
        init: function() {
            var $this   = this,
                $element = $(this.element);

            if ($element.is('a') && this.options.target === '') {
                this.options.target = $element.attr("href");
            }
            this.target = $(this.options.target);
            this.on("click", function(e) {
                e.preventDefault();
                $this.target.trigger('ng-' + $this.options.action);
            });
        }
    });
    $(document).ready(function() {
        $("[data-ng-drawer]").each(function() {
            var ele = $(this);

            if (!ele.data("drawer")) {
                var opts = NG.Utils.options(ele.attr("data-ng-drawer"));
                var obj = NG.drawer(ele, opts);
                if (opts.initiallyOpen) {
                    obj.trigger('ng-open');
                }
            }
        });
        $("[data-ng-drawertrigger]").each(function() {
            var ele = $(this);

            if (!ele.data("drawertrigger")) {
                var obj = NG.drawertrigger(ele, NG.Utils.options(ele.attr("data-ng-drawertrigger")));
            }
        });
    });

});


/* Based off of UIKit's Toggle */

(function(global, $, NG){

    NG.component('accordion', {

        defaults: {
            target: false,
            siblings: false,
            cls: 'ng-hidden',
            disabled: false
        },

        init: function() {

            var $this = this,
                $element = $(this.element),
                $clickableElment = $(this.element).find(".ng-accordion-header");

            this.totoggle = this.options.target ? $(this.options.target):[];
            this.disabled = this.options.disabled;
            this.clickableElment  = $clickableElment.on("click", function(e) {
                $this.toggle();
            }).on('ng-close', function(e) {
                e.preventDefault();
                $this.close();
            }).on('ng-open', function(e) {
                e.preventDefault();
                $this.open();
            });

            this.element.data("accordion", this);
        },
        open: function() {
            var $this = this;
            if (this.disabled) return;
            if(!this.totoggle.length) return;
            $(this.totoggle).css({'overflow': 'hidden', height: 'auto', display: 'block', visibility: 'visible'});
            this.totoggle.removeClass($this.options.cls);
            var hgt = getHeight(this.totoggle);
            $(this.totoggle).css({'overflow': 'hidden', height: 0, display: 'block', visibility: 'visible'});
            $(this.totoggle).stop().animate({height: hgt}, function() {
                $($this.element).addClass("ng-open");
                $($this.totoggle).css({'overflow': 'auto'});
                $($this.totoggle).css({'height': 'auto'});
            });
        },
        close: function() {
            var $this = this;
            if (this.disabled) return;
            if(!this.totoggle.length) return;
            $(this.totoggle).stop().animate({height: 0}, function() {
                $($this.element).removeClass("ng-open");
                $this.totoggle.addClass($this.options.cls);
            });
        },
        disable: function() {
            this.disabled = true;
            $(this.element).addClass('ng-disabled');
        },
        enable: function() {
            this.disabled = false;
            $(this.element).removeClass('ng-disabled');
        },
        toggle: function() {
            var $this = this;
            if (this.disabled) return;
            if(!this.totoggle.length) return;

            if (this.options.siblings){
                this.options.siblings.each(function(){
                    if ($(this).hasClass("ng-open")) $(this).trigger("ng-close");
                });
            }
            if($(this.element).hasClass("ng-open")){
                this.close();
            } else {
                this.open();
            }

            if(this.options.cls == 'ng-hidden') {
                $(document).trigger("ng.check.display");
            }
        }
    });

    function getHeight(ele) {
        var $ele = $(ele), height = "auto";

        if ($ele.is(":visible")) {
            height = $ele.outerHeight();
        } else {
            var tmp = {
                position: $ele.css("position"),
                visibility: $ele.css("visibility"),
                display: $ele.css("display")
                // height: $ele.css("height")
            };
            var isHidden = $ele.hasClass('ng-hidden');
            $ele.removeClass('ng-hidden');
            height = $ele.css({position: 'absolute', visibility: 'hidden', display: 'block', height: 'auto'}).outerHeight();
            if(isHidden){
                $ele.addClass('ng-hidden');
            }
            $ele.css(tmp); // reset element
        }

        return height;
    }

    NG.ready(function(context) {

        $("[data-ng-accordion-radio]", context).each(function() {
            var parent = $(this);

            parent.find("[data-ng-accordion]").each(function() {
                var ele = $(this);

                if (!ele.data("accordion")) {
                    var opts = NG.Utils.options(ele.attr("data-ng-accordion"));
                    opts.siblings = parent.find("[data-ng-accordion]").not(ele);

                    var obj = NG.accordion(ele, opts);
                }
            });
        });
        $("[data-ng-accordion]", context).each(function() {
            var ele = $(this);

            if (!ele.data("accordion")) {
               var obj = NG.accordion(ele, NG.Utils.options(ele.attr("data-ng-accordion")));
            }
        });

    });

})(this, jQuery, jQuery.NGkit);

jQuery(function(){
    var hash = location.hash.substr(1);
    console.log("In hash...");
    if(hash && hash == "contact"){
        console.log("found hash...");
        var target = jQuery("[name='contact']").closest(".ng-accordion-large");
        console.log("found target...", target);
        setTimeout(function(){
            $(target).click();
        },350);
    }
});


/* Based on http://www.baijs.com/tinycarousel */

(function(addon) {

    var component;

    if (jQuery && jQuery.NGkit) {
        component = addon(jQuery, jQuery.NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-carousel", ["ngkit"], function(){
            return component || addon(jQuery, jQuery.NGkit);
        });
    }

})(function($, NG) {

    "use strict";

    NG.component('carousel', {

        defaults: {
            start:          0,      // The starting slide
            axis:           "x",    // vertical or horizontal scroller? ( x || y ).
            buttons:        true,   // show left and right navigation buttons.
            bullets:        true,   // is there a page number navigation present?
            interval:       true,   // move to another block on intervals.
            intervalTime:   5000,   // interval time in milliseconds.
            animation:      true,   // false is instant, true is animate.
            animationTime:  500,    // how fast must the animation move in ms?
            infinite:       true,   // infinite carousel.
            viewportSelector: ".viewport:first",
            overviewSelector: ".overview:first",
            nextSelector:   ".next:first",
            prevSelector:   ".prev:first",
            bulletSelector: ".pager > li > a"
        },

        init: function() {
            var $container = this.element,
                $this = this;
            this.viewport = $container.find(this.options.viewportSelector);
            this.overview = $container.find(this.options.overviewSelector);
            this.next     = $container.on("click", this.options.nextSelector, function(e) {
                e.preventDefault();
                this.move(++this.slideIndex);
            });
            this.prev     = $container.on("click", this.options.prevSelector, function(e) {
                e.preventDefault();
                this.move(--this.slideIndex);
            });
            this.bullets  = $container.find(this.options.bulletSelector);

            this.slides        = 0;
            this.viewportSize  = 0;
            this.contentStyle  = {};
            this.slidesVisible = 0;
            this.slideSize     = 0;
            this.slideIndex    = 0;
            this.isHorizontal  = this.options.axis === 'x';
            this.sizeLabel     = this.isHorizontal ? "Width" : "Height";
            this.posiLabel     = this.isHorizontal ? "left" : "top";
            this.intervalTimer = null;
            this.slideCurrent  = 0;
            this.slidesTotal   = 0;

            this.update();
            this.move(this.slideCurrent);


            // $(window).resize(this.update);

            if(this.options.bullets) {
                this.bullets.click(function(e){
                    e.preventDefault();
                    $this.stop();
                    $this.move(parseInt($(this).attr("rel"), 10) - 1);
                });
            }
            this.start();
        },

        update: function(e) {
            // this.overview.find(".mirrored").remove();
            if (typeof(this.overview) == "undefined") {
                console.log(this);
            }
            this.slides        = this.overview.children();
            this.viewportSize  = this.viewport[0]["offset" + this.sizeLabel];
            this.slideSize     = this.slides.first()["outer" + this.sizeLabel](true);
            this.slidesTotal   = this.slides.length;
            this.slideCurrent  = this.options.start || 0;
            this.slidesVisible = Math.ceil(this.viewportSize / this.slideSize);

            this.overview.append(this.slides.slice(0, this.slidesVisible).clone().addClass("mirrored"));
            this.overview.css(this.sizeLabel.toLowerCase(), this.slideSize * (this.slidesTotal + this.slidesVisible));

            return this;
        },

        start: function() {
            if(this.options.interval) {
                var $this = this;
                clearInterval(this.intervalTimer);

                this.intervalTimer = setInterval(function() {
                    $this.move(++$this.slideIndex);
                }, this.options.intervalTime);
            }

            return this;
        },

        stop: function() {
            clearInterval(this.intervalTimer);
            return this;
        },

        move: function(index) {
            var $this = this;
            this.slideIndex   = index;
            this.slideCurrent = this.slideIndex % this.slidesTotal;

            if(this.slideIndex < 0) {
                this.slideCurrent = this.slideIndex = this.slidesTotal - 1;
                this.overview.css(this.posiLabel, -(this.slidesTotal) * this.slideSize);
            }

            if(this.slideIndex > this.slidesTotal) {
                this.slideCurrent = this.slideIndex = 1;
                this.overview.css(this.posiLabel, 0);
            }

            this.contentStyle[this.posiLabel] = -this.slideIndex * this.slideSize;

            this.overview.animate(
                this.contentStyle,
                {
                    queue    : false,
                    duration : this.options.animation ? this.options.animationTime : 0,
                    always : function() {
                        $this.trigger("move", [$this.slides[$this.slideCurrent], $this.slideCurrent]);
                    }
            });

            this.setButtons();
            //this.start();

            return this;
        },

        setButtons: function() {
            if(this.options.buttons && !this.options.infinite) {
                this.prev.toggleClass("disable", this.slideCurrent <= 0);
                this.next.toggleClass("disable", this.slideCurrent >= this.slidesTotal - this.slidesVisible);
            }

            if(this.options.bullets) {
                this.bullets.removeClass("ng-active");
                $(this.bullets[this.slideCurrent]).addClass("ng-active");
            }
        }
    });

    NG.ready(function(context) {
        $("[data-ng-carousel]", context).each(function() {
            var obj;
            if (!$(this).data("carousel")) {
                obj = NG.carousel($(this), NG.Utils.options($(this).attr("data-ng-carousel")));
            }
        });
    });
});


/* Based off of autocomplete, instead of putting results in a dropdown,
   it puts them into a panel
*/
(function(addon) {

    if (typeof define == "function" && define.amd) { // AMD
        define("ngkit-filter", ["ngkit"], function(){
            return jQuery.NGkit.filter || addon(window, window.jQuery, window.jQuery.NGkit);
        });
    }

    if(window && window.jQuery && window.jQuery.NGkit) {
        addon(window, window.jQuery, window.jQuery.NGkit);
    }

})(function(global, $, NG){

    var Filter = function(element, options) {

        var $this = this, $element = $(element);

        if($element.data("filter")) return;

        this.options = $.extend({}, Filter.defaults, options);
        this.element = $element;

        this.filterTarget = $element.find('.ng-filter-target');
        this.template = $element.find('script[type="text/filter"]').html();
        this.template = NG.Utils.template(this.template || this.options.template);
        this.input    = $element.find("input:first").attr("filter", "off");
        this.filterPicker = $element.find('.ng-filter-picker');

        this.element.data("filter", this);

        if (!this.filterTarget.length) {
           this.filterTarget = $('<div class="ng-panel ng-scrollable-box ng-filter-target"></div>').appendTo($element);
        }

        this.init();
    };

    $.extend(Filter.prototype, {

        value    : null,
        selected : null,

        init: function() {

            var $this   = this,
                select  = true,
                trigger = NG.Utils.debounce(function(e) {
                    if(select) {
                        return (select = false);
                    }
                    $this.trigger();
                }, this.options.delay);

            this.input.on({
                "keyup": trigger
            });

            this.filterPicker.on("click", "a", function(){
                $this.select($(this));
            });

            this.request();
        },

        trigger: function() {

            var $this = this, old = this.value;

            this.value = this.input.val();
            if (this.value.length === 0) {
                $this.request();
            }
            if (this.value.length < this.options.minLength) return this;

            if (this.value != old) {
                $this.request();
            }

            return this;
        },


        select: function(item) {
            var data = item.data();

            this.element.trigger("filter-select", [data, this]);

            if (data.value) {
                this.input.val(data.value);
            }

            this.trigger();
        },

        request: function() {

            var $this   = this,
                release = function(data) {

                    if(data) {
                        $this.render(data);
                    }

                    $this.element.removeClass($this.options.loadingClass);
                };

            this.element.addClass(this.options.loadingClass);

            if (this.options.source) {

                var source = this.options.source;

                switch(typeof(this.options.source)) {
                    case 'function':

                        this.options.source.apply(this, [release]);

                        break;

                    case 'object':

                        if(source.length) {

                            var items = [];

                            source.forEach(function(item){
                                var searchvalue = $this.value || "";
                                if(item.value && item.value.toLowerCase().indexOf(searchvalue.toLowerCase())!=-1) {
                                    items.push(item);
                                }
                            });

                            release(items);
                        }

                        break;

                    case 'string':

                        var params ={};

                        params[this.options.param] = this.value;

                        $.ajax({
                            url: this.options.source,
                            data: params,
                            type: this.options.method,
                            dataType: 'json',
                            complete: function(xhr) {
                                release(xhr.responseJSON || $.parseJSON(xhr.responseText) || []);
                            }
                        });

                        break;

                    default:
                        release(null);
                }

            } else {
                this.element.removeClass($this.options.loadingClass);
            }
        },

        render: function(data) {

            var $this = this;

            this.filterTarget.empty();

            if (this.options.renderer) {

                this.options.renderer.apply(this, [data]);

            } else {

                this.filterTarget.append(this.template({"items":data}));
            }

            return this;
        }
    });

    Filter.defaults = {
        minLength: 1,
        param: 'search',
        method: 'get',
        delay: 300,
        loadingClass: 'ng-loading',
        source: null,
        renderer: null,

        // template

        template :['<ul class="ng-list ng-list-striped ng-filter-results">',
                   '    {{#items && items.length}}',
                   '        {{~items}}',
                   '            <li data-value="{{$item.value}}">',
                   '                <a href="{{$item.html_url}}">{{$item.value}}</a>',
                   '            </li>',
                   '        {{/items}}',
                   '    {{/end}}',
                   '    {{^items.length}}',
                   '        <li>No results found.</li>',
                   '    {{/items.length}}',
                   '</ul>'].join('\n')
    };

    NG["filter"] = Filter;

    // init code
    NG.ready(function(context) {
        $("[data-ng-filter]", context).each(function() {
            var ele = $(this);
            if (!ele.data("filter")) {
                var obj = new Filter(ele, NG.Utils.options(ele.attr("data-ng-filter")));
            }
        });
    });

    return Filter;
});


(function(global, $, NG){

    var FacetValue = function(element, filter, options) {
        // This is a value within a facet
        var $this = this, $element = $(element);
        if($element.data("facetvalue")) return;

        this.options  = $.extend({}, FacetValue.defaults, options);
        this.filter = filter;
        this.inputId = $element.data("input-id");
        this.inputName = $element.data("input-name");
        this.inputValue = $element.data("input-value");
        this.value = $($element.find('a')[0].lastChild).text();
        this.element  = $element.on("click", function(e) {
            e.preventDefault();
            var disabled = $element.data("input-disabled");
            if(disabled) return;
            $this.hide(e);
        });
        this.element.data("facetvalue", this);
    };
    FacetValue.defaults = {
        cls: 'ng-hidden',
        submitOnChange: true
    };
    $.extend(FacetValue.prototype, {
        show: function(e) {
            $(this.element[0]).removeClass(this.options.cls);
            if (this.filter.form) {
                $("#" + this.inputId).remove();
                $.event.trigger({
                    type:"ng.facetfilter.change",
                    message: "showing " + this.element[0],
                    time: new Date(),
                    form: this.filter.form});
                if (this.options.submitOnChange) this.filter.form.submit();
            }
        },

        hide: function(e) {
            this.filter.addValue(this);
            $(this.element[0]).addClass(this.options.cls);
            if (this.filter.form) {
                var html = $('<input id="' + this.inputId + '" name="' +
                    this.inputName + '" value="' + this.inputValue + '" type="hidden" />');
                this.filter.form.append(html);
                $.event.trigger({
                    type:"ng.facetfilter.change",
                    message: "hiding " + this.element[0],
                    time: new Date(),
                    form: this.filter.form});
                if (this.options.submitOnChange) this.filter.form.submit();
            }
        }
    });

    var FacetSelectedValue = function(element, original, options) {
        // Created when a FacetValue is clicked on
        var $this = this, $element = $(element);

        if($element.data("facetselectedvalue")) return;

        this.options  = $.extend({}, FacetValue.defaults, options);
        this.original = original;
        this.element  = $element.on("click", function(e) {
            e.preventDefault();
            $this.hide(e);
        });
        this.element.data("facetselectedvalue", this);
    };
    FacetSelectedValue.defaults = {
    };
    $.extend(FacetSelectedValue.prototype, {
        hide: function(e) {
            this.original.show(e);
            this.element.remove();
        }
    });

    var FacetFilter = function(element, options) {
        var $this = this, $element = $(element);
        if($element.data("facetfilter")) return;

        this.options  = $.extend({}, FacetFilter.defaults, options);
        this.currentFilters = $element.find(".ng-current-filters");
        this.form = $(this.options.formtarget);
        this.element = $element;
        this.element.data("facetfilter", this);
    };

    $.extend(FacetFilter.prototype, {
        addValue: function(obj) {
            var html_str = '<span class="ng-selected-facet" data-ng-original-id="facet_' +
                            obj.inputId + '">' +
                           '<a data-input-id="' + obj.inputId + '" data-input-name="' +
                           obj.inputName + '" data-input-value="' + obj.inputValue +
                           '" class="ng-pill-button ng-button-primary" href="">' +
                           '<i class="ng-icon-times"></i> ' + obj.value +
                           '</a></span>';
            var html = $(html_str);
            var selectedValue = this.currentFilters.append(html);
            var fsv = new FacetSelectedValue(html[0], obj);
        }
    });

    FacetFilter.defaults = {
        target: '.ng-facet-filter',
        siblings: false,
        cls: 'ng-hidden',
        formtarget: '#filterform'
    };

    var initializeFacetFilter = function() {
        var ele = $(this), filter, obj;
        if (!ele.data("facetfilter")) {
            filter = new FacetFilter(ele, NG.Utils.options(ele.attr("data-ng-facetfilter")));
        } else {
            filter = ele.data("facetfilter");
        }

        $.each(ele.find('.ng-facet-value'), function(index, item){
            if (!$(item).data("facetvalue")) {
                obj = new FacetValue($(item), filter, NG.Utils.options(ele.attr("data-ng-facetfilter")));
            }
        });

        $.each(ele.find('.ng-selected-facet'), function(index, item){
            if (!$(item).data("facetselectedvalue")) {
                var orig_selector = "#" + $(item).attr('data-ng-original-id');
                obj = new FacetSelectedValue(
                    $(item),
                    $(orig_selector).data('facetvalue'),
                    NG.Utils.options(ele.attr("data-ng-facetfilter")));
            }
        });
    };

    NG["facetfilter"] = FacetFilter;
    NG["facetfilterinitialize"] = initializeFacetFilter;

    NG.ready(function(context) {

        $("[data-ng-facetfilter]", context).each(initializeFacetFilter);

    });

})(this, jQuery, jQuery.NGkit);


(function($, NG, $win) {
    'use strict';

    var Popover = function(element, options) {
        this.options =
            this.enabled =
            this.timeout =
            this.hoverState =
            this.element = null;

        this.init(element, options);
    };

    Popover.defaults = {
        animation: true,
        placement: 'auto right',
        markup: '<div class="ng-popover"><div class="ng-arrow"></div><a href="#" class="ng-close ng-float-right"></a><div class="ng-popover-content"></div></div>',
        contentTarget: '.ng-popover-content',
        template: '{{value}}',
        source: '',
        param: '',
        value: '',
        datatype: 'json',
        trigger: 'hover focus',
        delay: 0,
        container: false,
        renderer: false,
        viewport: {
            selector: 'body',
            padding: 0
        }
    };

    $.extend(Popover.prototype, {
        init: function(element, options) {
            this.element = $(element);
            this.enabled = true;
            this.options = this.getOptions(options);
            this.$viewport = this.options.viewport && $(this.options.viewport.selector || this.options.viewport);
            var triggers = this.options.trigger.split(' ');

            for (var i = triggers.length; i--;) {
                var trigger = triggers[i];

                if (trigger == 'click' || NG.support.touch) {
                    this.element.on('click.popover.ngkit', $.proxy(this.toggle, this));
                } else if (trigger != 'manual') {
                    var eventIn = trigger == 'hover' ? 'mouseenter' : 'focusin';
                    var eventOut = trigger == 'hover' ? 'mouseleave' : 'focusout';

                    this.element.on(eventIn + '.popover.ngkit', $.proxy(this.enter, this));
                    this.element.on(eventOut + '.popover.ngkit', $.proxy(this.leave, this));
                }
                this.element.on('show.popover.ngkit', $.proxy(this.enter, this));
                this.element.on('hide.popover.ngkit', $.proxy(this.leave, this));
            }
            // If the template is an ID selector, get it
            if (this.options.template.length && this.options.template[0] === '#') {
                this.template = NG.Utils.template($(this.options.template).html());
            } else {
                this.template = NG.Utils.template(this.options.template);
            }

            this.element.data('popover', this);
        },

        getDefaults: function() {
            return Popover.defaults;
        },

        getOptions: function(options) {
            options = $.extend({}, this.getDefaults(), this.element.data(), options);

            if (options.delay && typeof options.delay == 'number') {
                options.delay = {
                    show: options.delay,
                    hide: options.delay
                };
            }

            return options;
        },

        enter: function(obj) {
            var self = null;
            if (obj instanceof this.constructor) {
                self = obj;
            } else {
                self = $(obj.currentTarget).data('popover');
            }

            clearTimeout(self.timeout);

            self.hoverState = 'in';

            if (!self.options.delay || !self.options.delay.show) return self.show();

            self.timeout = setTimeout(function() {
                if (self.hoverState == 'in') self.show();
            }, self.options.delay.show);
        },

        leave: function(obj) {
            var self = null;
            if (obj instanceof this.constructor) {
                self = obj;
            } else {
                self = $(obj.currentTarget).data('popover');
            }

            clearTimeout(self.timeout);

            self.hoverState = 'out';

            if (!self.options.delay || !self.options.delay.hide) return self.hide();

            self.timeout = setTimeout(function() {
                if (self.hoverState == 'out') self.hide();
            }, self.options.delay.hide);
        },

        show: function() {
            // var e = $.Event('show.popover.ngkit'),
                var $this = this;
            if (this.hasContent() && this.enabled) {
                this.element.trigger("show:ngkit:popover");

                // if (e.isDefaultPrevented()) return;

                var $popover = this.popover();

                this.setContent();

                if (this.options.animation) $popover.addClass('fade');

                $popover
                    .detach()
                    .css({
                        top: 0,
                        left: 0,
                        display: 'block'
                    });

                if (this.options.container) {
                    $popover.appendTo(this.options.container);
                } else {
                    $popover.insertAfter(this.element);
                }
                this.position();
                this.registerOuterClick();

                $popover.on('click', '.ng-close', function(e) {
                    var $target = $(e.target);
                    if ($target.is("a[href='#']") || $target.parent().is("a[href='#']")){
                        e.preventDefault();
                    }
                    $this.hide();
                });

            }
        },
        registerOuterClick: function(){

            var $this = this;

            $(document).off("click.outer.popover");

            setTimeout(function() {
                $(document).on("click.outer.popover", function(e) {

                    if (hoverIdle) {
                        clearTimeout(hoverIdle);
                    }

                    var $target = $(e.target);

                    if (active && active[0] == $this.element[0] && ($target.is("a:not(.js-ng-prevent)") || $target.is(".ng-popover-close") || !$this.popovermenu.find(e.target).length)) {
                        active.removeClass("ng-open");
                        $(document).off("click.outer.popover");
                    }
                });
            }, 10);
        },
        hide: function() {
            var that = this;
            var $popover = this.popover();
            // var e = $.Event('hide.popover.ngkit');

            function complete() {
                if (that.hoverState != 'in') $popover.detach();
                // that.element.trigger('hide.popover.ngkit');
            }

            // this.element.trigger(e);

            // if (e.isDefaultPrevented()) return;

            $popover.removeClass('in');

            if ($.support.transition && this.$popover.hasClass('fade')) {
                $popover
                    .one($.support.transition.end, complete)
                    .emulateTransitionEnd(150);
            } else {
                complete();
            }

            this.hoverState = null;

            return this;
        },

        position: function() {
            var that = this;
            var pos = this.getPosition();
            var $popover = this.popover();
            var actualWidth = $popover[0].offsetWidth;
            var actualHeight = $popover[0].offsetHeight;
            var placement = typeof this.options.placement == 'function' ?
                this.options.placement.call(this, $popover[0], this.element[0]) :
                this.options.placement;

            var autoToken = /\s?auto?\s?/i;
            var autoPlace = autoToken.test(placement);
            if (autoPlace) placement = placement.replace(autoToken, '') || 'top';

            if (autoPlace) {
                var orgPlacement = placement;
                var $parent = this.element.parent();
                var parentDim = this.getPosition($parent);
                placement = placement == 'bottom' && pos.top + pos.height + actualHeight - parentDim.scroll > parentDim.height ? 'top' :
                    placement == 'top' && pos.top - parentDim.scroll - actualHeight < 0 ? 'bottom' :
                    placement == 'right' && pos.right + actualWidth > parentDim.right ? 'left' :
                    placement == 'left' && pos.left - actualWidth < parentDim.left ? 'right' :
                    placement;
            }
            $popover.addClass(placement);

            var calculatedOffset = this.getCalculatedOffset(placement, pos, actualWidth, actualHeight);

            this.applyPlacement(calculatedOffset, placement);
            this.hoverState = null;

            var complete = function() {
                that.element.trigger('shown.popover.ngkit');
            };

            if ($.support.transition && this.$popover.hasClass('fade')) {
                $popover
                    .one($.support.transition.end, complete)
                    .emulateTransitionEnd(150);
            } else {
                complete();
            }

        },

        applyPlacement: function(offset, placement) {
            var $popover = this.popover();
            var width = $popover[0].offsetWidth;
            var height = $popover[0].offsetHeight;

            // manually read margins because getBoundingClientRect includes difference
            var marginTop = parseInt($popover.css('margin-top'), 10);
            var marginLeft = parseInt($popover.css('margin-left'), 10);

            // we must check for NaN for ie 8/9
            if (isNaN(marginTop)) marginTop = 0;
            if (isNaN(marginLeft)) marginLeft = 0;

            offset.top = offset.top + marginTop;
            offset.left = offset.left + marginLeft;

            // $.fn.offset doesn't round pixel values
            // so we use setOffset directly with our own function B-0
            $.offset.setOffset($popover[0], $.extend({
                using: function(props) {
                    $popover.css({
                        top: Math.round(props.top),
                        left: Math.round(props.left)
                    });
                }
            }, offset), 0);

            $popover.addClass('in');

            // check to see if placing popover in new offset caused the popover to resize itself
            var actualWidth = $popover[0].offsetWidth;
            var actualHeight = $popover[0].offsetHeight;

            if (placement == 'top' && actualHeight != height) {
                offset.top = offset.top + height - actualHeight;
            }

            var delta = this.getViewportAdjustedDelta(placement, offset, actualWidth, actualHeight);
            if (delta.left) offset.left += delta.left;
            else offset.top += delta.top;

            var arrowDelta = delta.left ? delta.left * 2 - width + actualWidth : delta.top * 2 - height + actualHeight;
            var arrowPosition = delta.left ? 'left' : 'top';
            var arrowOffsetPosition = delta.left ? 'offsetWidth' : 'offsetHeight';

            $popover.offset(offset);
            this.replaceArrow(arrowDelta, $popover[0][arrowOffsetPosition], arrowPosition);
        },

        replaceArrow: function(delta, dimension, position) {
            this.arrow().css(position, delta ? (50 * (1 - delta / dimension) + '%') : '');
        },

        setContent: function() {
            var $popover = this.popover();
            var value = this.getValue();
            $popover.find(this.options.contentTarget)['html'](value);
            $popover.removeClass('fade in top bottom left right');
        },

        hasContent: function() {
            return this.getValue();
        },

        getPosition: function($element) {
            $element = $element || this.element;
            var el = $element[0];
            var isBody = el.tagName == 'BODY';
            var clientRect = (typeof el.getBoundingClientRect == 'function') ? el.getBoundingClientRect() : null;
            return $.extend({}, clientRect, {
                scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.scrollTop(),
                width: isBody ? $(window).width() : $element.outerWidth(),
                height: isBody ? $(window).height() : $element.outerHeight()
            }, isBody ? {
                top: 0,
                left: 0
            } : $element.offset());
        },

        getCalculatedOffset: function(placement, pos, actualWidth, actualHeight) {
            return placement == 'bottom' ? {
                top: pos.top + pos.height,
                left: pos.left + pos.width / 2 - actualWidth / 2
            } :
                placement == 'top' ? {
                    top: pos.top - actualHeight,
                    left: pos.left + pos.width / 2 - actualWidth / 2
            } :
                placement == 'left' ? {
                    top: pos.top + pos.height / 2 - actualHeight / 2,
                    left: pos.left - actualWidth
            } :
            /* placement == 'right' */
            {
                top: pos.top + pos.height / 2 - actualHeight / 2,
                left: pos.left + pos.width
            };

        },

        getViewportAdjustedDelta: function(placement, pos, actualWidth, actualHeight) {
            var delta = {
                top: 0,
                left: 0
            };
            if (!this.$viewport) return delta;

            var viewportPadding = this.options.viewport && this.options.viewport.padding || 0;
            var viewportDimensions = this.getPosition(this.$viewport);

            if (/right|left/.test(placement)) {
                var topEdgeOffset = pos.top - viewportPadding - viewportDimensions.scroll;
                var bottomEdgeOffset = pos.top + viewportPadding - viewportDimensions.scroll + actualHeight;
                if (topEdgeOffset < viewportDimensions.top) { // top overflow
                    delta.top = viewportDimensions.top - topEdgeOffset;
                } else if (bottomEdgeOffset > viewportDimensions.top + viewportDimensions.height) { // bottom overflow
                    delta.top = viewportDimensions.top + viewportDimensions.height - bottomEdgeOffset;
                }
            } else {
                var leftEdgeOffset = pos.left - viewportPadding;
                var rightEdgeOffset = pos.left + viewportPadding + actualWidth;
                if (leftEdgeOffset < viewportDimensions.left) { // left overflow
                    delta.left = viewportDimensions.left - leftEdgeOffset;
                } else if (rightEdgeOffset > viewportDimensions.width) { // right overflow
                    delta.left = viewportDimensions.left + viewportDimensions.width - rightEdgeOffset;
                }
            }

            return delta;
        },

        getValue: function() {
            var $this = this,
                html = '',
                release = function(data) {
                    var html = '';
                    if (data !== null && typeof data !== 'undefined') {
                        if (typeof data == 'object') {
                            html = $this.render(data);
                        } else {
                            html = $this.render({
                                value: data
                            });
                        }
                    }
                    $this.element.removeClass($this.options.loadingClass);
                    return html;
                };

            this.element.addClass(this.options.loadingClass);

            switch (typeof(this.options.source)) {
                case 'function':
                    html = this.options.source.apply(this, [release]);
                    break;

                case 'object':
                    if (this.options.source.length) {
                        var items = [];

                        this.options.source.forEach(function(item) {
                            var searchvalue = $this.options.value || "";
                            if (item.value && item.value.toLowerCase().indexOf(searchvalue.toLowerCase()) != -1) {
                                items.push(item);
                                return false;
                            }
                        });

                        html = release(items[0]);
                    }
                    break;

                case 'string':
                    if (!this.options.source.length) {
                        html = release(this.options.value);
                        break;
                    }
                    var params = {};

                    params[this.options.param] = this.options.value;

                    $.ajax({
                        url: this.options.source,
                        data: params,
                        type: this.options.method,
                        dataType: this.options.datatype,
                        complete: function(xhr) {
                            var result = release(xhr.responseJSON || []);
                            $this.popover().find($this.options.contentTarget)['html'](result);
                            $this.position();
                        }
                    });
                    html = "Loading...";
                    break;

                default:
                    html = release(this.options.value);
            }
            return html;

        },

        render: function(data) {
            var $this = this;
            var html = "";

            if (this.options.renderer) {
                html = this.options.renderer.apply(this, [data]);
            } else {
                html = this.template(data);
            }
            return html;
        },

        popover: function() {
            return this.$popover = this.$popover || $(this.options.markup);
        },

        arrow: function() {
            return this.$arrow = this.$arrow || this.popover().find('.ng-arrow');
        },

        validate: function() {
            if (!this.element[0].parentNode) {
                this.hide();
                this.element = null;
                this.options = null;
            }
        },

        enable: function() {
            this.enabled = true;
        },

        disable: function() {
            this.enabled = false;
        },

        toggleEnabled: function() {
            this.enabled = !this.enabled;
        },

        toggle: function(e) {
            var self = e ? $(e.currentTarget).data('popover') : this;
            if (self.popover().hasClass('in')) {
                self.leave(self);
            } else {
                self.enter(self);
            }
        },

        destroy: function() {
            clearTimeout(this.timeout);
            this.hide().element.off('.' + this.type).removeData('popover');
        }
    });

    NG["popover"] = Popover;
    // init code
    NG.$doc.on("mouseenter.popover.ngkit focus.popover.ngkit", "[data-ng-popover]", function(e) {
        var ele = $(this);

        if (!ele.data("popover")) {
            var obj = new Popover(ele, NG.Utils.options(ele.attr("data-ng-popover")));
            ele.trigger("mouseenter");
        }
    });

})(jQuery, jQuery.NGkit, jQuery(window));


(function($, NG){

    "use strict";

    var Definition = function(element, options) {
        var $this = this,
            $element = $(element),
            widget;

        if($element.data("definition")) return;

        this.options = options;
        this.element = $element;
        this.word = $element.text().toLowerCase();
        this.options.value = this.word;
        this.element.data("definition", this);
        
        // For mobile sizes, load up a Modal Dialogue, else load up a popover.
        if (NG.$win.width() < 768) {
            $element.click(function() {

                var modal_template = '<a class="ng-modal-close ng-close ng-float-right" href="#"></a>' +
                                     '<div class="ng-modal-content ng-margin-remove">' +  
                                        '<p><span class="ng-text-bold">{{value}}</span> {{ phonetic }}</p>' +
                                        '<hr class="ng-hr ng-hr-small">' +
                                        '<p class="ng-text-italic ng-margin-bottom-remove">{{ partofspeech }}</p>' +
                                        '<p class="ng-margin-top-remove">{{{ definition }}}</p>' +
                                        '{{#encyclopedia}}' +
                                        '<hr class="ng-hr ng-hr-small">' +
                                        '<p>Read more in the <a href="{{{ encyclopedia }}}">NG Education Encyclopedia <i class="ng-icon-angle-double-right"></i></a></p>' +
                                        '{{/encyclopedia}}' +
                                     '</div>';
                
                
                options = NG.$.extend(true, {bgclose:false, keyboard:false, modal:false, labels:NG.modal.labels}, options);
                
                // This gets the right layout and look but has no content.
                var ng_template = NG.Utils.template(modal_template);
                
                // The clicked "word", for which we need to find the definition, word-type, etc...
                var word = $element.text().toLowerCase();
                if (options.source.length) {
                    var items = [];
                    // look through all option key/pairs for the one that matches this word.
                    options.source.forEach(function(item) {
                        var searchvalue = word || "";
                        if (item.value && item.value.toLowerCase().indexOf(searchvalue.toLowerCase()) != -1) {
                            items.push(item);
                            return false;
                        }
                    });
                    // render template w/ found context + show the modal result.
                    var html = ng_template(items[0]);
                    widget = NG.modal.dialog(html, options);
                    widget.show();
                }
            });
        } else {
            widget = new NG['popover']($element, options);    
        }
    };

    Definition.defaults = {
        selector: ".tipHelp",
        placement: 'auto top',
        trigger: 'click',
        source: null,
        template: '<a class="ng-close" href="#"></a><div class="ng-panel" style="min-width: 200px">' +
            '<p><span class="ng-text-bold">{{value}}</span> {{ phonetic }}</p>' +
            '<hr class="ng-hr ng-hr-small">' +
            '<p class="ng-text-italic ng-margin-bottom-remove">{{ partofspeech }}</p>' +
            '<p class="ng-margin-top-remove">{{{ definition }}}</p>' +
            '{{#encyclopedia}}' +
            '<hr class="ng-hr ng-hr-small">' +
            '<p>Read more in the <a href="{{{ encyclopedia }}}">NG Education Encyclopedia <i class="ng-icon-angle-double-right"></i></a></p>' +
            '{{/encyclopedia}}' +
            '</div>'
    };

    Definition.initialize = function(options) {
        var localoptions = $.extend({}, Definition.defaults, options);
        $(localoptions.selector).each(function() {
            var $this = $(this), obj;

            $.each($this, function(index, item){
                if (!$(item).data("definition")) {
                    obj = new Definition($(item), localoptions);
                }
            });
        });
    };

    NG["definition"] = Definition;

})(jQuery, jQuery.NGkit);



(function(global, $, NG){

    var Switch = function(element, options) {

        var $this = this, $element = $(element);

        if($element.data("switch")) return;
        this.options  = $.extend({}, Switch.defaults, options);
        if (this.options.target[0] == "#") {
            this.toswitch = $(this.options.target);
            this.toswitch.on("click", function() {$this.syncWithInput();});
        } else {
            this.toswitch = $element.find(this.options.target);
        }
        this.element  = $element.on("click", function(e) {
            e.preventDefault();
            $this.toggle();
        });

        this.element.data("switch", this);
        this.syncWithInput();
    };

    $.extend(Switch.prototype, {
        syncWithInput: function(){
            if(!this.toswitch.length) return;

            this.element.removeClass(this.options.onClass + " " + this.options.offClass);
            if (this.toswitch.prop("checked")) {
                this.element.addClass(this.options.onClass);
            } else {
                this.element.addClass(this.options.offClass);
            }
        },

        toggle: function() {
            this.element.toggleClass(this.options.onClass);
            this.element.toggleClass(this.options.offClass);
            if(this.toswitch.length) {
                this.toswitch.prop("checked", !this.toswitch.prop("checked"));
            }
        }
    });

    Switch.defaults = {
        target: '> input',
        onClass: 'ng-on',
        offClass: 'ng-off'
    };

    NG["switch"] = Switch;

    NG.ready(function(context) {

        $("[data-ng-switch]", context).each(function() {
            var ele = $(this);

            if (!ele.data("switch")) {
               var obj = new Switch(ele, NG.Utils.options(ele.attr("data-ng-switch")));
            }
        });
    });

})(this, jQuery, jQuery.NGkit);


(function(addon) {

    var component;

    if (jQuery && jQuery.NGkit) {
        component = addon(jQuery, jQuery.NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-tablesort", ["ngkit"], function(){
            return component || addon(jQuery, jQuery.NGkit);
        });
    }

})(function($, NG){

    /**
     * jQuery.fn.sortElements
     * --------------
     * @author James Padolsey (http://james.padolsey.com)
     * @version 0.11
     * @updated 18-MAR-2010
     * --------------
     * @param Function comparator:
     *   Exactly the same behaviour as [1,2,3].sort(comparator)
     *
     * @param Function getSortable
     *   A function that should return the element that is
     *   to be sorted. The comparator will run on the
     *   current collection, but you may want the actual
     *   resulting sort to occur on a parent or another
     *   associated element.
     *
     *   E.g. $('td').sortElements(comparator, function(){
     *      return this.parentNode;
     *   })
     *
     *   The <td>'s parent (<tr>) will be sorted instead
     *   of the <td> itself.
     */

    $.fn.sortElements = (function(){

        var sort = [].sort;

        return function(comparator, getSortable) {

            getSortable = getSortable || function(){return this;};

            var placements = this.map(function(){

                var sortElement = getSortable.call(this),
                    parentNode = sortElement.parentNode,

                    // Since the element itself will change position, we have
                    // to have some way of storing it's original position in
                    // the DOM. The easiest way is to have a 'flag' node:
                    nextSibling = parentNode.insertBefore(
                        document.createTextNode(''),
                        sortElement.nextSibling
                    );

                return function() {

                    if (parentNode === this) {
                        throw new Error(
                            "You can't sort elements if any one is a descendant of another."
                        );
                    }

                    // Insert before flag:
                    parentNode.insertBefore(this, nextSibling);
                    // Remove flag:
                    parentNode.removeChild(nextSibling);

                };

            });

            return sort.call(this, comparator).each(function(i){
                placements[i].call(getSortable.call(this));
            });

        };

    })();

    NG.component('tablesort', {

        defaults: {
            headSelector: '.ng-sortable',
            highlightColumn: true
        },

        // Methods
        init: function() {
            var $this   = this;

            this.element.find(this.options.headSelector).each(function(){
                $(this).click(function(e) {
                    var th = $(this),
                        index = th.index(),
                        sorted = th.hasClass('ng-sorted-desc') || th.hasClass('ng-sorted-asc'),
                        descending = th.hasClass('ng-sorted-desc');

                    $this.element.find($this.options.headSelector).removeClass('ng-sorted-desc ng-sorted-asc');

                    if (sorted) {
                        if (descending){
                            th.addClass('ng-sorted-asc');
                            descending = false;
                        } else {
                            th.addClass('ng-sorted-desc');
                            descending = true;
                        }
                    } else {
                        th.addClass("ng-sorted-asc");
                        descending = false;
                    }
                    if ($this.options.highlightColumn) {
                        $this.element.find('td').removeClass('ng-sorted');
                    }
                    $this.element.find('td').filter(function(){
                        //find the TDs that are the same index as the TH
                        //only return the td's that are indexed the same as one
                        if ($this.options.highlightColumn && $(this).index() === index) {
                            $(this).addClass('ng-sorted');
                        }
                        return $(this).index() === index;

                    }).sortElements(function(a, b){
                        return $.text([a]).toUpperCase() > $.text([b]).toUpperCase() ? descending ? -1 : 1 : descending ? 1 : -1;
                    }, function(){
                        // parentNode is the element we want to move
                        return this.parentNode;
                    });
                });
            });
        }
    });

    // init code
    NG.ready(function(context) {
        $("[data-ng-tablesort]", context).each(function() {
            var ele = $(this);
            if (!ele.data("tablesort")) {
                var obj = NG.tablesort(ele, NG.Utils.options(ele.attr("data-ng-tablesort")));
            }
        });
    });

    return NG.tablesort;
});

/*

Based on CollapsibleLists.js

An object allowing lists to dynamically expand and collapse

Created by Stephen Morley - http://code.stephenmorley.org/ - and released under
the terms of the CC0 1.0 Universal legal code:

http://creativecommons.org/publicdomain/zero/1.0/legalcode

*/


// collapsiblelist
(function(addon) {

    var component;

    if (jQuery && jQuery.NGkit) {
        component = addon(jQuery, jQuery.NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-collapsiblelist", ["ngkit"], function(){
            return component || addon(jQuery, jQuery.NGkit);
        });
    }

})(function($, NG){

    NG.component('collapsiblelist', {

        defaults: {
            recurse: true,

        },

        // Methods
        init: function() {
            var $this   = this;
            this.applyTo(this.element, !this.options.recurse);
        },
        /* Makes the specified list collapsible. The parameters are:
        *
        * node         - the list element
        * doNotRecurse - true if sub-lists should not be made collapsible
        */
        applyTo: function(node, doNotRecurse){
            // loop over the list items within this node
            var lis = node.find('li');
            for (var index = 0; index < lis.length; index ++){

                // check whether this list item should be collapsible
                if (!doNotRecurse || node == lis[index].parentNode){

                    // prevent text from being selected unintentionally
                    if (lis[index].addEventListener){
                        lis[index].addEventListener(
                            'mousedown', function (e){ e.preventDefault(); }, false);
                    } else {
                      lis[index].attachEvent(
                            'onselectstart', function(){ event.returnValue = false; });
                    }

                    // add the click listener
                    if (lis[index].addEventListener){
                        lis[index].addEventListener(
                            'click', this.createClickListener(lis[index]), false);
                    } else {
                        lis[index].attachEvent(
                            'onclick', this.createClickListener(lis[index]));
                    }

                    // close the unordered lists within this list item
                    this.toggle(lis[index]);
                }
            }
        },

        /* Returns a function that toggles the display status of any unordered
         * list elements within the specified node. The parameter is:
         *
         * node - the node containing the unordered list elements
         */
        createClickListener: function(node) {
            var $this = this;

            // return the function
            return function(e){
                // ensure the event object is defined
                if (!e) e = window.event;

                // find the list item containing the target of the event
                var li = (e.target ? e.target : e.srcElement);
                while (li.nodeName != 'LI') li = li.parentNode;

                // toggle the state of the node if it was the target of the event
                if (li == node) $this.toggle(node);

            };
        },

        /* Opens or closes the unordered list elements directly within the
         * specified node. The parameter is:
         *
         * node - the node containing the unordered list elements
         */
        toggle: function(node) {
            // determine whether to open or close the unordered lists
            var open = $(node).hasClass('ng-closed'),
                index, li;

            // loop over the unordered list elements with the node
            var uls = $(node).find('ul,ol');
            for (index = 0; index < uls.length; index ++){
                // find the parent list item of this unordered list
                li = uls[index];
                while (li.nodeName != 'LI') li = li.parentNode;

                // style the unordered list if it is directly within this node
                if (li == node) uls[index].style.display = (open ? 'block' : 'none');
            }
            // remove the current class from the node
            node.className =
                node.className.replace(
                    /(^| )ng-(open|closed)( |$)/, '');

            // if the node contains unordered lists, set its class
            if (uls.length > 0){
                node.className += ' ng-' + (open ? 'open' : 'closed');
            }
        }

    });

    // init code
    NG.ready(function(context) {
        $("[data-ng-collapsiblelist]", context).each(function() {
            var ele = $(this);
            if (!ele.data("collapsiblelist")) {
                var obj = NG.collapsiblelist(ele, NG.Utils.options(ele.attr("data-ng-collapsiblelist")));
            }
        });
    });

    return NG.collapsiblelist;
});

// toolbar
/*
    Two modes: radio (one item is always selected) and momentarypushin (default)
    events:
        element selected
*/
(function(addon) {

    var component;

    if (jQuery && jQuery.NGkit) {
        component = addon(jQuery, jQuery.NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-toolbar", ["ngkit"], function(){
            return component || addon(jQuery, jQuery.NGkit);
        });
    }

})(function($, NG){

    NG.component('toolbar', {

        defaults: {
            selector: '> .ng-toolbar-nav > li',
            mode: 'momentarypushin', // radio or momentarypushin
            initiallySelected: 0    // only valid when mode = 'radio'
        },

        // Attributes/properties

        // Methods
        init: function() {
            var $this   = this;
            this.buttons = this.find(this.options.selector);
            if (this.options.mode == "radio") {
                this.selected = this.options.initiallySelected || 0;
                this.select(this.selected);
            }
            this.element.on('click', this.options.selector, function(e) {
                e.preventDefault();
                if ($this.options.mode == 'radio') {
                    $this.buttons.not(this).removeClass("ng-active").blur();
                    $(this).addClass("ng-active");
                }
                $this.trigger("change", [$(this)]);
            });
        },

        /* Select one of the buttons.
           If mode is radio, sets the selected button
           otherwise acts as a click on the button
        */
        select: function(index) {
            if (this.options.mode == "radio") {
                $(this.buttons).removeClass("ng-active");
                $(this.buttons[index]).addClass("ng-active");
            }
        },
        getSelected: function() {
            return this.find(".ng-active");
        }
    });

    // init code
    NG.ready(function(context) {
        $("[data-ng-toolbar]", context).each(function() {
            var ele = $(this);
            if (!ele.data("toolbar")) {
                var obj = NG.toolbar(ele, NG.Utils.options(ele.attr("data-ng-toolbar")));
            }
        });
    });

    return NG.toolbar;
});

(function(addon) {

    var component;

    if (window.NGkit) {
        component = addon(NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-slideshowcounter", ["ngkit"], function() {
            return component || addon(NGkit);
        });
    }

})(function(NG) {

    "use strict";

    NG.component('slideshowcounter', {

        boot: function() {

            // init code
            NG.ready(function(context) {

                NG.$('[data-ng-slideshowcounter]', context).each(function() {

                    var ele = NG.$(this);

                    if (!ele.data("slideshowcounter")) {
                        var obj = NG.slideshowcounter(ele, NG.Utils.options(ele.attr("data-ng-slideshowcounter")));
                    }
                });
            });
        },

        init: function() {
            
            // Get the actual slideshowcounter dom-element + slideshow Object Component + update the counter display value:
            this.counter = this.element.hasClass('ng-slideshowcounter') ? this.element : NG.$(this.find('.ng-slideshowcounter'));
            var slideshow_obj = this.counter.closest("[data-ng-slideshow]").data("slideshow");
            
            this.counter.html("1 / <span>" + slideshow_obj.slidesCount + "</span>");

        },

    });

    

});



(function($, NG) {

    "use strict";

    var active = false, hoverIdle;

    NG.component('popovermenu', {

        defaults: {
           'mode'       : 'hover',
           'remaintime' : 800,
           'justify'    : false,
           'boundary'   : $(window),
           'delay'      : 0
        },

        remainIdle: false,

        init: function() {

            var $this = this;

            this.popovermenu = this.find(".ng-popovermenu");

            this.centered  = true;
            this.justified = this.options.justify ? $(this.options.justify) : false;

            this.boundary  = $(this.options.boundary);
            this.flipped   = this.popovermenu.hasClass('ng-popovermenu-flip');

            if(!this.boundary.length) {
                this.boundary = $(window);
            }

            if (this.options.mode == "click" || NG.support.touch) {

                this.on("click", function(e) {

                    var $target = $(e.target);

                    if (!$target.parents(".ng-popovermenu").length) {

                        if ($target.is("a[href='#']") || $target.parent().is("a[href='#']")){
                            e.preventDefault();
                        }

                        $target.blur();
                    }

                    if (!$this.element.hasClass("ng-open")) {

                        $this.show();

                    } else {

                        if ($target.is("a:not(.js-ng-prevent)") ||
                            $target.parent().is("a:not(.js-ng-prevent)") ||
                            $target.is(".ng-popovermenu-close") ||
                            !$this.popovermenu.find(e.target).length) {
                                $this.element.removeClass("ng-open");
                                active = false;
                        }
                    }
                });

            } else {

                this.on("mouseenter", function(e) {

                    if ($this.remainIdle) {
                        clearTimeout($this.remainIdle);
                    }

                    if (hoverIdle) {
                        clearTimeout(hoverIdle);
                    }

                    hoverIdle = setTimeout($this.show.bind($this), $this.options.delay);

                }).on("mouseleave", function() {

                    if (hoverIdle) {
                        clearTimeout(hoverIdle);
                    }

                    $this.remainIdle = setTimeout(function() {

                        $this.element.removeClass("ng-open");
                        $this.remainIdle = false;

                        if (active && active[0] == $this.element[0]) active = false;

                    }, $this.options.remaintime);

                }).on("click", function(e){

                    var $target = $(e.target);

                    if ($this.remainIdle) {
                        clearTimeout($this.remainIdle);
                    }

                    if ($target.is("a[href='#']") || $target.parent().is("a[href='#']")){
                        e.preventDefault();
                    }

                    $this.show();
                });
            }
        },

        show: function(){

            if (active && active[0] != this.element[0]) {
                active.removeClass("ng-open");
            }

            if (hoverIdle) {
                clearTimeout(hoverIdle);
            }

            this.checkDimensions();

            this.element.addClass("ng-open");
            this.trigger('ng.popovermenu.show', [this]);
            active = this.element;

            this.registerOuterClick();
        },

        registerOuterClick: function(){

            var $this = this;

            $(document).off("click.outer.popovermenu");

            setTimeout(function() {
                $(document).on("click.outer.popovermenu", function(e) {

                    if (hoverIdle) {
                        clearTimeout(hoverIdle);
                    }

                    var $target = $(e.target);

                    if (active && active[0] == $this.element[0] && ($target.is("a:not(.js-ng-prevent)") || $target.is(".ng-popovermenu-close") || !$this.popovermenu.find(e.target).length)) {
                        active.removeClass("ng-open");
                        $(document).off("click.outer.popovermenu");
                    }
                });
            }, 10);
        },

        checkDimensions: function() {

            if(!this.popovermenu.length) return;

            if (this.justified && this.justified.length) {
                this.popovermenu.css("min-width", "");
            }

            var $this     = this,
                popovermenu  = this.popovermenu.css("margin-" + $.NGkit.langdirection, ""),
                offset    = popovermenu.show().offset(),
                width     = popovermenu.outerWidth(),
                boundarywidth  = this.boundary.width(),
                boundaryoffset = this.boundary.offset() ? this.boundary.offset().left:0;

            // centered popovermenu
            if (this.centered) {
                popovermenu.css("margin-" + $.NGkit.langdirection, (parseFloat(width) / 2 - popovermenu.parent().width() / 2) * -1);
                offset = popovermenu.offset();
                // reset popovermenu
                if ((width + offset.left) > boundarywidth || offset.left < 0) {
                    popovermenu.css("margin-" + $.NGkit.langdirection, "");
                    offset = popovermenu.offset();
                }
            }

            // justify popovermenu
            if (this.justified && this.justified.length) {

                var jwidth = this.justified.outerWidth();

                popovermenu.css("min-width", jwidth);

                if ($.NGkit.langdirection == 'right') {

                    var right1   = boundarywidth - (this.justified.offset().left + jwidth),
                        right2   = boundarywidth - (popovermenu.offset().left + popovermenu.outerWidth());

                    popovermenu.css("margin-right", right1 - right2);

                } else {
                    popovermenu.css("margin-left", this.justified.offset().left - offset.left);
                }

                offset = popovermenu.offset();

            }

            if ((width + (offset.left-boundaryoffset)) > boundarywidth) {
                popovermenu.addClass("ng-popovermenu-flip");
                offset = popovermenu.offset();
            }

            if ((offset.left-boundaryoffset) < 0) {

                popovermenu.addClass("ng-popovermenu-stack");

                if (popovermenu.hasClass("ng-popovermenu-flip")) {

                    if (!this.flipped) {
                        popovermenu.removeClass("ng-popovermenu-flip");
                        offset = popovermenu.offset();
                        popovermenu.addClass("ng-popovermenu-flip");
                    }

                    setTimeout(function(){

                        if ((popovermenu.offset().left-boundaryoffset) < 0 || !$this.flipped && (popovermenu.outerWidth() + (offset.left-boundaryoffset)) < boundarywidth) {
                            popovermenu.removeClass("ng-popovermenu-flip");
                        }
                    }, 0);
                }

                this.trigger('ng.popovermenu.stack', [this]);
            }

            popovermenu.css("display", "");
        }

    });

    var triggerevent = NG.support.touch ? "click" : "mouseenter";

    // init code
    NG.$doc.on(triggerevent+".popovermenu.ngkit", "[data-ng-popovermenu]", function(e) {
        var ele = $(this);

        if (!ele.data("popovermenu")) {

            var popovermenu = NG.popovermenu(ele, NG.Utils.options(ele.data("ng-popovermenu")));

            if (triggerevent=="click" || (triggerevent=="mouseenter" && popovermenu.options.mode=="hover")) {
                popovermenu.element.trigger(triggerevent);
            }

            if(popovermenu.element.find('.ng-popovermenu').length) {
                e.preventDefault();
            }
        }
    });

})(jQuery, jQuery.NGkit);


/*!
 * @preserve
 *
 * Adapted from Readmore.js jQuery plugin
 * Author: @jed_foster
 * Project home: http://jedfoster.github.io/Readmore.js
 * Licensed under the MIT license
 *
 * Debounce function from http://davidwalsh.name/javascript-debounce-function
 */

/* global jQuery */

(function(addon) {

    var component;

    if (jQuery && jQuery.NGkit) {
        component = addon(jQuery, jQuery.NGkit);
    }

    if (typeof define == "function" && define.amd) {
        define("ngkit-cover", ["ngkit"], function(){
            return component || addon(jQuery, jQuery.NGkit);
        });
    }

})(function($, NG){
    'use strict';

    NG.component('readmore', {
        readmore: 'readmore',
        defaults: {
            speed: 100,
            collapsedHeight: 200,
            heightMargin: 16,
            moreLink: '<a href="#">Read More</a>',
            lessLink: '<a href="#">Close</a>',
            embedCSS: true,
            blockCSS: 'display: block; width: 100%;',
            startOpen: false,

            // callbacks
            beforeToggle: function(){},
            afterToggle: function(){}
        },
        cssEmbedded: {},
        uniqueIdCounter: 0,

        uniqueId: function(prefix) {
            var id = ++this.uniqueIdCounter;
            if (typeof prefix == 'undefined') prefix = 'ngrm-';
            return String(prefix === null ? 'ngrm-' : prefix) + id;
        },

        setBoxHeights: function() {
            var el = $(this.element).clone().css({
                  height: 'auto',
                  width: $(this.element).width(),
                  maxHeight: 'none',
                  overflow: 'hidden'
                }).insertAfter(this.element),
                cssMaxHeight = parseInt(el.css({maxHeight: ''}).css('max-height').replace(/[^-\d\.]/g, ''), 10),
                defaultHeight = this.defaultHeight;

            this.expandedHeight = el.outerHeight();
            el.remove();

            if (!cssMaxHeight) {
                this.collapsedHeight = defaultHeight;
            } else if (cssMaxHeight > this.collapsedHeight) {
                this.collapsedHeight = cssMaxHeight;
            }
            this.maxHeight = cssMaxHeight;

            // and disable any `max-height` property set in CSS
            $(this.element).css({
                maxHeight: 'none'
            });
        }, // setBoxHeights

        init: function() {
            var $this = this,
                $element = this.element;
            this.defaultHeight = this.options.collapsedHeight;
            this.collapsedHeight = this.options.collapsedHeight;
            this.heightMargin = this.options.heightMargin;

            this.element.data('readmore', this);

            $(this.element).addClass('ng-readmore');

            this._defaults = this.options.defaults;
            this._name = this.options.readmore;

            $this.setBoxHeights();

            if ($element.outerHeight(true) <= this.collapsedHeight + this.heightMargin) {
              // The block is shorter than the limit, so there's no need to truncate it.
              return true;
            } else {
                var id = $element.attr('id') || $this.uniqueId(),
                    useLink = $this.options.startOpen ? $this.options.lessLink : $this.options.moreLink;

                $element.attr({
                    'aria-expanded': false,
                    'id': id
                });

                $element.after($(useLink)
                    .on('click', function(event) { $this.toggle(this, $this.element[0], event); })
                    .attr({
                        'class': 'ng-readmore-toggle',
                        'data-ng-readmore-toggle': '',
                        'aria-controls': id
                    })
                );
                if (! $this.options.startOpen) {
                    $element.css({
                        height: this.collapsedHeight
                    });
                }
            }

            $(window).on({
                "resize": function(e) {$this.checksize();},
                "orientationchange": function(e) {$this.checksize();}
            });
        }, // init

        checksize: NG.Utils.debounce(function() {
              var isExpanded = this.element.attr('aria-expanded') === 'true';

              this.setBoxHeights();

              this.element.css({
                height: isExpanded ? this.expandedHeight : this.collapsedHeight
              });
          }, 100),

        toggle: function(trigger, element, event) {
            if (event) {
                event.preventDefault();
            }
            if (! trigger) {
                trigger = $('[aria-controls="' + this.element.id + '"]')[0];
            }

            if (! element) {
                element = this.element;
            }

            var $this = this,
                $element = $(element),
                newHeight = '',
                newLink = '',
                expanded = false,
                collapsedHeight = this.collapsedHeight;

            if ($element.height() <= collapsedHeight) {
                newHeight = this.expandedHeight + 'px';
                newLink = 'lessLink';
                expanded = true;
            } else {
                newHeight = collapsedHeight + 'px';
                newLink = 'moreLink';
            }

            // Fire beforeToggle callback
            // Since we determined the new "expanded" state above we're now out of sync
            // with our true current state, so we need to flip the value of `expanded`
            $this.options.beforeToggle(trigger, element, ! expanded);

            $element.css({'height': newHeight});

            // Fire afterToggle callback
            $element.on('transitionend', function() {
                $this.options.afterToggle(trigger, element, expanded);

                $(this).attr({
                    'aria-expanded': expanded
                }).off('transitionend');
            });

            $(trigger).replaceWith($($this.options[newLink])
                .on('click', function(event) { $this.toggle(this, element, event); })
                .attr({
                  'data-ng-readmore-toggle': '',
                  'aria-controls': $element.attr('id')
                })
            );
        },  // toggle

        destroy: function() {
            $(this.element).each(function() {
                var current = $(this);

                current.attr({
                    'data-ng-readmore': null,
                    'aria-expanded': null
                }).css({
                    maxHeight: '',
                    height: ''
                }).next('[data-ng-readmore-toggle]')
                  .remove();

                current.removeData();
            });  // this.element.each
        }  // destroy
    }); // NG.component

    $(document).ready(function() {
        $('[data-ng-readmore]').each(function() {
            var current = $(this);

            if(!current.data("readmore")){
                var opts = NG.Utils.options(current.attr("data-ng-readmore"));
                var obj = NG.readmore(current, opts);
                // obj.setBoxHeights(current);
                current.css({
                    height: opts.startOpen ? opts.expandedHeight : opts.collapsedHeight
                });
            }
        });
    });
});



/**
 * Created by brentmiller on 1/8/17.
 * Used to update the UI of the Jucier Plugin.
 *
 */


var JUCIER_SET_BODY_SCROLL_POSITION = $(window).scrollTop();

var processJucierClick = function(addBodyClass){

    JUCIER_SET_BODY_SCROLL_POSITION = $(window).scrollTop();

    console.log("Window position", JUCIER_SET_BODY_SCROLL_POSITION);

    if(addBodyClass){
        $("body").addClass("jucier-modal-open");
    }

    setTimeout(function(){
        var overlay = $('.j-overlay-content');
        var jtitle = $(overlay).find(".j-title");
        var jposter = $(overlay).find(".j-poster");
        var jshare = $(overlay).find(".j-share").clone( true );
        if(jtitle.length && $('.j-overlay-content').find(".j-share").length < 2){
            $(jtitle).after(jshare);
        }else if(jposter.length && $('.j-overlay-content').find(".j-share").length < 2){
            $(overlay).find(".j-poster").after(jshare);
        }
    }, 500);
};



function updateJuicer() {
    $(".j-message p:contains('By:')").addClass("ng-article-meta");

    $(".j-text .info").removeClass("info").addClass("ng-article-meta");

    $(document).on("click", ".j-overlay", function(event){
        if($(event.target).hasClass("j-overlay")){
            $("body").removeClass("jucier-modal-open");
        }
    });

    $(".j-close").each(function(index){
        var elm = this;
        $(elm).hide();

        var parent =  $(elm).parent();

        var close = document.createElement("a");
        close.className = "j-close-ng";
        close.setAttribute("href", "#");
        close.innerHTML = "<span>Close</span>";
        close.onclick = function(){
            $("body").removeClass("jucier-modal-open");
            $(elm).trigger("click");
            setTimeout(function(){
                //$("html").scrollTop(JUCIER_SET_BODY_SCROLL_POSITION);
                window.scrollTo(0, JUCIER_SET_BODY_SCROLL_POSITION);
            },400);
        };
        $(parent).prepend(close);

        $(".j-message p:contains('By:')").addClass("ng-article-meta");
    });


    $(".feed-item").on("click", function(){
        processJucierClick(true);
    });

    $(".j-previous").on("click", function(){
        processJucierClick(false);
    });

    $(".j-next").on("click", function(){
        processJucierClick(false);
    });
}



(function(window, document, undefined){
	/*jshint eqnull:true */
	'use strict';
	var polyfill;
	var config = (window.lazySizes && lazySizes.cfg) || window.lazySizesConfig;
	var img = document.createElement('img');
	var supportSrcset = ('sizes' in img) && ('srcset' in img);
	var regHDesc = /\s+\d+h/g;
	var fixEdgeHDescriptor = (function(){
		var regDescriptors = /\s+(\d+)(w|h)\s+(\d+)(w|h)/;
		var forEach = Array.prototype.forEach;

		return function(edgeMatch){
			var img = document.createElement('img');
			var removeHDescriptors = function(source){
				var ratio;
				var srcset = source.getAttribute(lazySizesConfig.srcsetAttr);
				if(srcset){
					if(srcset.match(regDescriptors)){
						if(RegExp.$2 == 'w'){
							ratio = RegExp.$1 / RegExp.$3;
						} else {
							ratio = RegExp.$3 / RegExp.$1;
						}

						if(ratio){
							source.setAttribute('data-aspectratio', ratio);
						}
					}
					source.setAttribute(lazySizesConfig.srcsetAttr, srcset.replace(regHDesc, ''));
				}
			};
			var handler = function(e){
				var picture = e.target.parentNode;

				if(picture && picture.nodeName == 'PICTURE'){
					forEach.call(picture.getElementsByTagName('source'), removeHDescriptors);
				}
				removeHDescriptors(e.target);
			};

			var test = function(){
				if(!!img.currentSrc){
					document.removeEventListener('lazybeforeunveil', handler);
				}
			};

			if(edgeMatch[1]){
				document.addEventListener('lazybeforeunveil', handler);

				if(true || edgeMatch[1] > 14){
					img.onload = test;
					img.onerror = test;

					img.srcset = 'data:,a 1w 1h';

					if(img.complete){
						test();
					}
				}
			}
		};
	})();


	if(!config){
		config = {};
		window.lazySizesConfig = config;
	}

	if(!config.supportsType){
		config.supportsType = function(type/*, elem*/){
			return !type;
		};
	}

	if(window.picturefill || config.pf){return;}

	if(window.HTMLPictureElement && supportSrcset){

		if(document.msElementsFromPoint){
			fixEdgeHDescriptor(navigator.userAgent.match(/Edge\/(\d+)/));
		}

		config.pf = function(){};
		return;
	}

	config.pf = function(options){
		var i, len;
		if(window.picturefill){return;}
		for(i = 0, len = options.elements.length; i < len; i++){
			polyfill(options.elements[i]);
		}
	};

	// partial polyfill
	polyfill = (function(){
		var ascendingSort = function( a, b ) {
			return a.w - b.w;
		};
		var regPxLength = /^\s*\d+px\s*$/;
		var reduceCandidate = function (srces) {
			var lowerCandidate, bonusFactor;
			var len = srces.length;
			var candidate = srces[len -1];
			var i = 0;

			for(i; i < len;i++){
				candidate = srces[i];
				candidate.d = candidate.w / srces.w;

				if(candidate.d >= srces.d){
					if(!candidate.cached && (lowerCandidate = srces[i - 1]) &&
						lowerCandidate.d > srces.d - (0.13 * Math.pow(srces.d, 2.2))){

						bonusFactor = Math.pow(lowerCandidate.d - 0.6, 1.6);

						if(lowerCandidate.cached) {
							lowerCandidate.d += 0.15 * bonusFactor;
						}

						if(lowerCandidate.d + ((candidate.d - srces.d) * bonusFactor) > srces.d){
							candidate = lowerCandidate;
						}
					}
					break;
				}
			}
			return candidate;
		};

		var parseWsrcset = (function(){
			var candidates;
			var regWCandidates = /(([^,\s].[^\s]+)\s+(\d+)w)/g;
			var regMultiple = /\s/;
			var addCandidate = function(match, candidate, url, wDescriptor){
				candidates.push({
					c: candidate,
					u: url,
					w: wDescriptor * 1
				});
			};

			return function(input){
				candidates = [];
				input = input.trim();
				input
					.replace(regHDesc, '')
					.replace(regWCandidates, addCandidate)
				;

				if(!candidates.length && input && !regMultiple.test(input)){
					candidates.push({
						c: input,
						u: input,
						w: 99
					});
				}

				return candidates;
			};
		})();

		var runMatchMedia = function(){
			if(runMatchMedia.init){return;}

			runMatchMedia.init = true;
			addEventListener('resize', (function(){
				var timer;
				var matchMediaElems = document.getElementsByClassName('lazymatchmedia');
				var run = function(){
					var i, len;
					for(i = 0, len = matchMediaElems.length; i < len; i++){
						polyfill(matchMediaElems[i]);
					}
				};

				return function(){
					clearTimeout(timer);
					timer = setTimeout(run, 66);
				};
			})());
		};

		var createSrcset = function(elem, isImage){
			var parsedSet;
			var srcSet = elem.getAttribute('srcset') || elem.getAttribute(config.srcsetAttr);

			if(!srcSet && isImage){
				srcSet = !elem._lazypolyfill ?
					(elem.getAttribute('src') || elem.getAttribute(config.srcAttr)) :
					elem._lazypolyfill._set
				;
			}

			if(!elem._lazypolyfill || elem._lazypolyfill._set != srcSet){

				parsedSet = parseWsrcset( srcSet || '' );
				if(isImage && elem.parentNode){
					parsedSet.isPicture = elem.parentNode.nodeName.toUpperCase() == 'PICTURE';

					if(parsedSet.isPicture){
						if(window.matchMedia || (window.Modernizr && Modernizr.mq)){
							lazySizes.aC(elem, 'lazymatchmedia');
							runMatchMedia();
						}
					}
				}

				parsedSet._set = srcSet;
				Object.defineProperty(elem, '_lazypolyfill', {
					value: parsedSet,
					writable: true
				});
			}
		};

		var getX = function(elem){
			var dpr = window.devicePixelRatio || 1;
			var optimum = lazySizes.getX && lazySizes.getX(elem);
			return Math.min(optimum || dpr, 2.5, dpr);
		};

		var matchesMedia = function(media){
			if(window.matchMedia){
				matchesMedia = function(media){
					return !media || (matchMedia(media) || {}).matches;
				};
			} else if(window.Modernizr && Modernizr.mq){
				return !media || Modernizr.mq(media);
			} else {
				return !media;
			}

			return matchesMedia(media);
		};

		var getCandidate = function(elem){
			var sources, i, len, media, source, srces, src, width;

			source = elem;
			createSrcset(source, true);
			srces = source._lazypolyfill;

			if(srces.isPicture){
				for(i = 0, sources = elem.parentNode.getElementsByTagName('source'), len = sources.length; i < len; i++){
					if( config.supportsType(sources[i].getAttribute('type'), elem) && matchesMedia( sources[i].getAttribute('media')) ){
						source = sources[i];
						createSrcset(source);
						srces = source._lazypolyfill;
						break;
					}
				}
			}

			if(srces.length > 1){
				width = source.getAttribute('sizes') || '';
				width = regPxLength.test(width) && parseInt(width, 10) || lazySizes.gW(elem, elem.parentNode);
				srces.d = getX(elem);
				if(!srces.w || srces.w < width){
					srces.w = width;
					src = reduceCandidate(srces.sort(ascendingSort));
				}
			} else {
				src = srces[0];
			}

			return src;
		};

		var p = function(elem){
			if(supportSrcset && elem.parentNode && elem.parentNode.nodeName.toUpperCase() != 'PICTURE'){return;}
			var candidate = getCandidate(elem);

			if(candidate && candidate.u && elem._lazypolyfill.cur != candidate.u){
				elem._lazypolyfill.cur = candidate.u;
				candidate.cached = true;
				elem.setAttribute(config.srcAttr, candidate.u);
				elem.setAttribute('src', candidate.u);
			}
		};

		p.parse = parseWsrcset;

		return p;
	})();

	if(config.loadedClass && config.loadingClass){
		(function(){
			var sels = [];
			['img[sizes$="px"][srcset].', 'picture > img:not([srcset]).'].forEach(function(sel){
				sels.push(sel + config.loadedClass);
				sels.push(sel + config.loadingClass);
			});
			config.pf({
				elements: document.querySelectorAll(sels.join(', '))
			});
		})();

	}
})(window, document);

/**
 * Some versions of iOS (8.1-) do load the first candidate of a srcset candidate list, if width descriptors with the sizes attribute is used.
 * This tiny extension prevents this wasted download by creating a picture structure around the image.
 * Note: This extension is already included in the ls.respimg.js file.
 *
 * Usage:
 *
 * <img
 * 	class="lazyload"
 * 	data-sizes="auto"
 * 	data-srcset="small.jpg 640px,
 * 		medium.jpg 980w,
 * 		large.jpg 1280w"
 * 	/>
 */

(function(document){
	'use strict';
	var regPicture;
	var img = document.createElement('img');

	if(('srcset' in img) && !('sizes' in img) && !window.HTMLPictureElement){
		regPicture = /^picture$/i;
		document.addEventListener('lazybeforeunveil', function(e){
			var elem, parent, srcset, sizes, isPicture;
			var picture, source;
			if(e.defaultPrevented ||
				lazySizesConfig.noIOSFix ||
				!(elem = e.target) ||
				!(srcset = elem.getAttribute(lazySizesConfig.srcsetAttr)) ||
				!(parent = elem.parentNode) ||
				(
					!(isPicture = regPicture.test(parent.nodeName || '')) &&
					!(sizes = elem.getAttribute('sizes') || elem.getAttribute(lazySizesConfig.sizesAttr))
				)
			){return;}

			picture = isPicture ? parent : document.createElement('picture');

			if(!elem._lazyImgSrc){
				Object.defineProperty(elem, '_lazyImgSrc', {
					value: document.createElement('source'),
					writable: true
				});
			}
			source = elem._lazyImgSrc;

			if(sizes){
				source.setAttribute('sizes', sizes);
			}

			source.setAttribute(lazySizesConfig.srcsetAttr, srcset);
			elem.setAttribute('data-pfsrcset', srcset);
			elem.removeAttribute(lazySizesConfig.srcsetAttr);

			if(!isPicture){
				parent.insertBefore(picture, elem);
				picture.appendChild(elem);
			}
			picture.insertBefore(source, elem);
		});
	}
})(document);


(function(window, factory) {
	var lazySizes = factory(window, window.document);
	window.lazySizes = lazySizes;
	if(typeof module == 'object' && module.exports){
		module.exports = lazySizes;
	}
}(window, function l(window, document) {
	'use strict';
	/*jshint eqnull:true */
	if(!document.getElementsByClassName){return;}

	var lazySizesConfig;

	var docElem = document.documentElement;

	var Date = window.Date;

	var supportPicture = window.HTMLPictureElement;

	var _addEventListener = 'addEventListener';

	var _getAttribute = 'getAttribute';

	var addEventListener = window[_addEventListener];

	var setTimeout = window.setTimeout;

	var requestAnimationFrame = window.requestAnimationFrame || setTimeout;

	var requestIdleCallback = window.requestIdleCallback;

	var regPicture = /^picture$/i;

	var loadEvents = ['load', 'error', 'lazyincluded', '_lazyloaded'];

	var regClassCache = {};

	var forEach = Array.prototype.forEach;

	var hasClass = function(ele, cls) {
		if(!regClassCache[cls]){
			regClassCache[cls] = new RegExp('(\\s|^)'+cls+'(\\s|$)');
		}
		return regClassCache[cls].test(ele[_getAttribute]('class') || '') && regClassCache[cls];
	};

	var addClass = function(ele, cls) {
		if (!hasClass(ele, cls)){
			ele.setAttribute('class', (ele[_getAttribute]('class') || '').trim() + ' ' + cls);
		}
	};

	var removeClass = function(ele, cls) {
		var reg;
		if ((reg = hasClass(ele,cls))) {
			ele.setAttribute('class', (ele[_getAttribute]('class') || '').replace(reg, ' '));
		}
	};

	var addRemoveLoadEvents = function(dom, fn, add){
		var action = add ? _addEventListener : 'removeEventListener';
		if(add){
			addRemoveLoadEvents(dom, fn);
		}
		loadEvents.forEach(function(evt){
			dom[action](evt, fn);
		});
	};

	var triggerEvent = function(elem, name, detail, noBubbles, noCancelable){
		var event = document.createEvent('CustomEvent');

		event.initCustomEvent(name, !noBubbles, !noCancelable, detail || {});

		elem.dispatchEvent(event);
		return event;
	};

	var updatePolyfill = function (el, full){
		var polyfill;
		if( !supportPicture && ( polyfill = (window.picturefill || lazySizesConfig.pf) ) ){
			polyfill({reevaluate: true, elements: [el]});
		} else if(full && full.src){
			el.src = full.src;
		}
	};

	var getCSS = function (elem, style){
		return (getComputedStyle(elem, null) || {})[style];
	};

	var getWidth = function(elem, parent, width){
		width = width || elem.offsetWidth;

		while(width < lazySizesConfig.minSize && parent && !elem._lazysizesWidth){
			width =  parent.offsetWidth;
			parent = parent.parentNode;
		}

		return width;
	};

	var rAF = (function(){
		var running, waiting;
		var fns = [];

		var run = function(){
			var fn;
			running = true;
			waiting = false;
			while(fns.length){
				fn = fns.shift();
				fn[0].apply(fn[1], fn[2]);
			}
			running = false;
		};

		return function(fn){
			if(running){
				fn.apply(this, arguments);
			} else {
				fns.push([fn, this, arguments]);

				if(!waiting){
					waiting = true;
					(document.hidden ? setTimeout : requestAnimationFrame)(run);
				}
			}
		};
	})();

	var rAFIt = function(fn, simple){
		return simple ?
			function() {
				rAF(fn);
			} :
			function(){
				var that = this;
				var args = arguments;
				rAF(function(){
					fn.apply(that, args);
				});
			}
		;
	};

	var throttle = function(fn){
		var running;
		var lastTime = 0;
		var gDelay = 125;
		var RIC_DEFAULT_TIMEOUT = 999;
		var rICTimeout = RIC_DEFAULT_TIMEOUT;
		var run = function(){
			running = false;
			lastTime = Date.now();
			fn();
		};
		var idleCallback = requestIdleCallback ?
			function(){
				requestIdleCallback(run, {timeout: rICTimeout});
				if(rICTimeout !== RIC_DEFAULT_TIMEOUT){
					rICTimeout = RIC_DEFAULT_TIMEOUT;
				}
			}:
			rAFIt(function(){
				setTimeout(run);
			}, true)
		;

		return function(isPriority){
			var delay;
			if((isPriority = isPriority === true)){
				rICTimeout = 66;
			}

			if(running){
				return;
			}

			running =  true;

			delay = gDelay - (Date.now() - lastTime);

			if(delay < 0){
				delay = 0;
			}

			if(isPriority || (delay < 9 && requestIdleCallback)){
				idleCallback();
			} else {
				setTimeout(idleCallback, delay);
			}
		};
	};

	//based on http://modernjavascript.blogspot.de/2013/08/building-better-debounce.html
	var debounce = function(func) {
		var timeout, timestamp;
		var wait = 99;
		var run = function(){
			timeout = null;
			func();
		};
		var later = function() {
			var last = Date.now() - timestamp;

			if (last < wait) {
				setTimeout(later, wait - last);
			} else {
				(requestIdleCallback || run)(run);
			}
		};

		return function() {
			timestamp = Date.now();

			if (!timeout) {
				timeout = setTimeout(later, wait);
			}
		};
	};


	var loader = (function(){
		var lazyloadElems, preloadElems, isCompleted, resetPreloadingTimer, loadMode, started;

		var eLvW, elvH, eLtop, eLleft, eLright, eLbottom;

		var defaultExpand, preloadExpand, hFac;

		var regImg = /^img$/i;
		var regIframe = /^iframe$/i;

		var supportScroll = ('onscroll' in window) && !(/glebot/.test(navigator.userAgent));

		var shrinkExpand = 0;
		var currentExpand = 0;

		var isLoading = 0;
		var lowRuns = 0;

		var resetPreloading = function(e){
			isLoading--;
			if(e && e.target){
				addRemoveLoadEvents(e.target, resetPreloading);
			}

			if(!e || isLoading < 0 || !e.target){
				isLoading = 0;
			}
		};

		var isNestedVisible = function(elem, elemExpand){
			var outerRect;
			var parent = elem;
			var visible = getCSS(document.body, 'visibility') == 'hidden' || getCSS(elem, 'visibility') != 'hidden';

			eLtop -= elemExpand;
			eLbottom += elemExpand;
			eLleft -= elemExpand;
			eLright += elemExpand;

			while(visible && (parent = parent.offsetParent) && parent != document.body && parent != docElem){
				visible = ((getCSS(parent, 'opacity') || 1) > 0);

				if(visible && getCSS(parent, 'overflow') != 'visible'){
					outerRect = parent.getBoundingClientRect();
					visible = eLright > outerRect.left &&
						eLleft < outerRect.right &&
						eLbottom > outerRect.top - 1 &&
						eLtop < outerRect.bottom + 1
					;
				}
			}

			return visible;
		};

		var checkElements = function() {
			var eLlen, i, rect, autoLoadElem, loadedSomething, elemExpand, elemNegativeExpand, elemExpandVal, beforeExpandVal;

			if((loadMode = lazySizesConfig.loadMode) && isLoading < 8 && (eLlen = lazyloadElems.length)){

				i = 0;

				lowRuns++;

				if(preloadExpand == null){
					if(!('expand' in lazySizesConfig)){
						lazySizesConfig.expand = docElem.clientHeight > 500 ? 500 : 400;
					}

					defaultExpand = lazySizesConfig.expand;
					preloadExpand = defaultExpand * lazySizesConfig.expFactor;
				}

				if(currentExpand < preloadExpand && isLoading < 1 && lowRuns > 3 && loadMode > 2){
					currentExpand = preloadExpand;
					lowRuns = 0;
				} else if(loadMode > 1 && lowRuns > 2 && isLoading < 6){
					currentExpand = defaultExpand;
				} else {
					currentExpand = shrinkExpand;
				}

				for(; i < eLlen; i++){

					if(!lazyloadElems[i] || lazyloadElems[i]._lazyRace){continue;}

					if(!supportScroll){unveilElement(lazyloadElems[i]);continue;}

					if(!(elemExpandVal = lazyloadElems[i][_getAttribute]('data-expand')) || !(elemExpand = elemExpandVal * 1)){
						elemExpand = currentExpand;
					}

					if(beforeExpandVal !== elemExpand){
						eLvW = innerWidth + (elemExpand * hFac);
						elvH = innerHeight + elemExpand;
						elemNegativeExpand = elemExpand * -1;
						beforeExpandVal = elemExpand;
					}

					rect = lazyloadElems[i].getBoundingClientRect();

					if ((eLbottom = rect.bottom) >= elemNegativeExpand &&
						(eLtop = rect.top) <= elvH &&
						(eLright = rect.right) >= elemNegativeExpand * hFac &&
						(eLleft = rect.left) <= eLvW &&
						(eLbottom || eLright || eLleft || eLtop) &&
						((isCompleted && isLoading < 3 && !elemExpandVal && (loadMode < 3 || lowRuns < 4)) || isNestedVisible(lazyloadElems[i], elemExpand))){
						unveilElement(lazyloadElems[i]);
						loadedSomething = true;
						if(isLoading > 9){break;}
					} else if(!loadedSomething && isCompleted && !autoLoadElem &&
						isLoading < 4 && lowRuns < 4 && loadMode > 2 &&
						(preloadElems[0] || lazySizesConfig.preloadAfterLoad) &&
						(preloadElems[0] || (!elemExpandVal && ((eLbottom || eLright || eLleft || eLtop) || lazyloadElems[i][_getAttribute](lazySizesConfig.sizesAttr) != 'auto')))){
						autoLoadElem = preloadElems[0] || lazyloadElems[i];
					}
				}

				if(autoLoadElem && !loadedSomething){
					unveilElement(autoLoadElem);
				}
			}
		};

		var throttledCheckElements = throttle(checkElements);

		var switchLoadingClass = function(e){
			addClass(e.target, lazySizesConfig.loadedClass);
			removeClass(e.target, lazySizesConfig.loadingClass);
			addRemoveLoadEvents(e.target, rafSwitchLoadingClass);
		};
		var rafedSwitchLoadingClass = rAFIt(switchLoadingClass);
		var rafSwitchLoadingClass = function(e){
			rafedSwitchLoadingClass({target: e.target});
		};

		var changeIframeSrc = function(elem, src){
			try {
				elem.contentWindow.location.replace(src);
			} catch(e){
				elem.src = src;
			}
		};

		var handleSources = function(source){
			var customMedia, parent;

			var sourceSrcset = source[_getAttribute](lazySizesConfig.srcsetAttr);

			if( (customMedia = lazySizesConfig.customMedia[source[_getAttribute]('data-media') || source[_getAttribute]('media')]) ){
				source.setAttribute('media', customMedia);
			}

			if(sourceSrcset){
				source.setAttribute('srcset', sourceSrcset);
			}

			//https://bugzilla.mozilla.org/show_bug.cgi?id=1170572
			if(customMedia){
				parent = source.parentNode;
				parent.insertBefore(source.cloneNode(), source);
				parent.removeChild(source);
			}
		};

		var lazyUnveil = rAFIt(function (elem, detail, isAuto, sizes, isImg){
			var src, srcset, parent, isPicture, event, firesLoad;

			if(!(event = triggerEvent(elem, 'lazybeforeunveil', detail)).defaultPrevented){

				if(sizes){
					if(isAuto){
						addClass(elem, lazySizesConfig.autosizesClass);
					} else {
						elem.setAttribute('sizes', sizes);
					}
				}

				srcset = elem[_getAttribute](lazySizesConfig.srcsetAttr);
				src = elem[_getAttribute](lazySizesConfig.srcAttr);

				if(isImg) {
					parent = elem.parentNode;
					isPicture = parent && regPicture.test(parent.nodeName || '');
				}

				firesLoad = detail.firesLoad || (('src' in elem) && (srcset || src || isPicture));

				event = {target: elem};

				if(firesLoad){
					addRemoveLoadEvents(elem, resetPreloading, true);
					clearTimeout(resetPreloadingTimer);
					resetPreloadingTimer = setTimeout(resetPreloading, 2500);

					addClass(elem, lazySizesConfig.loadingClass);
					addRemoveLoadEvents(elem, rafSwitchLoadingClass, true);
				}

				if(isPicture){
					forEach.call(parent.getElementsByTagName('source'), handleSources);
				}

				if(srcset){
					elem.setAttribute('srcset', srcset);
				} else if(src && !isPicture){
					if(regIframe.test(elem.nodeName)){
						changeIframeSrc(elem, src);
					} else {
						elem.src = src;
					}
				}

				if(srcset || isPicture){
					updatePolyfill(elem, {src: src});
				}
			}

			rAF(function(){
				if(elem._lazyRace){
					delete elem._lazyRace;
				}
				removeClass(elem, lazySizesConfig.lazyClass);

				if( !firesLoad || elem.complete ){
					if(firesLoad){
						resetPreloading(event);
					} else {
						isLoading--;
					}
					switchLoadingClass(event);
				}
			});
		});

		var unveilElement = function (elem){
			var detail;

			var isImg = regImg.test(elem.nodeName);

			//allow using sizes="auto", but don't use. it's invalid. Use data-sizes="auto" or a valid value for sizes instead (i.e.: sizes="80vw")
			var sizes = isImg && (elem[_getAttribute](lazySizesConfig.sizesAttr) || elem[_getAttribute]('sizes'));
			var isAuto = sizes == 'auto';

			if( (isAuto || !isCompleted) && isImg && (elem.src || elem.srcset) && !elem.complete && !hasClass(elem, lazySizesConfig.errorClass)){return;}

			detail = triggerEvent(elem, 'lazyunveilread').detail;

			if(isAuto){
				 autoSizer.updateElem(elem, true, elem.offsetWidth);
			}

			elem._lazyRace = true;
			isLoading++;

			lazyUnveil(elem, detail, isAuto, sizes, isImg);
		};

		var onload = function(){
			if(isCompleted){return;}
			if(Date.now() - started < 999){
				setTimeout(onload, 999);
				return;
			}
			var afterScroll = debounce(function(){
				lazySizesConfig.loadMode = 3;
				throttledCheckElements();
			});

			isCompleted = true;

			lazySizesConfig.loadMode = 3;

			throttledCheckElements();

			addEventListener('scroll', function(){
				if(lazySizesConfig.loadMode == 3){
					lazySizesConfig.loadMode = 2;
				}
				afterScroll();
			}, true);
		};

		return {
			_: function(){
				started = Date.now();

				lazyloadElems = document.getElementsByClassName(lazySizesConfig.lazyClass);
				preloadElems = document.getElementsByClassName(lazySizesConfig.lazyClass + ' ' + lazySizesConfig.preloadClass);
				hFac = lazySizesConfig.hFac;

				addEventListener('scroll', throttledCheckElements, true);

				addEventListener('resize', throttledCheckElements, true);

				if(window.MutationObserver){
					new MutationObserver( throttledCheckElements ).observe( docElem, {childList: true, subtree: true, attributes: true} );
				} else {
					docElem[_addEventListener]('DOMNodeInserted', throttledCheckElements, true);
					docElem[_addEventListener]('DOMAttrModified', throttledCheckElements, true);
					setInterval(throttledCheckElements, 999);
				}

				addEventListener('hashchange', throttledCheckElements, true);

				//, 'fullscreenchange'
				['focus', 'mouseover', 'click', 'load', 'transitionend', 'animationend', 'webkitAnimationEnd'].forEach(function(name){
					document[_addEventListener](name, throttledCheckElements, true);
				});

				if((/d$|^c/.test(document.readyState))){
					onload();
				} else {
					addEventListener('load', onload);
					document[_addEventListener]('DOMContentLoaded', throttledCheckElements);
					setTimeout(onload, 20000);
				}

				throttledCheckElements(lazyloadElems.length > 0);
			},
			checkElems: throttledCheckElements,
			unveil: unveilElement
		};
	})();


	var autoSizer = (function(){
		var autosizesElems;

		var sizeElement = rAFIt(function(elem, parent, event, width){
			var sources, i, len;
			elem._lazysizesWidth = width;
			width += 'px';

			elem.setAttribute('sizes', width);

			if(regPicture.test(parent.nodeName || '')){
				sources = parent.getElementsByTagName('source');
				for(i = 0, len = sources.length; i < len; i++){
					sources[i].setAttribute('sizes', width);
				}
			}

			if(!event.detail.dataAttr){
				updatePolyfill(elem, event.detail);
			}
		});
		var getSizeElement = function (elem, dataAttr, width){
			var event;
			var parent = elem.parentNode;

			if(parent){
				width = getWidth(elem, parent, width);
				event = triggerEvent(elem, 'lazybeforesizes', {width: width, dataAttr: !!dataAttr});

				if(!event.defaultPrevented){
					width = event.detail.width;

					if(width && width !== elem._lazysizesWidth){
						sizeElement(elem, parent, event, width);
					}
				}
			}
		};

		var updateElementsSizes = function(){
			var i;
			var len = autosizesElems.length;
			if(len){
				i = 0;

				for(; i < len; i++){
					getSizeElement(autosizesElems[i]);
				}
			}
		};

		var debouncedUpdateElementsSizes = debounce(updateElementsSizes);

		return {
			_: function(){
				autosizesElems = document.getElementsByClassName(lazySizesConfig.autosizesClass);
				addEventListener('resize', debouncedUpdateElementsSizes);
			},
			checkElems: debouncedUpdateElementsSizes,
			updateElem: getSizeElement
		};
	})();

	var init = function(){
		if(!init.i){
			init.i = true;
			autoSizer._();
			loader._();
		}
	};

	(function(){
		var prop;

		var lazySizesDefaults = {
			lazyClass: 'lazyload',
			loadedClass: 'lazyloaded',
			loadingClass: 'lazyloading',
			preloadClass: 'lazypreload',
			errorClass: 'lazyerror',
			//strictClass: 'lazystrict',
			autosizesClass: 'lazyautosizes',
			srcAttr: 'data-src',
			srcsetAttr: 'data-srcset',
			sizesAttr: 'data-sizes',
			//preloadAfterLoad: false,
			minSize: 40,
			customMedia: {},
			init: true,
			expFactor: 1.5,
			hFac: 0.8,
			loadMode: 2
		};

		lazySizesConfig = window.lazySizesConfig || window.lazysizesConfig || {};

		for(prop in lazySizesDefaults){
			if(!(prop in lazySizesConfig)){
				lazySizesConfig[prop] = lazySizesDefaults[prop];
			}
		}

		window.lazySizesConfig = lazySizesConfig;

		setTimeout(function(){
			if(lazySizesConfig.init){
				init();
			}
		});
	})();

	return {
		cfg: lazySizesConfig,
		autoSizer: autoSizer,
		loader: loader,
		init: init,
		uP: updatePolyfill,
		aC: addClass,
		rC: removeClass,
		hC: hasClass,
		fire: triggerEvent,
		gW: getWidth,
		rAF: rAF,
	};
}
));
