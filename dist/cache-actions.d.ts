import { $, $$ } from './cached-value';
import { Dispatch } from 'redux';
export declare namespace $A {
    const set: <T>(cacheName: string, value: T) => ICacheSetAction<T>;
    const get: (cacheName: string) => ICacheGetAction;
    const loading: (cacheName: string) => ICacheLoadingAction;
    const loadingFailed: (cacheName: string, error: Error) => ICacheLoadingFailedAction;
    interface DecomposedCacheActionType {
        cacheName: string;
        cacheAction: string;
        keyInMap?: string;
    }
    const decomposeCacheActionType: (action: {
        type: string;
    }) => DecomposedCacheActionType | null;
}
export interface ICacheSetAction<T> {
    type: string;
    payload: {
        value: T;
    };
}
export interface ICacheGetAction {
    type: string;
}
export interface ICacheLoadingAction {
    type: string;
}
export interface ICacheLoadingFailedAction {
    type: string;
    payload: Error;
}
export declare type ICacheAction<T> = ICacheGetAction | ICacheSetAction<T> | ICacheLoadingAction | ICacheLoadingFailedAction;
export declare type ValueReducerFunction<T> = (value: T) => T;
export declare function createCacheReducer<T>(cacheName: string, defaultState: $<T>): (state: $<T> | undefined, action: ICacheSetAction<T>) => $<T>;
export declare function createMapCacheReducer<T>(cacheName: string, defaultState: $$<T>): (state: $$<T> | undefined, action: ICacheSetAction<T>) => $$<T>;
export declare function fetchCachedValue<T>(dispatch: Dispatch<ICacheAction<T>>, inject: Function): (cachedValue: $<T>) => void;