import { Component } from 'react';
import EventEmitter from 'eventemitter3';

let eventInstance;
if (window.eventInstance) {
  eventInstance = window.eventInstance;
} else {
  eventInstance = new EventEmitter();
}

function isObjectShallowModified(prev, next) {
  if (
    prev == null ||
    next == null ||
    typeof prev !== 'object' ||
    typeof next !== 'object'
  ) {
    return prev !== next;
  }
  const keys = Object.keys(prev);
  if (keys.length !== Object.keys(next).length) {
    return true;
  }
  let key;
  for (let i = keys.length - 1; i >= 0, (key = keys[i]); i--) {
    if (next[key] !== prev[key]) {
      return true;
    }
  }
  return false;
}

// 分发reactiveMixin函数
function patch(target, funcName, runMixinFirst = false) {
  const base = target[funcName];
  const mixinFunc = reactiveMixin[funcName];
  const f = !base //target中没有的话使用mixin，有的话判断时mixin优先还是base优先
    ? mixinFunc
    : runMixinFirst === true
    ? function() {
        mixinFunc.apply(this, arguments);
        base.apply(this, arguments);
      }
    : function() {
        base.apply(this, arguments);
        mixinFunc.apply(this, arguments);
      };
  target[funcName] = f;
}

const reactiveMixin = {
  dispatch: function(action) {
    eventInstance.emit(action.type, action);
  },

  componentWillMount: function() {
    if (this.onEventAction) {
      for (let e of this.events) {
        eventInstance.on(
          e,
          (this.listener = action => {
            this.onEventAction(action);
            console.log('action:', action);
          })
        );
      }
    }
  },

  componentWillUnmount: function() {
    if (this.onEventAction) {
      for (let e of this.events) {
        eventInstance.removeListener(e, this.listener);
      }
    }
  },

  shouldComponentUpdate: function(nextProps, nextState) {
    if (this.state !== nextState) {
      return true;
    }
    return isObjectShallowModified(this.props, nextProps);
  }
};

export function observer(events = []) {
  return function(arg1) {
    // 无状态组件
    const componentClass = arg1;
    if (
      typeof componentClass === 'function' &&
      (!componentClass.prototype || !componentClass.prototype.render) &&
      !componentClass.isReactClass &&
      !Component.isPrototypeOf(componentClass)
    ) {
      return observer(
        class extends Component {
          static displayName =
            componentClass.displayName || componentClass.name;
          static contextTypes = componentClass.contextTypes;
          static propTypes = componentClass.propTypes;
          static defaultProps = componentClass.defaultProps;
          static events = events;
          render() {
            return componentClass.call(this, this.props, this.context);
          }
        }
      );
    }

    if (!componentClass) {
      throw new Error('请传入合法的组件绑定observer');
    }

    const target = componentClass.prototype || componentClass;
    target.events = events;
    mixinLifecycleEvents(target);
    return componentClass;
  };
}

function mixinLifecycleEvents(target) {
  patch(target, 'componentWillMount', true);
  ['dispatch', 'componentWillUnmount'].forEach(function(funcName) {
    patch(target, funcName);
  });
  if (!target.shouldComponentUpdate) {
    target.shouldComponentUpdate = reactiveMixin.shouldComponentUpdate;
  }
}
