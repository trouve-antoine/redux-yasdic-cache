"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function $(defaultValue, cacheName, fetchValue) {
    return new CachedValue(defaultValue, cacheName, fetchValue);
}
exports.$ = $;
function $$(defaultValue, cacheName, getFetchValueForKey) {
    return new MapOfCachedValues(defaultValue, cacheName, getFetchValueForKey);
}
exports.$$ = $$;
(function ($$) {
    function entryCacheName(mapCacheName, key) {
        return `${mapCacheName}/${key}`;
    }
    $$.entryCacheName = entryCacheName;
    function mapCacheName(entryCacheName) {
        return entryCacheName.split("/")[0];
    }
    $$.mapCacheName = mapCacheName;
    function key(entryCacheName) {
        return entryCacheName.split("/")[1];
    }
    $$.key = key;
})($$ = exports.$$ || (exports.$$ = {}));
function isCachedValue(o) {
    return Boolean(o && o.__cached);
}
exports.isCachedValue = isCachedValue;
class MapOfCachedValues {
    constructor(defaultValue, cacheName, getFetchForKey, 
        /* for private use */ __map = new Map()) {
        this.__defaultValue = defaultValue;
        this.__getFetchForKey = getFetchForKey;
        this.__cacheName = cacheName;
        this.__map = __map;
    }
    get(key) {
        if (this.__map.has(key)) {
            return this.__map.get(key);
        }
        const newValueForKey = $(this.__defaultValue, $$.entryCacheName(this.__cacheName, key), this.__getFetchForKey(key));
        this.__map.set(key, newValueForKey);
        return newValueForKey;
    }
    setAsLoaded(key, value) {
        const currentValue = this.get(key);
        return this.set(key, currentValue.asLoaded(value));
    }
    setAsLoading(key) {
        const currentValue = this.get(key);
        return this.set(key, currentValue.asLoading());
    }
    setAsFailed(key) {
        const currentValue = this.get(key);
        return this.set(key, currentValue.asFailed());
    }
    set(key, newValue) {
        this.__map.set(key, newValue);
        return new MapOfCachedValues(this.__defaultValue, this.__cacheName, this.__getFetchForKey, this.__map);
    }
}
exports.MapOfCachedValues = MapOfCachedValues;
class CachedValue {
    constructor(value, cacheName, fetch) {
        this.__loaded = false;
        this.__loading = false;
        this.__loadingFailed = false;
        this.__cached = true;
        this.__value = value;
        this.fetch = fetch;
        this.__cacheName = cacheName;
    }
    __assertIsCachedValue() { }
    value() {
        this.__assertIsCachedValue();
        return this.__value;
    }
    cacheName() {
        this.__assertIsCachedValue();
        return this.__cacheName;
    }
    shouldLoad() {
        this.__assertIsCachedValue();
        return !(this.__loaded || this.__loading || this.__loadingFailed);
    }
    isLoaded() {
        this.__assertIsCachedValue();
        return this.__loaded;
    }
    isLoading() {
        this.__assertIsCachedValue();
        return this.__loading;
    }
    isFailed() {
        this.__assertIsCachedValue();
        return this.__loadingFailed;
    }
    asLoading() {
        this.__assertIsCachedValue();
        const o = new CachedValue(this.__value, this.__cacheName, this.fetch);
        o.__loaded = false;
        o.__loadingFailed = false;
        o.__loading = true;
        return o;
    }
    asFailed() {
        this.__assertIsCachedValue();
        const o = new CachedValue(this.__value, this.__cacheName, this.fetch);
        o.__loaded = false;
        o.__loadingFailed = true;
        o.__loading = false;
        return o;
    }
    asLoaded(newValue) {
        this.__assertIsCachedValue();
        const o = new CachedValue(newValue, this.__cacheName, this.fetch);
        o.__loaded = true;
        o.__loadingFailed = false;
        o.__loading = false;
        o.__value = newValue;
        return o;
    }
}
exports.CachedValue = CachedValue;
//# sourceMappingURL=cached-value.js.map