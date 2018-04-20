import React from 'react';
import ReactDOM from 'react-dom';

// style
import './less/index.less';
import './less/themes/green.less';
import './less/themes/red.less';
import './less/themes/yellow.less';

import App from './App';

const hotRender = Component => {
  ReactDOM.render(<Component />, document.getElementById('root'));
};

document.body.className = '';
hotRender(App);
