import { Component, createElement } from 'react';
import hoistStatics from 'hoist-non-react-statics';
import PropTypes from 'prop-types';
export function isStateless(component) {
  return !(component.prototype && component.prototype.render);
}
const injectorContextTypes = {
  store: PropTypes.objectOrObservableObject
};
Object.seal(injectorContextTypes);

const proxiedInjectorProps = {
  contextTypes: {
    get: function() {
      return injectorContextTypes;
    },
    set: function(_) {
      console.warn('context不可以修改');
    },
    configurable: true,
    enumerable: false
  }
};

function createStoreInjector(grabStoresFn, component, injectNames) {
  let displayName =
    'inject-' +
    (component.displayName ||
      component.name ||
      (component.constructor && component.constructor.name) ||
      'Unknown');
  if (injectNames) displayName += '-with-' + injectNames;
  class Injector extends Component {
    static displayName = displayName;

    storeRef = instance => {
      this.wrappedInstance = instance;
    };

    render() {
      let newProps = {};
      for (let key in this.props) {
        if (this.props.hasOwnProperty(key)) {
          newProps[key] = this.props[key];
        }
      }
      var additionalProps =
        grabStoresFn(this.context.store || {}, newProps, this.context) || {};
      for (let key in additionalProps) {
        newProps[key] = additionalProps[key];
      }

      if (!isStateless(component)) {
        newProps.ref = this.storeRef;
      }

      return createElement(component, newProps);
    }
  }

  hoistStatics(Injector, component);

  Injector.wrappedComponent = component;
  Object.defineProperties(Injector, proxiedInjectorProps);

  return Injector;
}

//传递store属性
function grabStoresByName(storeNames) {
  return function(baseStores, nextProps) {
    storeNames.forEach(function(storeName) {
      if (storeName in nextProps) {
        return;
      }
      if (!(storeName in baseStores)) {
        throw new Error(
          `inject:${storeName}不在Provider的props中,请换个值重新inject`
        );
      }
      nextProps[storeName] = baseStores[storeName];
    });
    return nextProps;
  };
}

export default function inject() {
  let grabStoresFn;
  const storeNames = [];
  for (let i = 0; i < arguments.length; i++) storeNames[i] = arguments[i];
  grabStoresFn = grabStoresByName(storeNames);
  return function(componentClass) {
    return createStoreInjector(
      grabStoresFn,
      componentClass,
      storeNames.join('-')
    );
  };
}
