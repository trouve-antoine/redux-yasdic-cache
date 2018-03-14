"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cached_value_1 = require("./cached-value");
// https://www.reddit.com/r/typescript/comments/6cljb3/is_it_possible_to_add_methods_to_functions_in/
var $A;
(function ($A) {
    $A.set = (cacheName, value) => {
        return { type: `${cacheName}/set`, payload: { value } };
    };
    $A.setAtKey = (cacheName, keyInMap, value) => {
        return { type: `${cacheName}/${keyInMap}/set`, payload: { value } };
    };
    $A.get = (cacheName, payload) => {
        return { type: `${cacheName}/get`, payload };
    };
    $A.getAtKey = (cacheName, keyInMap, payload) => {
        return { type: `${cacheName}/${keyInMap}/get`, payload };
    };
    $A.loading = (cacheName) => ({
        type: `${cacheName}/loading`
    });
    $A.loadingFailed = (cacheName, error) => ({
        type: `${cacheName}/loading-failed`,
        payload: error
    });
    $A.invalidateKey = (cacheName) => {
        return { type: `${cacheName}/invalidate` };
    };
    $A.invalidateAtKey = (cacheName, keyInMap) => {
        return { type: `${cacheName}/${keyInMap}/invalidate` };
    };
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
function createCacheReducer(cacheName, defaultStateOrValue, fetch, dataObjectMapping) {
    let defaultState;
    if (defaultStateOrValue instanceof cached_value_1.CachedValue) {
        defaultState = defaultStateOrValue;
    }
    else {
        if (!fetch) {
            throw new Error("You should specify the fetch function when you pass a value in defaultStateOrValue.");
        }
        defaultState = cached_value_1.$(defaultStateOrValue, cacheName, fetch);
    }
    if (!dataObjectMapping) {
        dataObjectMapping = (payload) => payload;
    }
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
                return state.asLoaded(dataObjectMapping(action.payload.value));
            case 'get':
                console.error("Got get action in the action reducer.");
                return state;
            case 'loading':
                return state.asLoading();
            case 'loading-failed':
                return state.asFailed();
            case 'invalidate':
                return state.asInvalid();
        }
        throw new Error("Unknown cache action: " + decomposedActionType.cacheAction);
    };
    return reducer;
}
exports.createCacheReducer = createCacheReducer;
function createMapCacheReducer(cacheName, defaultStateOrValue, getFetchForKey, dataObjectMapping) {
    let defaultState;
    if (defaultStateOrValue instanceof cached_value_1.MapOfCachedValues) {
        defaultState = defaultStateOrValue;
    }
    else {
        if (!getFetchForKey) {
            throw new Error("You should specify the geFetchForKey function when you pass a value in defaultStateOrValue.");
        }
        defaultState = cached_value_1.$$(defaultStateOrValue, cacheName, getFetchForKey);
    }
    if (!dataObjectMapping) {
        dataObjectMapping = (payload) => payload;
    }
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
                return state.setAsLoaded(decomposedActionType.keyInMap, dataObjectMapping(action.payload.value));
            case 'get':
                console.error("Got get action in the action reducer.");
                return state;
            case 'loading':
                return state.setAsLoading(decomposedActionType.keyInMap);
            case 'loadingFailed':
                console.warn(`An error occured when loading the value ${decomposedActionType.cacheName}`, action.payload);
                return state.setAsFailed(decomposedActionType.keyInMap);
            case 'invalidate':
                return state.setAsInvalid(decomposedActionType.keyInMap);
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
    return (cachedValue) => __awaiter(this, void 0, void 0, function* () {
        /* Watermark: side effect in the value */
        if (hasWatermark(cachedValue)) {
            return;
        }
        watermark(cachedValue);
        /* ***** */
        const cacheName = cachedValue.cacheName();
        dispatch($A.loading(cacheName));
        try {
            const value = inject(cachedValue.fetch, { dispatch });
            if (value === null) {
                return;
            }
            dispatch($A.set(cacheName, yield value));
        }
        catch (error) {
            console.error("An error occured when fetching the value of cache with name " + cacheName, error);
            dispatch($A.loadingFailed(cacheName, error));
        }
    });
}
exports.fetchCachedValue = fetchCachedValue;
//# sourceMappingURL=cache-actions.js.map