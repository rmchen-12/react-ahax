import { Children, Component } from 'react';
import PropTypes from 'prop-types';

const specialReactKeys = { children: true, key: true, ref: true };

export default class Provider extends Component {
  static contextTypes = {
  	store: PropTypes.object
  };

  static childContextTypes = {
  	store: PropTypes.object.isRequired
  };

  static propTypes = {
  	children: PropTypes.object
  };

  render() {
  	return Children.only(this.props.children);
  }

  getChildContext() {
  	const stores = {};
  	for (let key in this.props) {
  		if (!specialReactKeys[key]) {
  			stores[key] = this.props[key];
  			//	console.log('stores:', stores);
  		}
  	}
  	return { store: stores };
  }
}
