import { $, $$, FetchValueFunction, FetchValueForKeyCreatorFunction, CachedValue, MapOfCachedValues } from './cached-value'
import { Dispatch } from 'redux';

// https://www.reddit.com/r/typescript/comments/6cljb3/is_it_possible_to_add_methods_to_functions_in/
export namespace $A {
  export const set = <T>(cacheName: string, value: T) : ICacheSetAction<T> => {
    return { type: `${cacheName}/set`, payload: { value } }
  }

  export const setAtKey = <T>(cacheName: string, keyInMap: string, value: T): ICacheSetAction<T> => {
    return { type: `${cacheName}/${keyInMap}/set`, payload: { value } }
  }

  export const get = (cacheName: string, payload?: any): ICacheGetAction => {
    return { type: `${cacheName}/get`, payload }
  }
   
  export const getAtKey = (cacheName: string, keyInMap: string, payload?: any): ICacheGetAction => {
    return { type: `${cacheName}/${keyInMap}/get`, payload }
  }

  export const loading = (cacheName: string): ICacheLoadingAction => ({
    type: `${cacheName}/loading`
  })

  export const loadingFailed = (cacheName: string, error: Error): ICacheLoadingFailedAction => ({
    type: `${cacheName}/loading-failed`,
    payload: error
  })

  export interface DecomposedCacheActionType {
    cacheName: string
    cacheAction: string
    keyInMap?: string
  }

  export const decomposeCacheActionType = (action: { type: string }): DecomposedCacheActionType | null => {
    const splittedType = action.type.split("/")
    switch(splittedType.length) {
      case 2:
        /* cached value */
        return { cacheName: splittedType[0], cacheAction: splittedType[1] }
      case 3:
        /* map of cached value */
        return { cacheName: splittedType[0], keyInMap: splittedType[1], cacheAction: splittedType[2] }
      default:
        return null
        // throw new Error(`Unable to decompose the type of the cache action: ${action.type} (expected: "cacheName/action" or "cacheName/key/action")`)
    }
  }
}

export interface ICacheSetAction<T> {
  type: string, 
  payload: { value: T }
}

export interface ICacheGetAction { type: string, payload?: any }
export interface ICacheLoadingAction { type: string }
export interface ICacheLoadingFailedAction { type: string, payload: Error }

export type ICacheAction<T> = ICacheGetAction | ICacheSetAction<T> | ICacheLoadingAction | ICacheLoadingFailedAction

export type ValueReducerFunction<T> = (value: T) => T

export type DataMappingFunction<T> = (payload: any) => T

export function createCacheReducer<T>(cacheName: string, defaultStateOrValue: $<T> | T, fetch?: FetchValueFunction<T>, dataObjectMapping?: DataMappingFunction<T>) {
  let defaultState : $<T>
  if (defaultStateOrValue instanceof CachedValue) {
    defaultState = defaultStateOrValue as $<T>
  } else {
    if (!fetch) { throw new Error("You should specify the fetch function when you pass a value in defaultStateOrValue.") }
    defaultState = $<T>(defaultStateOrValue as T, cacheName, fetch);
  }

  if (!dataObjectMapping) {
    dataObjectMapping = (payload: any) => payload as T
  }

  const reducer = (state = defaultState, action: ICacheSetAction<T>): $<T> => {
    const decomposedActionType = $A.decomposeCacheActionType(action)

    if (!decomposedActionType) { return state }

    if (decomposedActionType.cacheName !== cacheName) { return state }

    switch (decomposedActionType.cacheAction) {
      case 'set':
        return state.asLoaded(dataObjectMapping!(action.payload.value))
      case 'get':
        console.error("Got get action in the action reducer.")
        return state;
      case 'loading':
        return state.asLoading();
      case 'loading-failed':
        return state.asFailed();
    }

    throw new Error("Unknown cache action: " + decomposedActionType.cacheAction)
  }

  return reducer
}

export function createMapCacheReducer<T>(cacheName: string, defaultStateOrValue: $$<T> | T, getFetchForKey?: FetchValueForKeyCreatorFunction<T>, dataObjectMapping?: DataMappingFunction<T>) {
  let defaultState: $$<T>
  if (defaultStateOrValue instanceof MapOfCachedValues) {
    defaultState = defaultStateOrValue as $$<T>
  } else {
    if (!getFetchForKey) { throw new Error("You should specify the geFetchForKey function when you pass a value in defaultStateOrValue.") }
    defaultState = $$<T>(defaultStateOrValue as T, cacheName, getFetchForKey);
  }

  if (!dataObjectMapping) {
    dataObjectMapping = (payload: any) => payload as T
  }

  const reducer = (state = defaultState, action: ICacheSetAction<T>): $$<T> => {
    const decomposedActionType = $A.decomposeCacheActionType(action)

    if (!decomposedActionType) { return state }

    if (decomposedActionType.cacheName !== cacheName) { return state }

    if (!decomposedActionType.keyInMap) {
      console.error("Unable to find the map key in the cache action type: " + action.type)
      return state;
    }

    switch (decomposedActionType.cacheAction) {
      case 'set':
        return state.setAsLoaded(decomposedActionType.keyInMap, dataObjectMapping!(action.payload.value))
      case 'get':
        console.error("Got get action in the action reducer.")
        return state;
      case 'loading':
        return state.setAsLoading(decomposedActionType.keyInMap)
      case 'loadingFailed':
        console.warn(`An error occured when loading the value ${decomposedActionType.cacheName}`, action.payload)
        return state.setAsFailed(decomposedActionType.keyInMap)
    }

    throw new Error("Unknown cache action: " + decomposedActionType.cacheAction)
  }

  return reducer
}

const _watermark = Math.random()
function watermark(action: any) {
  action.__cache_redux_middleware_watermark = _watermark
}
function hasWatermark(action: any) {
  return (action.__cache_redux_middleware_watermark === _watermark)
}

export type InjectFunction<T> = (creator: (...injectedService: any[]) => T, extraServices?: { [serviceName: string]: any }) => T
export function fetchCachedValue<T>(dispatch: Dispatch<ICacheAction<T>>, inject: InjectFunction<Promise<T>|null>) {
  return async (cachedValue: $<T>): Promise<void> => {
    /* Watermark: side effect in the value */
    if (hasWatermark(cachedValue)) { /* ignore the action if the value is already watermarked */ return }
    watermark(cachedValue)
    /* ***** */

    const cacheName = cachedValue.cacheName();
    
    dispatch($A.loading(cacheName))

    try {
      const value: Promise<T> | null = inject(cachedValue.fetch, { dispatch });
      if(value===null) { /* the fetch is not actually returning the value */ return; }
      dispatch($A.set(cacheName, await value))
    } catch(error) {
      console.error("An error occured when fetching the value of cache with name " + cacheName, error);
      dispatch($A.loadingFailed(cacheName, error));
    }
  }
}