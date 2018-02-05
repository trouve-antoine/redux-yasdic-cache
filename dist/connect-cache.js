"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const prp = require("prop-types");
const cached_value_1 = require("./cached-value");
const cache_actions_1 = require("./cache-actions");
function connectCache(component) {
    const uncacheAllPropsValues = (props) => {
        const propsWithoutCache = {}; /* PropsWithoutCacheT */
        Object.keys(props).forEach(propName => {
            const propValue = props[propName];
            const propUncachedValue = uncachePropValue(propValue);
            propsWithoutCache[propName] = propUncachedValue;
        });
        return propsWithoutCache;
    };
    const uncachePropValue = (propValue) => {
        if (!cached_value_1.isCachedValue(propValue)) {
            return propValue;
        }
        const $pv = propValue;
        if ($pv.isFailed()) {
            console.warn(`An error occured when loading the value ${$pv.cacheName()}`);
        }
        return $pv.value();
    };
    const ensurePropsInCache = (fetchDataInCache) => (props) => {
        const cachedProps = filterInCachedProps(props);
        Object.keys(cachedProps).forEach(propName => {
            const propValue = cachedProps[propName];
            if (propValue.shouldLoad()) {
                fetchDataInCache(propValue);
            }
        });
    };
    const filterInCachedProps = (props) => {
        const cachedProps = {};
        Object.keys(props).forEach(propName => {
            const propValue = props[propName];
            if (cached_value_1.isCachedValue(propValue)) {
                cachedProps[propName] = propValue;
            }
        });
        return cachedProps;
    };
    return _a = class extends React.Component {
            componentWillMount() { this.ensureDataInCache(this.props); }
            componentWillReceiveProps(newProps) { this.ensureDataInCache(newProps); }
            ensureDataInCache(props) {
                const dispatch = this.context && this.context.store
                    && this.context.store.dispatch;
                const inject = this.context && this.context.serviceContainer
                    && this.context.serviceContainer.inject.bind(this.context.serviceContainer);
                if (!dispatch) {
                    console.error("Unable to find the dispatch function. Do you use redux?");
                    return;
                }
                if (!inject) {
                    console.error("Unable to find the inject function. Do you use YASDIC ?");
                    return;
                }
                const fetchDataInCache = cache_actions_1.fetchCachedValue(dispatch, inject);
                ensurePropsInCache(fetchDataInCache)(props);
            }
            render() {
                return React.createElement(component, uncacheAllPropsValues(this.props));
            }
        },
        _a.contextTypes = {
            serviceContainer: prp.any.isRequired,
            store: prp.any.isRequired
        },
        _a;
    var _a;
}
exports.connectCache = connectCache;
//# sourceMappingURL=connect-cache.js.map