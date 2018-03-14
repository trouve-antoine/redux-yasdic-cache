export interface $<T> {
    value: () => T;
    cacheName: () => string;
    shouldLoad: () => boolean;
    isLoaded: () => boolean;
    isLoading: () => boolean;
    isFailed: () => boolean;
    asLoading: () => $<T>;
    asFailed: () => $<T>;
    asLoaded: (newValue: T) => $<T>;
    fetch: FetchValueFunction<T>;
    asInvalid: () => $<T>;
}
export interface $$<T> {
    get: (key: string) => $<T>;
    setAsLoaded: (key: string, value: T) => $$<T>;
    setAsLoading: (key: string) => $$<T>;
    setAsFailed: (key: string) => $$<T>;
    setAsInvalid: (key: string) => $$<T>;
}
export declare type FetchValueForKeyCreatorFunction<T> = (key: string) => FetchValueFunction<T>;
export declare type FetchValueFunction<T> = (...injectedService: any[]) => Promise<T> | null;
export declare function $<T>(defaultValue: T, cacheName: string, fetchValue: FetchValueFunction<T>): $<T>;
export declare function $$<T>(defaultValue: T, cacheName: string, getFetchValueForKey: FetchValueForKeyCreatorFunction<T>): $$<T>;
export declare namespace $$ {
    function entryCacheName(mapCacheName: string, key: string): string;
    function mapCacheName(entryCacheName: string): string;
    function key(entryCacheName: string): string;
}
export declare function isCachedValue(o: any): boolean;
export declare class MapOfCachedValues<T> implements $$<T> {
    private readonly __map;
    private readonly __defaultValue;
    private readonly __cacheName;
    private readonly __getFetchForKey;
    constructor(defaultValue: T, cacheName: string, getFetchForKey: FetchValueForKeyCreatorFunction<T>, __map?: Map<string, $<T>>);
    get(key: string): $<T>;
    setAsLoaded(key: string, value: T): MapOfCachedValues<T>;
    setAsLoading(key: string): MapOfCachedValues<T>;
    setAsFailed(key: string): MapOfCachedValues<T>;
    set(key: string, newValue: $<T>): MapOfCachedValues<T>;
    setAsInvalid(key: string): MapOfCachedValues<T>;
}
export declare class CachedValue<T> implements $<T> {
    private __loaded;
    private __loading;
    private __loadingFailed;
    private __value;
    private __cacheName;
    fetch: FetchValueFunction<T>;
    __cached: boolean;
    private __assertIsCachedValue();
    constructor(value: T, cacheName: string, fetch: FetchValueFunction<T>);
    value(): T;
    cacheName(): string;
    shouldLoad(): boolean;
    isLoaded(): boolean;
    isLoading(): boolean;
    isFailed(): boolean;
    asLoading(): CachedValue<T>;
    asFailed(): CachedValue<T>;
    asLoaded(newValue: T): CachedValue<T>;
    asInvalid(): CachedValue<T>;
}
