
// namespace
window.semantic = {
  handler: {}
};

// ready event
semantic.ready = function() {

  // selector cache
  var
    $document            = $(document),
    $sticky              = $('.ui.sticky'),

    $ui                  = $('.ui').not('.hover, .down'),
    $swap                = $('.theme.menu .item'),
    $menu                = $('#toc'),
    $hideMenu            = $('#toc .hide.item'),

    $fullHeightContainer = $('.pusher > .full.height'),
    $container           = $('.main.container'),
    $allHeaders          = $('.main.container > h2'),
    $followMenu          = $container.find('.following.menu'),
    $sectionHeaders      = $container.children('h2'),
    $sectionExample      = $container.find('.example'),
    $exampleHeaders      = $sectionExample.children('h4'),
    $footer              = $('.page > .footer'),

    $example             = $('.example'),

    $visibilityExample   = $example.filter('.visiblity').find('.overlay, .demo.segment, .items img'),

    $sidebarButton       = $('.fixed.launch.button'),
    $code                = $('div.code').not('.existing'),

    metadata,

    requestAnimationFrame = window.requestAnimationFrame
      || window.mozRequestAnimationFrame
      || window.webkitRequestAnimationFrame
      || window.msRequestAnimationFrame
      || function(callback) { setTimeout(callback, 0); },

    // alias
    handler
  ;


  // event handlers
  handler = {

    createWaypoints: function() {
      $sectionHeaders
        .visibility({
          observeChanges: false,
          once: false,
          offset: 50,
          onTopPassed: handler.activate.section,
          onTopPassedReverse: handler.activate.previous
        })
      ;
    },

    activate: {
      previous: function() {
        var
          $menuItems  = $followMenu.children('.item'),
          $section    = $menuItems.filter('.active'),
          index       = $menuItems.index($section)
        ;
        if($section.prev().size() > 0) {
          $section
            .removeClass('active')
            .prev('.item')
            .addClass('active')
          ;
          $followMenu
            .accordion('open', index - 1)
          ;
        }
      },
      accordion: function() {
        var
          $section       = $(this),
          index          = $sectionHeaders.index($section),
          $followSection = $followMenu.children('.item'),
          $activeSection = $followSection.eq(index)
        ;
      },
      section: function() {
        var
          $section       = $(this),
          index          = $sectionHeaders.index($section),
          $followSection = $followMenu.children('.item'),
          $activeSection = $followSection.eq(index),
          isActive       = $activeSection.hasClass('active')
        ;
        if(!isActive) {
          $followSection.filter('.active')
            .removeClass('active')
          ;
          $activeSection
            .addClass('active')
          ;
          $followMenu
            .accordion('open', index)
          ;
        }
      },
    },

    getText: function($element) {
      $element = ($element.find('a').not('.label, .anchor').length > 0)
        ? $element.find('a')
        : $element
      ;
      var
        $text = $element.contents().filter(function(){
          return this.nodeType == 3;
        })
      ;
      return ($text.length > 0)
        ? $text[0].nodeValue.trim()
        : $element.find('a').text().trim()
      ;
    },

    scrollTo: function(event) {
      var
        id       = $(this).attr('href').replace('#', ''),
        $element = $('#' + id),
        position = $element.offset().top + 10
      ;
      $element
        .addClass('active')
      ;
      $('html, body')
        .animate({
          scrollTop: position
        }, 500)
      ;
      location.hash = '#' + id;
      event.stopImmediatePropagation();
      event.preventDefault();
      return false;
    },


    copyCode: function() {
        $(this).popup('change content', 'Copied to clipboard');
    },

    refreshSticky: function() {
        $sectionHeaders.visibility('refresh');
        $sectionExample.visibility('refresh');
        $('.ui.sticky').sticky('refresh');
        $footer.visibility('refresh');
        $visibilityExample.visibility('refresh');
    },

    selectAll: function () {
        this.setSelectionRange(0, this.value.length);
    }

    };

    semantic.handler = handler;

    // create sticky
    // $sticky.sticky({
    //     context: $fullHeightContainer
    // });
    // main sidebar
    $menu.sidebar({
        dimPage          : true,
        transition       : 'overlay',
        mobileTransition : 'uncover'
    });

    // launch buttons
    $menu.sidebar('attach events', '.launch.button, .view-ui, .launch.item');

};


// attach ready event
$(document).ready(semantic.ready);
hljs.initHighlightingOnLoad();
