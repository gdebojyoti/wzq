/*
 * wzq-lite.js — a tiny renderer for the WZQ mock screens.
 *
 * Each screen keeps its markup in <template id="screen"> using a small template syntax:
 *   {{path}}                         text / attribute interpolation (dotted lookup, no expressions)
 *   <sc-if value="{{flag}}">         renders children when flag is truthy
 *   <sc-for list="{{items}}" as="x"> repeats children for each item (x and $index in scope)
 *   onClick="{{fn}}"                 binds a click handler returned by renderVals()
 *
 * The screen's <script> defines `class Component extends DCLogic { renderVals() {...} }`.
 * Props come from the defaults in window.WZQ_PROPS, overridable with URL query params,
 * e.g. game-host.html?scene=won&connection=connected&opponentOnline=false
 *
 * This file only exists so the mocks run standalone. It is NOT part of the design:
 * the real app should be built with your own components (React/Next.js).
 */
(function () {
  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  var WHOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;

  function lookup(path, scopes) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    var parts = path.split('.');
    for (var i = 0; i < scopes.length; i++) {
      var s = scopes[i];
      if (s && Object.prototype.hasOwnProperty.call(s, parts[0])) {
        var v = s[parts[0]];
        for (var j = 1; j < parts.length; j++) v = v == null ? undefined : v[parts[j]];
        return v;
      }
    }
    return undefined;
  }

  function interp(str, scopes) {
    return str.replace(HOLE, function (_, p) {
      var v = lookup(p, scopes);
      return v == null ? '' : String(v);
    });
  }

  function renderNodes(nodes, scopes, parent) {
    for (var i = 0; i < nodes.length; i++) renderNode(nodes[i], scopes, parent);
  }

  function renderNode(n, scopes, parent) {
    if (n.nodeType === 3) { parent.appendChild(document.createTextNode(interp(n.nodeValue, scopes))); return; }
    if (n.nodeType !== 1) return;
    var tag = n.localName;
    if (tag === 'sc-if') {
      var m = (n.getAttribute('value') || '').match(WHOLE);
      if (m && lookup(m[1], scopes)) renderNodes(n.childNodes, scopes, parent);
      return;
    }
    if (tag === 'sc-for') {
      var lm = (n.getAttribute('list') || '').match(WHOLE);
      var list = (lm && lookup(lm[1], scopes)) || [];
      var as = n.getAttribute('as') || 'item';
      for (var k = 0; k < list.length; k++) {
        var scope = { $index: k };
        scope[as] = list[k];
        renderNodes(n.childNodes, [scope].concat(scopes), parent);
      }
      return;
    }
    var el = document.createElementNS(n.namespaceURI, n.localName);
    for (var a = 0; a < n.attributes.length; a++) {
      var attr = n.attributes[a];
      if (attr.name.indexOf('hint-') === 0) continue;
      var whole = attr.value.match(WHOLE);
      if (/^on[a-z]+$/i.test(attr.name) && whole) {
        var fn = lookup(whole[1], scopes);
        if (typeof fn === 'function') el.addEventListener(attr.name.slice(2).toLowerCase(), fn);
        continue;
      }
      el.setAttribute(attr.name, interp(attr.value, scopes));
    }
    renderNodes(n.childNodes, scopes, el);
    parent.appendChild(el);
  }

  function readProps() {
    var defs = window.WZQ_PROPS || {};
    var props = {};
    Object.keys(defs).forEach(function (k) { if (k.charAt(0) !== '$') props[k] = defs[k].default; });
    var q = new URLSearchParams(location.search);
    if (q.has('embed')) document.documentElement.classList.add('embed');
    q.forEach(function (v, k) { if (k !== 'embed') props[k] = v === 'true' ? true : v === 'false' ? false : v; });
    return props;
  }

  var root, tpl, comp;
  function render() {
    var vals = comp.renderVals();
    root.replaceChildren();
    renderNodes(tpl.content.childNodes, [vals], root);
  }

  window.DCLogic = function DCLogic(props) { this.props = props; this.state = undefined; };
  window.DCLogic.prototype.setState = function (patch) {
    this.state = Object.assign({}, this.state || {}, patch);
    render();
  };

  window.WZQ_MOUNT = function (Component) {
    root = document.getElementById('app');
    tpl = document.getElementById('screen');
    comp = new Component(readProps());
    render();
  };
})();
