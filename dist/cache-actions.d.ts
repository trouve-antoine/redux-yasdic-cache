import { $, $$, FetchValueFunction, FetchValueForKeyCreatorFunction } from './cached-value';
import { Dispatch } from 'redux';
export declare namespace $A {
    const set: <T>(cacheName: string, value: T) => ICacheSetAction<T>;
    const setAtKey: <T>(cacheName: string, keyInMap: string, value: T) => ICacheSetAction<T>;
    const get: (cacheName: string, payload?: any) => ICacheGetAction;
    const getAtKey: (cacheName: string, keyInMap: string, payload?: any) => ICacheGetAction;
    const loading: (cacheName: string) => ICacheLoadingAction;
    const loadingFailed: (cacheName: string, error: Error) => ICacheLoadingFailedAction;
    const invalidateKey: (cacheName: string) => ICacheInvalidateAction;
    const invalidateAtKey: (cacheName: string, keyInMap: string) => ICacheInvalidateAction;
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
export interface ICacheInvalidateAction {
    type: string;
}
export interface ICacheGetAction {
    type: string;
    payload?: any;
}
export interface ICacheLoadingAction {
    type: string;
}
export interface ICacheLoadingFailedAction {
    type: string;
    payload: Error;
}
export declare type ICacheAction<T> = ICacheGetAction | ICacheSetAction<T> | ICacheLoadingAction | ICacheLoadingFailedAction | ICacheInvalidateAction;
export declare type ValueReducerFunction<T> = (value: T) => T;
export declare type DataMappingFunction<T> = (payload: any) => T;
export declare function createCacheReducer<T>(cacheName: string, defaultStateOrValue: $<T> | T, fetch?: FetchValueFunction<T>, dataObjectMapping?: DataMappingFunction<T>): (state: $<T> | undefined, action: ICacheSetAction<T>) => $<T>;
export declare function createMapCacheReducer<T>(cacheName: string, defaultStateOrValue: $$<T> | T, getFetchForKey?: FetchValueForKeyCreatorFunction<T>, dataObjectMapping?: DataMappingFunction<T>): (state: $$<T> | undefined, action: ICacheSetAction<T>) => $$<T>;
export declare type InjectFunction<T> = (creator: (...injectedService: any[]) => T, extraServices?: {
    [serviceName: string]: any;
}) => T;
export declare function fetchCachedValue<T>(dispatch: Dispatch<ICacheAction<T>>, inject: InjectFunction<Promise<T> | null>): (cachedValue: $<T>) => Promise<void>;
