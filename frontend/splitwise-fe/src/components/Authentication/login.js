import React, { Component } from "react";
import { NavLink, Link } from "react-router-dom";
import config from "../../config/config";
import axios from "axios";
import cookie from "react-cookies";
import utils from "../../utils/utils";

// Extends component
class Login extends Component {
  constructor(props) {
    super(props);
    const data = utils.isJWTValid(cookie.load("jwtToken"));
    if (data[0]) {
      // save name
      cookie.save("name", data[1], {
        path: "/",
        httpOnly: false,
        maxAge: 120000,
      });
      // save email
      cookie.save("email", data[2], {
        path: "/",
        httpOnly: false,
        maxAge: 120000,
      });
    }
    this.state = {
      email: "",
      password: "",
      error: false,
      errorMessage: "",
      tokenState: data[0],
    };
  }

  // On submit event
  handleSubmit = (submitEvent) => {
    submitEvent.preventDefault();
    const { error, errorMessage, tokenState, ...data } = this.state;
    axios
      .post(config.BACKEND_URL + "/users/login", data)
      .then((res) => {
        if (res.status === 200) {
          this.setState({
            error: false,
          });
          // save jwtToken
          cookie.save("jwtToken", res.data.token, {
            path: "/",
            httponly: false,
            maxAge: 120000,
          });
          // save name
          cookie.save("name", res.data.user.name, {
            path: "/",
            httpOnly: false,
            maxAge: 120000,
          });
          // save email
          cookie.save("email", res.data.user.email, {
            path: "/",
            httpOnly: false,
            maxAge: 120000,
          });
          // save userId
          cookie.save("id", res.data.user.id, {
            path: "/",
            httpOnly: false,
            maxAge: 120000,
          });
          this.props.history.push("/users/dashboard");
        }
      })
      .catch((err) => {
        this.setState({
          error: true,
          errorMessage: err.response.data.errorMessage,
        });
      });
  };

  // On change of password event
  handlePasswordChange = (passwordChangeEvent) => {
    this.setState({ password: passwordChangeEvent.target.value });
  };

  handleEmailChange = (emailChangeEvent) => {
    if (
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
        emailChangeEvent.target.value
      )
    ) {
      this.setState({
        error: false,
        [emailChangeEvent.target.name]: emailChangeEvent.target.value,
        errorMessage: "",
      });
    } else {
      this.setState({
        error: true,
        errorMessage: "Enter a valid email",
        [emailChangeEvent.target.name]: "",
      });
    }
  };

  // render method of login component
  render() {
    // If already logged in
    if (this.state.tokenState) {
      return utils.getRedirectComponent("/users/dashboard");
    }
    // If not logged in already
    let renderError = null;
    if (this.state.error) {
      renderError = (
        <div style={{ color: "red" }}>{this.state.errorMessage}</div>
      );
    }

    return (
      <div>
        <div className="row" style={{ height: "100vh", padding: "10%" }}>
          <div className="col-5" style={{ paddingLeft: "10%" }}>
            <div className="row" style={{ height: "10%" }}></div>
            <div className="row" style={{ height: "90%" }}>
              <div className="col-12">
                <h4 style={{ margin: "10px", color: "#20BF9F" }}>Login page</h4>
                <form id="Login" method="post" onSubmit={this.handleSubmit}>
                  <div className="form-group">
                    <input
                      type="text"
                      className="form-control"
                      name="email"
                      required
                      autoFocus
                      placeholder="Enter Email"
                      onChange={this.handleEmailChange}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      required
                      placeholder="Enter Password"
                      onChange={this.handlePasswordChange}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-success"
                    onSubmit={this.handleSubmit}
                    style={{ backgroundColor: "#20BF9F" }}
                  >
                    Login
                  </button>
                </form>
                {renderError}
                <br></br>
                Don't have an account?{" "}
                {
                  <Link style={{ color: "#20BF9F" }} to="/signup">
                    Sign Up
                  </Link>
                }
              </div>
            </div>
          </div>
          <div className="col-7">
            {/* <div className="row" style={ { height: "10%" } }>
                </div> */}
            <div className="row">
              <div className="row" style={{ padding: "5%" }}>
                {/* <img
                  src={}
                  style={{ paddingLeft: "40%" }}
                  width="100%"
                  height="100%"
                  alt=""
                /> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Login;
