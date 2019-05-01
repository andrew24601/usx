export var matchPx = /^(left|top|right|bottom|width|height|(margin|padding|border)(Left|Top|Right|Bottom)?(Width)?|border(Top|Bottom)?(Left|Right)?Radius|(min|max)Width|flexBasis|fontSize)$/;
var matchSVGEl = /^(svg|line|circle|rect|ellipse|path|image|poly(gon|line)|text(Path)?|g)$/;
var directAttribute = /^(value|checked)$/;
var isEvent = /^on[A-Z]/;
var SVGNS = "http://www.w3.org/2000/svg";
var Component = /** @class */ (function () {
    function Component(props, children) {
        this.props = props;
        this.children = children;
    }
    return Component;
}());
export { Component };
var StylesheetClass = /** @class */ (function () {
    function StylesheetClass(className, clause, defn, styleNode) {
        this.className = className;
        this.clause = clause;
        this.styleNode = styleNode;
        this._pieces = [];
        this._updates = [];
        this._pieces.push(this.clause + "{");
        this.compileDefinition(defn);
        this._pieces.push("}");
        this._update();
    }
    StylesheetClass.prototype.writeClause = function (idx, cssKey, k, val) {
        if (val == null) {
            this._pieces[idx] = "";
        }
        else {
            this._pieces[idx] = cssKey + ":" + formatStyleProp(k, val);
        }
    };
    StylesheetClass.prototype.compileClause = function (k, v) {
        var _this = this;
        var cssKey = k.replace(/[A-Z]/g, function (v) { return "-" + v.toLowerCase(); });
        var idx = this._pieces.push("") - 1;
        if (typeof v === "function") {
            this._updates.push(function () {
                _this.writeClause(idx, cssKey, k, v());
            });
        }
        else {
            this.writeClause(idx, cssKey, k, v);
        }
    };
    StylesheetClass.prototype.compileDefinition = function (defn) {
        var _this = this;
        Object.keys(defn).forEach(function (k) {
            _this.compileClause(k, defn[k]);
            _this._pieces.push(";");
        });
    };
    StylesheetClass.prototype.withSubRule = function (clause, defn) {
        this._pieces.push(this.clause + " " + clause + "{");
        this.compileDefinition(defn);
        this._pieces.push("}");
        this._update();
        return this;
    };
    StylesheetClass.prototype.withMediaQuery = function (condition, defn) {
        var _this = this;
        this._pieces.push("@media ");
        var keys = Object.keys(condition);
        keys.forEach(function (k, idx) {
            if (idx > 0)
                _this._pieces.push(" and ");
            _this._pieces.push("(");
            _this.compileClause(k, condition[k]);
            _this._pieces.push(")");
        });
        this._pieces.push(" {" + this.clause + " {");
        this.compileDefinition(defn);
        this._pieces.push("}}");
        this._update();
        return this;
    };
    StylesheetClass.prototype._update = function () {
        this._updates.forEach(function (cb) { return cb(); });
        this.styleNode.textContent = this._pieces.join("");
    };
    return StylesheetClass;
}());
function formatStyleProp(k, val) {
    if (typeof val === "number" && matchPx.test(k))
        return val + "px";
    else
        return val;
}
var styleSheet;
var UIUpdateContext = /** @class */ (function () {
    function UIUpdateContext() {
        this._dirty = false;
    }
    UIUpdateContext.prototype.dirty = function () {
        this._dirty = true;
    };
    return UIUpdateContext;
}());
export { UIUpdateContext };
var elementMap = new Map();
var inUpdateUI = false;
function updateUI() {
    if (inUpdateUI) {
        return;
    }
    inUpdateUI = true;
    try {
        var contextMap_1 = new Map();
        elementMap.forEach(function (map) {
            if (map.context) {
                var context_1 = map.context;
                if (!context_1._dirty)
                    return;
                contextMap_1.set(context_1, true);
            }
            for (var _i = 0, _a = map.update; _i < _a.length; _i++) {
                var cb = _a[_i];
                cb();
            }
        });
        contextMap_1.forEach(function (_, context) {
            context._dirty = false;
        });
    }
    finally {
        inUpdateUI = false;
    }
}
function action(fn) {
    try {
        return fn();
    }
    finally {
        updateUI();
    }
}
function unmountUI(el) {
    try {
        var ed = elementMap.get(el);
        if (ed)
            for (var _i = 0, _a = ed.unmount; _i < _a.length; _i++) {
                var cb = _a[_i];
                cb();
            }
    }
    finally {
        elementMap.delete(el);
    }
    for (var c = el.firstElementChild; c; c = c.nextElementSibling) {
        unmountUI(c);
    }
}
function clearUI() {
    elementMap.clear();
}
function dataForEl(el) {
    var ed = elementMap.get(el);
    if (ed == null) {
        elementMap.set(el, ed = {
            context: getContext().context,
            update: [],
            unmount: []
        });
    }
    return ed;
}
export function usxStyle(a, b) {
    var styleNode = document.createTextNode("");
    var className = typeof a === "string" ? null : "c" + Math.random().toString(16).substring(2);
    var clause = typeof a === "string" ? a : "." + className;
    var styles = typeof a === "string" ? b : a;
    var cls = new StylesheetClass(className, clause, styles, styleNode);
    if (styleSheet == null) {
        styleSheet = document.createElement("style");
        document.head.appendChild(styleSheet);
    }
    styleSheet.appendChild(styleNode);
    onUpdateUI(styleSheet, function () {
        cls._update();
    });
    return cls;
}
function onUpdateUI(el, callback) {
    dataForEl(el).update.push(callback);
    callback();
}
function onUnmountUI(el, callback) {
    dataForEl(el).unmount.push(callback);
}
function applyStyleProp(el, k, val) {
    el.style[k] = formatStyleProp(k, val);
}
function formatAttr(val) {
    if (val instanceof Array) {
        return val.filter(function (v) { return v != null; }).map(function (k) { return formatAttr(k); }).join(" ");
    }
    else if (val instanceof StylesheetClass)
        return val.className;
    else
        return val;
}
function applyAttribute(el, k, val) {
    if (k.startsWith("__"))
        return;
    if (el.tagName === "INPUT" && directAttribute.test(k))
        el[k] = val;
    else if (val != null)
        el.setAttribute(k, formatAttr(val));
    else
        el.removeAttribute(k);
}
function needsApply(val) {
    return (typeof val === 'function');
}
function applyValue(el, pval, callback) {
    if (typeof pval === 'function') {
        onUpdateUI(el, function () { return callback(pval()); });
    }
    else {
        callback(pval);
    }
}
function setAttribute(el, prop, val) {
    if (val == null) {
        return;
    }
    if (isEvent.test(prop)) {
        if (typeof val === "function") {
            el.addEventListener(prop.substr(2).toLowerCase(), function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return action(val.bind.apply(val, [this].concat(args)));
            });
        }
        /* develblock:start */
        else
            console.log("non-function event");
        /* develblock:end */
    }
    else if (prop === "style") {
        if (typeof val === "object" && val != null) {
            Object.keys(val).forEach(function (k) {
                var stylePropVal = val[k];
                applyValue(el, stylePropVal, function (v) { return applyStyleProp(el, k, v); });
            });
        }
    }
    else {
        applyValue(el, val, function (v) { return applyAttribute(el, prop, v); });
    }
}
function applyContent(el, c1, c2, v) {
    while (c1.nextSibling != c2) {
        el.removeChild(c1.nextSibling);
    }
    append(el, v, c2);
}
function propsWithContext(props) {
    var mergedProps = {};
    for (var k in currentContext) {
        mergedProps[k] = currentContext[k];
    }
    for (var k in props) {
        mergedProps[k] = props[k];
    }
    return mergedProps;
}
function append(el, c, before) {
    if (c == null)
        return;
    if (c instanceof Node) {
        if (before)
            el.insertBefore(c, before);
        else
            el.appendChild(c);
    }
    else if (c instanceof Array) {
        c.forEach(function (i) { return append(el, i, before); });
    }
    else if (c instanceof Component) {
        append(el, c._render, before);
    }
    else if (needsApply(c)) {
        var c1_1 = document.createTextNode("");
        var c2_1 = document.createTextNode("");
        el.appendChild(c1_1);
        el.appendChild(c2_1);
        applyValue(el, c, function (v) { return applyContent(el, c1_1, c2_1, v); });
    }
    else if (before) {
        el.insertBefore(document.createTextNode("" + c), before);
    }
    else {
        el.appendChild(document.createTextNode("" + c));
    }
}
function usx(tag, props) {
    var children = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        children[_i - 2] = arguments[_i];
    }
    if (typeof tag === 'string') {
        var el_1 = matchSVGEl.test(tag) ? document.createElementNS(SVGNS, tag) : document.createElement(tag);
        append(el_1, children, null);
        if (props != null) {
            Object.keys(props).forEach(function (k) { return setAttribute(el_1, k, props[k]); });
        }
        return el_1;
    }
    else if (typeof tag === "function" && tag.prototype instanceof Component) {
        var mergeProps = propsWithContext(props);
        var instance = new tag(mergeProps, children);
        instance._render = instance.render(mergeProps, children);
        return instance;
    }
    else if (typeof tag === 'function') {
        return tag(propsWithContext(props), children);
    }
    else {
        return null;
    }
}
usx.update = updateUI;
usx.onUpdate = onUpdateUI;
usx.onUnmount = onUnmountUI;
usx.unmount = unmountUI;
usx.clear = clearUI;
export default usx;
var currentContext = {};
export function getContext() {
    return currentContext;
}
export function withContext(newContext, callback) {
    var savedContext = currentContext;
    try {
        currentContext = {};
        for (var k in savedContext) {
            currentContext[k] = savedContext[k];
        }
        for (var k in newContext) {
            currentContext[k] = newContext[k];
        }
        callback();
    }
    finally {
        currentContext = savedContext;
    }
}
var Store = /** @class */ (function () {
    function Store(props) {
        var _this = this;
        this.props = props;
        this.state = props.initialState;
        if (window["__REDUX_DEVTOOLS_EXTENSION__"]) {
            var serialInit_1 = JSON.stringify(this.toJS(this.state));
            this.devTools = window["__REDUX_DEVTOOLS_EXTENSION__"].connect({
                name: props.name,
                features: {
                    persist: true,
                    export: true,
                    import: 'custom',
                    jump: true,
                    skip: false
                }
            });
            this.devTools.init(this.toJS(this.state));
            this.devToolsUnsubscribe = this.devTools.subscribe(function (message) {
                if (message.type === "DISPATCH") {
                    switch (message.payload.type) {
                        case "RESET":
                            _this._resetState(_this.fromJS(JSON.parse(serialInit_1)));
                            _this.devTools.init(_this.toJS(_this.state));
                            break;
                        case "COMMIT":
                            _this.devTools.init(_this.toJS(_this.state));
                            break;
                        case "ROLLBACK":
                            _this._resetState(_this.fromJS(JSON.parse(message.state)));
                            _this.devTools.init(_this.toJS(_this.state));
                            break;
                        case "JUMP_TO_STATE":
                        case "JUMP_TO_ACTION":
                            _this._resetState(_this.fromJS(JSON.parse(message.state)));
                            break;
                        case 'IMPORT_STATE': {
                            var nextLiftedState = message.payload.nextLiftedState;
                            var computedStates = nextLiftedState.computedStates;
                            _this._resetState(_this.fromJS(computedStates[computedStates.length - 1].state));
                            _this.devTools.send(null, nextLiftedState);
                            return;
                        }
                    }
                }
            });
        }
    }
    Store.prototype._dispatch = function (action) {
        if (this.devTools)
            this.devTools.send(action, this.toJS(this.state));
        if (this.props.uiContexts) {
            for (var _i = 0, _a = this.props.uiContexts; _i < _a.length; _i++) {
                var ctx = _a[_i];
                ctx.dirty();
            }
        }
    };
    Store.prototype._resetState = function (newState) {
        this.state = newState;
        if (this.props.onReset)
            this.props.onReset();
        usx.update();
    };
    Store.prototype.toJS = function (state) {
        return state;
    };
    Store.prototype.fromJS = function (json) {
        return json;
    };
    Store.prototype.close = function () {
        if (this.devToolsUnsubscribe) {
            this.devToolsUnsubscribe();
            delete this.devTools;
            delete this.devToolsUnsubscribe;
        }
    };
    return Store;
}());
export { Store };
