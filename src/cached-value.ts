export interface $<T> {
  value: () => T
  cacheName: () => string
  shouldLoad: () => boolean
  isLoaded: () => boolean
  isLoading: () => boolean
  isFailed: () => boolean
  asLoading: () => $<T>
  asFailed: () => $<T>
  asLoaded: (newValue: T) => $<T>
  fetch: FetchValueFunction<T>
  asInvalid: () => $<T>
}

export interface $$<T> {
  get: (key: string) => $<T>
  setAsLoaded: (key: string, value: T) => $$<T>
  setAsLoading: (key: string) => $$<T>
  setAsFailed: (key: string) => $$<T>
  setAsInvalid: (key: string) => $$<T>
}

export type FetchValueForKeyCreatorFunction<T> = (key: string) => FetchValueFunction<T>
export type FetchValueFunction<T> = (...injectedService: any[]) => Promise<T> | null

export function $<T>(defaultValue: T, cacheName: string, fetchValue: FetchValueFunction<T>): $<T> {
  return new CachedValue(defaultValue, cacheName, fetchValue)
}

export function $$<T>(defaultValue: T, cacheName: string, getFetchValueForKey: FetchValueForKeyCreatorFunction<T>): $$<T> {
  return new MapOfCachedValues(defaultValue, cacheName, getFetchValueForKey)
}
export namespace $$ {
  export function entryCacheName(mapCacheName: string, key: string) {
    return `${mapCacheName}/${key}`
  }
  export function mapCacheName(entryCacheName: string) {
    return entryCacheName.split("/")[0]
  }
  export function key(entryCacheName: string) {
    return entryCacheName.split("/")[1]
  }
}

export function isCachedValue(o: any) {
  return Boolean(o && o.__cached)
}

export class MapOfCachedValues<T> implements $$<T> {
  private readonly __map: Map<string, $<T>>
  private readonly __defaultValue: T
  private readonly __cacheName: string
  private readonly __getFetchForKey: FetchValueForKeyCreatorFunction<T>

  constructor(defaultValue: T, cacheName: string, getFetchForKey: FetchValueForKeyCreatorFunction<T>,
    /* for private use */__map = new Map<string, $<T>>())
  {
    this.__defaultValue = defaultValue
    this.__getFetchForKey = getFetchForKey
    this.__cacheName = cacheName
    this.__map = __map
  }

  get(key: string) {
    if(this.__map.has(key)) { return this.__map.get(key)!; }
    const newValueForKey = $(
      this.__defaultValue,
      $$.entryCacheName(this.__cacheName, key),
      this.__getFetchForKey(key)
    )
    this.__map.set(key, newValueForKey)
    return newValueForKey as $<T>
  }

  setAsLoaded(key: string, value: T) {
    const currentValue = this.get(key)
    return this.set(key, currentValue.asLoaded(value))
  }

  setAsLoading(key: string) {
    const currentValue = this.get(key)
    return this.set(key, currentValue.asLoading())
  }

  setAsFailed(key: string) {
    const currentValue = this.get(key)
    return this.set(key, currentValue.asFailed())
  }

  set(key: string, newValue: $<T>) {
    this.__map.set(key, newValue)
    return new MapOfCachedValues(
      this.__defaultValue,
      this.__cacheName,
      this.__getFetchForKey,
      this.__map
    )
  }
  
  setAsInvalid(key: string) {
    const currentValue = this.get(key)
    return this.set(key, currentValue.asInvalid())
  }
}

export class CachedValue<T> implements $<T> {
  private __loaded = false
  private __loading = false
  private __loadingFailed = false
  private __value: T
  private __cacheName: string
  public fetch: FetchValueFunction<T>

  __cached = true
  private __assertIsCachedValue() { /* nothing */ }

  constructor(value: T, cacheName: string, fetch: FetchValueFunction<T>) {
    this.__value = value
    this.fetch = fetch
    this.__cacheName = cacheName
  }

  value() {
    this.__assertIsCachedValue()
    return this.__value
  }

  cacheName() {
    this.__assertIsCachedValue()
    return this.__cacheName
  }

  shouldLoad() {
    this.__assertIsCachedValue()
    return !(this.__loaded || this.__loading || this.__loadingFailed)
  }
  isLoaded() {
    this.__assertIsCachedValue()
    return this.__loaded
  }
  isLoading() {
    this.__assertIsCachedValue()
    return this.__loading
  }
  isFailed() {
    this.__assertIsCachedValue()
    return this.__loadingFailed
  }
  asLoading() {
    this.__assertIsCachedValue()
    const o = new CachedValue(this.__value, this.__cacheName, this.fetch)
    o.__loaded = false
    o.__loadingFailed = false
    o.__loading = true
    return o
  }
  asFailed() {
    this.__assertIsCachedValue()
    const o = new CachedValue(this.__value, this.__cacheName, this.fetch)
    o.__loaded = false
    o.__loadingFailed = true
    o.__loading = false
    return o
  }
  asLoaded(newValue: T) {
    this.__assertIsCachedValue()
    const o = new CachedValue(newValue, this.__cacheName, this.fetch)
    o.__loaded = true
    o.__loadingFailed = false
    o.__loading = false
    o.__value = newValue
    return o
  }
  asInvalid() {
    this.__assertIsCachedValue()
    const o = new CachedValue(this.__value, this.__cacheName, this.fetch)
    o.__loaded = false
    o.__loadingFailed = false
    o.__loading = false
    return o
  }
}
