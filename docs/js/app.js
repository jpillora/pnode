/*! responsive-nav.js v1.0.20
 * https://github.com/viljamis/responsive-nav.js
 * http://responsive-nav.com
 *
 * Copyright (c) 2013 @viljamis
 * Available under the MIT license
 */

/* jshint strict:false, forin:false, noarg:true, noempty:true, eqeqeq:true,
boss:true, bitwise:true, browser:true, devel:true, indent:2 */
/* exported responsiveNav */

var responsiveNav = (function (window, document) {

  var computed = !!window.getComputedStyle;

  // getComputedStyle polyfill
  if (!window.getComputedStyle) {
    window.getComputedStyle = function(el) {
      this.el = el;
      this.getPropertyValue = function(prop) {
        var re = /(\-([a-z]){1})/g;
        if (prop === "float") {
          prop = "styleFloat";
        }
        if (re.test(prop)) {
          prop = prop.replace(re, function () {
            return arguments[2].toUpperCase();
          });
        }
        return el.currentStyle[prop] ? el.currentStyle[prop] : null;
      };
      return this;
    };
  }

  var nav,
    opts,
    navToggle,
    styleElement = document.createElement("style"),
    hasAnimFinished,
    navOpen,

    // fn arg can be an object or a function, thanks to handleEvent
    // read more at: http://www.thecssninja.com/javascript/handleevent
    addEvent = function (el, evt, fn, bubble) {
      if ("addEventListener" in el) {
        // BBOS6 doesn't support handleEvent, catch and polyfill
        try {
          el.addEventListener(evt, fn, bubble);
        } catch (e) {
          if (typeof fn === "object" && fn.handleEvent) {
            el.addEventListener(evt, function (e) {
              // Bind fn as this and set first arg as event object
              fn.handleEvent.call(fn, e);
            }, bubble);
          } else {
            throw e;
          }
        }
      } else if ("attachEvent" in el) {
        // check if the callback is an object and contains handleEvent
        if (typeof fn === "object" && fn.handleEvent) {
          el.attachEvent("on" + evt, function () {
            // Bind fn as this
            fn.handleEvent.call(fn);
          });
        } else {
          el.attachEvent("on" + evt, fn);
        }
      }
    },

    removeEvent = function (el, evt, fn, bubble) {
      if ("removeEventListener" in el) {
        try {
          el.removeEventListener(evt, fn, bubble);
        } catch (e) {
          if (typeof fn === "object" && fn.handleEvent) {
            el.removeEventListener(evt, function (e) {
              fn.handleEvent.call(fn, e);
            }, bubble);
          } else {
            throw e;
          }
        }
      } else if ("detachEvent" in el) {
        if (typeof fn === "object" && fn.handleEvent) {
          el.detachEvent("on" + evt, function () {
            fn.handleEvent.call(fn);
          });
        } else {
          el.detachEvent("on" + evt, fn);
        }
      }
    },

    getChildren = function (e) {
      if (e.children.length < 1) {
        throw new Error("The Nav container has no containing elements");
      }
      // Store all children in array
      var children = [];
      // Loop through children and store in array if child != TextNode
      for (var i = 0; i < e.children.length; i++) {
        if (e.children[i].nodeType === 1) {
          children.push(e.children[i]);
        }
      }
      return children;
    },

    setAttributes = function (el, attrs) {
      for (var key in attrs) {
        el.setAttribute(key, attrs[key]);
      }
    },

    addClass = function (el, cls) {
      el.className += " " + cls;
      el.className = el.className.replace(/(^\s*)|(\s*$)/g,"");
    },

    removeClass = function (el, cls) {
      var reg = new RegExp("(\\s|^)" + cls + "(\\s|$)");
      el.className = el.className.replace(reg, " ").replace(/(^\s*)|(\s*$)/g,"");
    },

    ResponsiveNav = function (el, options) {
      var i;

      // Default options
      this.options = {
        animate: true,        // Boolean: Use CSS3 transitions, true or false
        transition: 350,      // Integer: Speed of the transition, in milliseconds
        label: "Menu",        // String: Label for the navigation toggle
        insert: "after",      // String: Insert the toggle before or after the navigation
        customToggle: "",     // Selector: Specify the ID of a custom toggle
        openPos: "relative",  // String: Position of the opened nav, relative or static
        jsClass: "js",        // String: 'JS enabled' class which is added to <html> el
        init: function(){},   // Function: Init callback
        open: function(){},   // Function: Open callback
        close: function(){}   // Function: Close callback
      };

      // User defined options
      for (i in options) {
        this.options[i] = options[i];
      }

      // Adds "js" class for <html>
      addClass(document.documentElement, this.options.jsClass);

      // Wrapper
      this.wrapperEl = el.replace("#", "");
      if (document.getElementById(this.wrapperEl)) {
        this.wrapper = document.getElementById(this.wrapperEl);
      } else {
        // If el doesn't exists, stop here.
        throw new Error("The nav element you are trying to select doesn't exist");
      }

      // Inner wrapper
      this.wrapper.inner = getChildren(this.wrapper);

      // For minification
      opts = this.options;
      nav = this.wrapper;

      // Init
      this._init(this);
    };

  ResponsiveNav.prototype = {
    // Public methods
    destroy: function () {
      this._removeStyles();
      removeClass(nav, "closed");
      removeClass(nav, "opened");
      nav.removeAttribute("style");
      nav.removeAttribute("aria-hidden");
      nav = null;
      _instance = null;

      removeEvent(window, "resize", this, false);
      removeEvent(document.body, "touchmove", this, false);
      removeEvent(navToggle, "touchstart", this, false);
      removeEvent(navToggle, "touchend", this, false);
      removeEvent(navToggle, "keyup", this, false);
      removeEvent(navToggle, "click", this, false);
      removeEvent(navToggle, "mouseup", this, false);

      if (!opts.customToggle) {
        navToggle.parentNode.removeChild(navToggle);
      } else {
        navToggle.removeAttribute("aria-hidden");
      }
    },

    toggle: function () {
      if (hasAnimFinished === true) {
        if (!navOpen) {
          removeClass(nav, "closed");
          addClass(nav, "opened");
          nav.style.position = opts.openPos;
          setAttributes(nav, {"aria-hidden": "false"});

          navOpen = true;
          opts.open();
        } else {
          removeClass(nav, "opened");
          addClass(nav, "closed");
          setAttributes(nav, {"aria-hidden": "true"});

          if (opts.animate) {
            hasAnimFinished = false;
            setTimeout(function () {
              nav.style.position = "absolute";
              hasAnimFinished = true;
            }, opts.transition + 10);
          } else {
            nav.style.position = "absolute";
          }

          navOpen = false;
          opts.close();
        }
      }
    },

    handleEvent: function (e) {
      var evt = e || window.event;

      switch (evt.type) {
      case "touchstart":
        this._onTouchStart(evt);
        break;
      case "touchmove":
        this._onTouchMove(evt);
        break;
      case "touchend":
      case "mouseup":
        this._onTouchEnd(evt);
        break;
      case "click":
        this._preventDefault(evt);
        break;
      case "keyup":
        this._onKeyUp(evt);
        break;
      case "resize":
        this._resize(evt);
        break;
      }
    },

    // Private methods
    _init: function () {
      addClass(nav, "closed");
      hasAnimFinished = true;
      navOpen = false;

      this._createToggle();
      this._transitions();
      this._resize();

      addEvent(window, "resize", this, false);
      addEvent(document.body, "touchmove", this, false);
      addEvent(navToggle, "touchstart", this, false);
      addEvent(navToggle, "touchend", this, false);
      addEvent(navToggle, "mouseup", this, false);
      addEvent(navToggle, "keyup", this, false);
      addEvent(navToggle, "click", this, false);

      // Init callback
      opts.init();
    },

    _createStyles: function () {
      if (!styleElement.parentNode) {
        document.getElementsByTagName("head")[0].appendChild(styleElement);
      }
    },

    _removeStyles: function () {
      if (styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    },

    _createToggle: function () {
      if (!opts.customToggle) {
        var toggle = document.createElement("a");
        toggle.innerHTML = opts.label;
        setAttributes(toggle, {
          "href": "#",
          "id": "nav-toggle"
        });

        if (opts.insert === "after") {
          nav.parentNode.insertBefore(toggle, nav.nextSibling);
        } else {
          nav.parentNode.insertBefore(toggle, nav);
        }

        navToggle = document.getElementById("nav-toggle");
      } else {
        var toggleEl = opts.customToggle.replace("#", "");

        if (document.getElementById(toggleEl)) {
          navToggle = document.getElementById(toggleEl);
        } else {
          throw new Error("The custom nav toggle you are trying to select doesn't exist");
        }
      }
    },

    _preventDefault: function(e) {
      if (e.preventDefault) {
        e.preventDefault();
        e.stopPropagation();
      } else {
        e.returnValue = false;
      }
    },

    _onTouchStart: function (e) {
      e.stopPropagation();
      this.startX = e.touches[0].clientX;
      this.startY = e.touches[0].clientY;
      this.touchHasMoved = false;
      removeEvent(navToggle, "mouseup", this, false);
    },

    _onTouchMove: function (e) {
      if (Math.abs(e.touches[0].clientX - this.startX) > 10 ||
      Math.abs(e.touches[0].clientY - this.startY) > 10) {
        this.touchHasMoved = true;
      }
    },

    _onTouchEnd: function (e) {
      this._preventDefault(e);
      if (!this.touchHasMoved) {
        if (e.type === "touchend") {
          this.toggle(e);
          // Prevent click on the underlying menu on Android 2.3
          var that = this;
          nav.addEventListener("click", that._preventDefault, true);
          setTimeout(function () {
            nav.removeEventListener("click", that._preventDefault, true);
          }, opts.transition + 100);
          return;
        } else {
          var evt = e || window.event;
          // If it isn't a right click
          if (!(evt.which === 3 || evt.button === 2)) {
            this.toggle(e);
          }
        }
      }
    },

    _onKeyUp: function (e) {
      var evt = e || window.event;
      if (evt.keyCode === 13) {
        this.toggle(e);
      }
    },

    _transitions: function () {
      if (opts.animate) {
        var objStyle = nav.style,
          transition = "max-height " + opts.transition + "ms";

        objStyle.WebkitTransition = transition;
        objStyle.MozTransition = transition;
        objStyle.OTransition = transition;
        objStyle.transition = transition;
      }
    },

    _calcHeight: function () {
      var savedHeight = 0;
      for (var i = 0; i < nav.inner.length; i++) {
        savedHeight += nav.inner[i].offsetHeight;
      }

      var innerStyles = "#" + this.wrapperEl + ".opened{max-height:" + savedHeight + "px}";

      // Hide from old IE
      if (computed) {
        styleElement.innerHTML = innerStyles;
        innerStyles = "";
      }
    },

    _resize: function () {
      if (window.getComputedStyle(navToggle, null).getPropertyValue("display") !== "none") {
        setAttributes(navToggle, {"aria-hidden": "false"});

        // If the navigation is hidden
        if (nav.className.match(/(^|\s)closed(\s|$)/)) {
          setAttributes(nav, {"aria-hidden": "true"});
          nav.style.position = "absolute";
        }

        this._createStyles();
        this._calcHeight();
      } else {
        setAttributes(navToggle, {"aria-hidden": "true"});
        setAttributes(nav, {"aria-hidden": "false"});
        nav.style.position = opts.openPos;
        this._removeStyles();
      }
    }

  };

  var _instance;
  function rn (el, options) {
    if (!_instance) {
      _instance = new ResponsiveNav(el, options);
    }
    return _instance;
  }

  return rn;
})(window, document);

/*!
 * verge        viewport utilities module
 * @link        verge.airve.com
 * @license     MIT
 * @copyright   2012 Ryan Van Etten
 * @version     1.7.0
 */

/*jslint browser: true, devel: true, node: true, passfail: false, bitwise: true
, continue: true, debug: true, eqeq: true, es5: true, forin: true, newcap: true
, nomen: true, plusplus: true, regexp: true, undef: true, sloppy: true, stupid: true
, sub: true, white: true, indent: 4, maxerr: 180 */

(function(root, name, definition) { // github.com/umdjs/umd
  if (typeof module != 'undefined' && module['exports']) {
    module['exports'] = definition(); // common|node|ender
  } else {
    root[name] = definition();
  } // browser
}(this, 'verge', function() {

  var win = window,
    docElem = document.documentElement,
    Modernizr = win['Modernizr'],
    matchMedia = win['matchMedia'] || win['msMatchMedia'],
    mq = matchMedia ?
  function(q) {
    return !!matchMedia.call(win, q).matches;
  } : function() {
    return false;
  }, makeViewportGetter = function(dim, inner, client) {
    // @link  responsejs.com/labs/dimensions/
    // @link  quirksmode.org/mobile/viewports2.html
    // @link  github.com/ryanve/response.js/issues/17
    return (docElem[client] < win[inner] && mq('(min-' + dim + ':' + win[inner] + 'px)') ?
    function() {
      return win[inner];
    } : function() {
      return docElem[client];
    });
  }, viewportW = makeViewportGetter('width', 'innerWidth', 'clientWidth'), viewportH = makeViewportGetter('height', 'innerHeight', 'clientHeight'), xports = {};

  /** 
   * Test if a media query is active. (Fallback uses Modernizr if avail.)
   * @since   1.6.0
   * @return  {boolean}
   */
  xports['mq'] = !matchMedia && Modernizr && Modernizr['mq'] || mq;

  /** 
   * Normalized, gracefully-degrading matchMedia.
   * @since   1.6.0
   * @return  {Object}
   */
  xports['matchMedia'] = matchMedia ?
  function() {
    // matchMedia must be binded to window
    return matchMedia.apply(win, arguments);
  } : function() {
    return {};
  };

  /** 
   * Get the layout viewport width.
   * @since   1.0.0
   * @return  {number}
   */
  xports['viewportW'] = viewportW;

  /** 
   * Get the layout viewport height.
   * @since   1.0.0
   * @return  {number}
   */
  xports['viewportH'] = viewportH;

  /**
   * alternate syntax for getting viewport dims
   * @return {Object}
   */
  function viewport() {
    return {
      'width': viewportW(),
      'height': viewportH()
    };
  }
  //xports['viewport'] = viewport;
  /** 
   * Cross-browser window.scrollX
   * @since   1.0.0
   * @return  {number}
   */
  xports['scrollX'] = function() {
    return win.pageXOffset || docElem.scrollLeft;
  };

  /** 
   * Cross-browser window.scrollY
   * @since   1.0.0
   * @return  {number}
   */
  xports['scrollY'] = function() {
    return win.pageYOffset || docElem.scrollTop;
  };

  /** 
   * Cross-browser element.getBoundingClientRect plus optional cushion.
   * Coords are relative to the top-left corner of the viewport.
   * @since  1.0.0
   * @param  {Object|Array} el       DOM element or collection (defaults to first item)
   * @param  {number=}      cushion  +/- pixel amount to act as a cushion around the viewport
   * @return {Object|boolean}
   */
  function rectangle(el, cushion) {
    var o = {};
    el && !el.nodeType && (el = el[0]);
    if (!el || 1 !== el.nodeType) {
      return false;
    }
    cushion = typeof cushion == 'number' && cushion || 0;
    el = el.getBoundingClientRect(); // read-only
    o['width'] = (o['right'] = el['right'] + cushion) - (o['left'] = el['left'] - cushion);
    o['height'] = (o['bottom'] = el['bottom'] + cushion) - (o['top'] = el['top'] - cushion);
    return o;
  }
  xports['rectangle'] = rectangle;

  /**
   * Get the viewport aspect ratio (or the aspect ratio of an object or element)
   * @since  1.7.0
   * @param  {Object=}  o    optional object with width/height props or methods
   * @return {number}
   * @link   w3.org/TR/css3-mediaqueries/#orientation
   */
  function aspect(o) {
    o = o && 1 === o.nodeType ? rectangle(o) : o;
    var h = null == o ? viewportH : o['height'],
      w = null == o ? viewportW : o['width'];
    h = typeof h == 'function' ? h.call(o) : h;
    w = typeof w == 'function' ? w.call(o) : w;
    return w / h;
  }
  xports['aspect'] = aspect;

  /**
   * Test if an element is in the same x-axis section as the viewport.
   * @since   1.0.0
   * @param   {Object}   el
   * @param   {number=}  cushion
   * @return  {boolean}
   */
  xports['inX'] = function(el, cushion) {
    var r = rectangle(el, cushion);
    return !!r && r.right >= 0 && r.left <= viewportW();
  };

  /**
   * Test if an element is in the same y-axis section as the viewport.
   * @since   1.0.0
   * @param   {Object}   el
   * @param   {number=}  cushion
   * @return  {boolean}
   */
  xports['inY'] = function(el, cushion) {
    var r = rectangle(el, cushion);
    return !!r && r.bottom >= 0 && r.top <= viewportH();
  };

  /**
   * Test if an element is in the viewport.
   * @since   1.0.0
   * @param   {Object}   el
   * @param   {number=}  cushion
   * @return  {boolean}
   */
  xports['inViewport'] = function(el, cushion) {
    // Equiv to `inX(el, cushion) && inY(el, cushion)` but just manually do both 
    // to avoid calling rectangle() twice. It gzips just as small like this.
    var r = rectangle(el, cushion);
    return !!r && r.bottom >= 0 && r.right >= 0 && r.top <= viewportH() && r.left <= viewportW();
  };

  return xports;
}));
(function() {
  var $, $$, Nav, create, defaults, hash, onHashChange, parentsUntil, slug,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  $ = function(selector, ctx) {
    if (ctx == null) {
      ctx = document;
    }
    return ctx.querySelector(selector);
  };

  $$ = function(selector, ctx) {
    if (ctx == null) {
      ctx = document;
    }
    return ctx.querySelectorAll(selector);
  };

  create = function(nodeType) {
    return document.createElement(nodeType);
  };

  slug = function(str) {
    return str.replace(/\W+/g, '-').toLowerCase();
  };

  defaults = {
    wrapper: "ul",
    item: "li"
  };

  parentsUntil = function(start, end) {
    var e, n;
    n = 0;
    e = start;
    while (e && e !== end) {
      n++;
      e = e.parent;
    }
    return n;
  };

  hash = "";

  onHashChange = function(fn) {
    var check;
    check = function() {
      var next;
      next = window.location.hash.substr(1);
      if (next === hash) {
        return;
      }
      hash = next;
      return fn(hash);
    };
    check();
    return setInterval(check, 100);
  };

  onHashChange(function(str) {
    var elem;
    elem = $("[data-nav-id=" + str + "]");
    return elem != null ? elem.scrollIntoView() : void 0;
  });

  Nav = function(navContainer, pageRoot) {
    var build, visited, wrapper;
    if (pageRoot == null) {
      pageRoot = document.body;
    }
    visited = [];
    build = function(pageElem, depth) {
      var a, child, elem, heading, id, item, wrapper, _i, _j, _len, _len1, _ref, _ref1;
      if (depth == null) {
        depth = 0;
      }
      visited.push(pageElem);
      wrapper = create(defaults.wrapper);
      wrapper.className = "nav-depth-" + depth;
      _ref = $$("[data-nav]", pageElem);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        elem = _ref[_i];
        if (__indexOf.call(visited, elem) >= 0) {
          continue;
        }
        visited.push(elem);
        heading = elem.getAttribute("data-nav");
        if (!heading) {
          _ref1 = elem.children;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            child = _ref1[_j];
            if (/^h\d$/i.test(child.nodeName)) {
              heading = child.innerHTML;
              break;
            }
          }
        }
        if (!heading) {
          heading = "...";
        }
        id = slug(heading);
        elem.setAttribute("data-nav-id", id);
        item = create(defaults.item);
        a = create("a");
        a.href = "#" + id;
        a.innerHTML = heading;
        item.appendChild(a);
        if ($("[data-nav]", elem)) {
          item.appendChild(build(elem, depth + 1));
        }
        wrapper.appendChild(item);
      }
      return wrapper;
    };
    wrapper = build(pageRoot);
    if (typeof navContainer === "string") {
      navContainer = $(navContainer);
    }
    navContainer.appendChild(wrapper);
    return onHashChange.hash = null;
  };

  Nav("#nav");

  responsiveNav("#nav", {
    customToggle: "#toggle"
  });

}).call(this);
