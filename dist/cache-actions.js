"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// https://www.reddit.com/r/typescript/comments/6cljb3/is_it_possible_to_add_methods_to_functions_in/
var $A;
(function ($A) {
    $A.set = (cacheName, value) => ({
        type: `${cacheName}/set`,
        payload: { value }
    });
    $A.get = (cacheName) => ({
        type: `${cacheName}/get`
    });
    $A.loading = (cacheName) => ({
        type: `${cacheName}/loading`
    });
    $A.loadingFailed = (cacheName, error) => ({
        type: `${cacheName}/loading-failed`,
        payload: error
    });
    $A.decomposeCacheActionType = (action) => {
        const splittedType = action.type.split("/");
        switch (splittedType.length) {
            case 2:
                /* cached value */
                return { cacheName: splittedType[0], cacheAction: splittedType[1] };
            case 3:
                /* map of cached value */
                return { cacheName: splittedType[0], keyInMap: splittedType[1], cacheAction: splittedType[2] };
            default:
                return null;
        }
    };
})($A = exports.$A || (exports.$A = {}));
function createCacheReducer(cacheName, defaultState) {
    const reducer = (state = defaultState, action) => {
        const decomposedActionType = $A.decomposeCacheActionType(action);
        if (!decomposedActionType) {
            return state;
        }
        if (decomposedActionType.cacheName !== cacheName) {
            return state;
        }
        switch (decomposedActionType.cacheAction) {
            case 'set':
                return state.asLoaded(action.payload.value);
            case 'get':
                console.error("Got get action in the action reducer.");
                return state;
            case 'loading':
                return state.asLoading();
            case 'loadingFailed':
                return state.asFailed();
        }
        throw new Error("Unknown cache action: " + decomposedActionType.cacheAction);
    };
    return reducer;
}
exports.createCacheReducer = createCacheReducer;
function createMapCacheReducer(cacheName, defaultState) {
    const reducer = (state = defaultState, action) => {
        const decomposedActionType = $A.decomposeCacheActionType(action);
        if (!decomposedActionType) {
            return state;
        }
        if (decomposedActionType.cacheName !== cacheName) {
            return state;
        }
        if (!decomposedActionType.keyInMap) {
            console.error("Unable to find the map key in the cache action type: " + action.type);
            return state;
        }
        switch (decomposedActionType.cacheAction) {
            case 'set':
                return state.setAsLoaded(decomposedActionType.keyInMap, action.payload.value);
            case 'get':
                console.error("Got get action in the action reducer.");
                return state;
            case 'loading':
                return state.setAsLoading(decomposedActionType.keyInMap);
            case 'loadingFailed':
                return state.setAsFailed(decomposedActionType.keyInMap);
        }
        throw new Error("Unknown cache action: " + decomposedActionType.cacheAction);
    };
    return reducer;
}
exports.createMapCacheReducer = createMapCacheReducer;
const _watermark = Math.random();
function watermark(action) {
    action.__cache_redux_middleware_watermark = _watermark;
}
function hasWatermark(action) {
    return (action.__cache_redux_middleware_watermark === _watermark);
}
function fetchCachedValue(dispatch, inject) {
    return (cachedValue) => {
        /* Watermark: side effect in the value */
        if (hasWatermark(cachedValue)) {
            return;
        }
        watermark(cachedValue);
        /* ***** */
        const cacheName = cachedValue.cacheName();
        dispatch($A.loading(cacheName));
        inject(cachedValue.fetch)
            .then((value) => {
            dispatch($A.set(cacheName, value));
        })
            .catch((error) => {
            dispatch($A.loadingFailed(cacheName, error));
        });
    };
}
exports.fetchCachedValue = fetchCachedValue;
//# sourceMappingURL=cache-actions.js.map