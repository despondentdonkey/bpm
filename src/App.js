import React, { Component } from 'react';
import './App.css';
import Engine from './game/engine'

class App extends Component {
  componentDidMount() {
    let e = new Engine();
    e.run();
  }

  render() {
    return (
      <div className="App">
        <div id="canvasWrapper">
            <div id="canvas"> </div>
            <input type="text" id="cliElement" tabIndex="0" placeholder="Command Line Interface"></input>
        </div>
        <div id="buttonWrapper">
            <div id="stateButtons"></div>
            <div id="bpmCheats"></div>
        </div>
      </div>
    );
  }
}

export default App;
