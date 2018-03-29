import * as React from 'react'
import * as prp from 'prop-types'

import { isCachedValue, $ } from './cached-value'

import { fetchCachedValue } from "./cache-actions";

export function connectCache<PropsWithoutCacheT, PropsWithCacheT>(
  component: React.ComponentType<PropsWithoutCacheT>) : React.ComponentType<PropsWithCacheT>
{
  const uncacheAllPropsValues = (props: PropsWithCacheT) : PropsWithoutCacheT => {
    const propsWithoutCache: any = { }; /* PropsWithoutCacheT */

    Object.keys(props).forEach(propName => {
      const propValue: any = (props as any)[propName];
      const propUncachedValue = uncachePropValue(propValue);
      propsWithoutCache[propName] = propUncachedValue;
    })

    return propsWithoutCache;
  }

  const uncachePropValue = (propValue: any) => {
    if (!propValue) { return propValue; }
    /* TODO: also support objects, maps, etc ... */
    if(propValue.constructor === Array) {
      return propValue.map((v:any) => uncachePropValue(v))
    }

    if (!isCachedValue(propValue)) { return propValue }
    const $pv: $<any> = propValue;
    if ($pv.isFailed()) {
      console.warn(`An error occured when loading the value ${$pv.cacheName()}`);
    }
    return $pv.value();
  }

  type FetchDataInCacheFunction = (cachedValue: $<any>) => void
  const ensureAllPropsInCache = (fetchDataInCache: FetchDataInCacheFunction) => (props: PropsWithCacheT): void => {
    Object.keys(props).forEach(propName => {
      const propValue: any = (props as any)[propName];
      ensurePropInCache(propValue, fetchDataInCache)
    })
  }

  const ensurePropInCache = (propValue: any, fetchDataInCache: FetchDataInCacheFunction): void => {
    if (!propValue) { return propValue; }
    if (propValue.constructor === Array) {
      /* TODO: also support objects, maps, etc ... */
      return propValue.forEach((v: any) =>
        ensurePropInCache(v, fetchDataInCache)
      )
    }

    if (!isCachedValue(propValue)) { return }

    if (propValue.shouldLoad()) {
      fetchDataInCache(propValue)
    }
  }

  return class extends React.Component<PropsWithCacheT> {
    static contextTypes = {
      serviceContainer: prp.any.isRequired,
      store: prp.any.isRequired
    }
    componentWillMount() { this.ensureDataInCache(this.props) }
    componentWillReceiveProps(newProps: PropsWithCacheT) { this.ensureDataInCache(newProps) }
    ensureDataInCache(props: PropsWithCacheT) {
      const dispatch = this.context && this.context.store
        && this.context.store.dispatch
      const inject = this.context && this.context.serviceContainer
        && this.context.serviceContainer.inject.bind(this.context.serviceContainer)
      if(!dispatch) {
        console.error("Unable to find the dispatch function. Do you use redux?");
        return;
      }
      if (!inject) {
        console.error("Unable to find the inject function. Do you use YASDIC ?");
        return;
      }
      const fetchDataInCache = fetchCachedValue<any>(dispatch, inject)
      
      ensureAllPropsInCache(fetchDataInCache)(props)
    }

    render() {
      return React.createElement(component, uncacheAllPropsValues(this.props))
    }
  }
}