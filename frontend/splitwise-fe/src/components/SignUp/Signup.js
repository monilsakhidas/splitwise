import React, { Component } from "react";
import axios from "axios";
import { NavLink, Link } from "react-router-dom";
import config from "../../config/config";
import utils from "../../utils/utils";
import cookie from "react-cookies";
import { connect } from "react-redux";
import { login } from "../../features/userSlice";
class SignUp extends Component {
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
      name: "",
      email: "",
      password: "",
      error: false,
      errorMessage: "",
      tokenState: data[0],
    };
  }

  handleNameChange = (nameChangeEvent) => {
    if (
      /[~`!#$@%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(
        nameChangeEvent.target.value
      )
    ) {
      this.setState({
        error: true,
        errorMessage: "Name should not contain special characters",
        [nameChangeEvent.target.name]: "",
      });
    } else {
      this.setState({
        error: false,
        errorMessage: "",
        name: nameChangeEvent.target.value,
      });
    }
  };

  handlePasswordChange = (passwordChangeEvent) => {
    this.setState({
      password: passwordChangeEvent.target.value,
    });
  };

  handleEmailChange = (emailChangeEvent) => {
    if (
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
        emailChangeEvent.target.value
      )
    ) {
      this.setState({
        error: false,
        email: emailChangeEvent.target.value,
        errorMessage: "",
      });
    } else {
      this.setState({
        error: true,
        errorMessage: "Enter a valid email",
        email: "",
      });
    }
  };

  handleOnSubmit = (submitEvent) => {
    submitEvent.preventDefault();
    const { error, errorMessage, tokenState, ...data } = this.state;
    axios
      .post(config.BACKEND_URL + "/users/signup", data)
      .then((res) => {
        if (res.status === 200) {
          this.setState({ error: false });
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

          // Redux action
          this.props.login({
            token: res.data.token,
          });

          this.props.history.push("/users/dashboard");
        }
      })
      .catch((err) => {
        console.log(err.response);
        this.setState({
          errorMessage: err.response.data.errorMessage,
          error: true,
        });
      });
  };

  render() {
    if (this.state.tokenState) {
      return utils.getRedirectComponent("/users/dashboard");
    } else {
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
                  <h4 style={{ margin: "10px", color: "#20BF9F" }}>
                    Register Here!
                  </h4>
                  <form
                    style={{ margin: "10px" }}
                    id="Signup"
                    method="post"
                    onSubmit={this.handleOnSubmit}
                  >
                    <div className="form-group">
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        autoFocus
                        required
                        placeholder="Enter Name"
                        onChange={this.handleNameChange}
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        className="form-control"
                        name="email"
                        required
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
                      style={{ backgroundColor: "#20BF9F" }}
                      onSubmit={this.handleOnSubmit}
                    >
                      Sign Up
                    </button>
                  </form>
                  {renderError}
                  <br></br>
                  Already have an account?{" "}
                  {
                    <Link style={{ color: "#20BF9F" }} to="/login">
                      Login
                    </Link>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }
}

const matchStateToProps = (state) => {
  return {};
};

const matchDispatchToProps = (dispatch) => {
  return {
    login: (data) => dispatch(login(data)),
  };
};

export default connect(matchStateToProps, matchDispatchToProps)(SignUp);
