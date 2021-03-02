import React, { Component } from "react";
import "./App.css";
import Routing from "./components/Routing";
import { BrowserRouter } from "react-router-dom";

export class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <div>
          <Routing />
        </div>
      </BrowserRouter>
    );
  }
}

export default App;
