import React from 'react';
import { hot } from 'react-hot-loader';


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      themes: process.env.themes,
      currentLink: null
    }
  }

  remove = el => el && el.parentNode.removeChild(el)

  changeTheme = (theme) => {
    const { currentLink } = this.state;
    if (theme === (currentLink && currentLink.dataset.theme)) {
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `./theme-${theme}.css`;
    link.dataset.theme = theme;
    document.head.appendChild(link);
    link.onload = () => {
      this.removeTheme();
      this.setState({
        currentLink: link
      });
    }
  }

  removeTheme = () => {
    const { currentLink } = this.state;
    this.remove(currentLink);
  }

  resetTheme = () => {
    this.removeTheme();
    this.setState({
      currentLink: null
    });
  }

  render() {
    const { themes } = this.state;
    return (
      <div>
        <h1>点击按钮切换主题</h1>
        <button onClick={this.resetTheme}>default</button>
        {
          themes.map(theme => (
            <button key={theme} onClick={() => this.changeTheme(theme)}>{theme}</button>
          ))
        }
      </div>
    );
  }
}

export default hot(module)(App);
