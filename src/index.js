import React from 'react';
import ReactDOM from 'react-dom';

// style
import './less/index.less';

import App from './App';

const hotRender = Component => {
  ReactDOM.render(<Component />, document.getElementById('root'));
};

document.body.className = '';
hotRender(App);
