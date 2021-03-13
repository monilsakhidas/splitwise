import React, { Component } from "react";
import { Link } from "react-router-dom";
import cookie from "react-cookies";
import utils from "../../utils/utils";
import splitwiselogo from "../../images/splitwise-logo.png";

class Navbar extends Component {
  render() {
    const [isTokenValid, name, email] = utils.isJWTValid(
      cookie.load("jwtToken")
    );
    if (isTokenValid) {
      return (
        <div>
          <nav
            class="navbar navbar-expand-lg navbar-dark"
            style={{ backgroundColor: "#20BF9F" }}
          >
            <img
              style={{ marginLeft: "100px" }}
              src={splitwiselogo}
              width="60"
              height="50"
              alt=""
            />
            <h2
              style={{
                color: "black",
                marginTop: "5px",
                marginLeft: "5px",
                color: "white",
              }}
            >
              <strong style={{ color: "white", fontSize: 25 }}>
                Splitwise
              </strong>
            </h2>
            <li
              class="nav-item dropdown"
              style={{
                "margin-left": "950px",
                "margin-top": "-20px",
                color: "#20BF9F",
              }}
            >
              <a
                class="nav-link dropdown-toggle"
                href="#"
                id="navbarDropdown"
                role="button"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
                style={{ color: "white" }}
              >
                <em>{name}</em>
              </a>
              <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                <a class="dropdown-item" href="/users/update">
                  Your Profile
                </a>
                <div class="dropdown-divider"></div>
                <a class="dropdown-item" href="/groups/create">
                  New Group
                </a>
                <a class="dropdown-item" href="/groups/mygroups">
                  Groups/Invitations
                </a>
                <a class="dropdown-item" href="/users/activity">
                  Recent Activity
                </a>
                <a class="dropdown-item" href="/users/dashboard">
                  Dashboard
                </a>
                <div class="dropdown-divider"></div>
                <a class="dropdown-item" href="/logout">
                  Logout
                </a>
              </div>
            </li>
            <div class="collapse navbar-collapse" id="navbarNav">
              <ul class="navbar-nav ml-auto">
                <li class="nav-item">
                  <Link
                    class="nav-link"
                    to="/logout"
                    style={{ color: "white" }}
                  >
                    Logout
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      );
    } else {
      return (
        <div>
          <nav
            class="navbar navbar-expand-lg navbar-dark"
            style={{ backgroundColor: "#20BF9F" }}
          >
            <a class="navbar-brand" href="">
              <img
                style={{ marginLeft: "170px" }}
                src={splitwiselogo}
                width="60"
                height="50"
                alt=""
              />
            </a>
            <p style={{ "margin-top": "20px" }}>
              <strong style={{ color: "white", fontSize: 25 }}>
                Splitwise
              </strong>
            </p>
            <button
              class="navbar-toggler"
              type="button"
              data-toggle="collapse"
              data-target="#navbarNav"
              aria-controls="navbarNav"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
              <ul class="navbar-nav ml-auto">
                <li class="nav-item">
                  <Link
                    class="nav-link"
                    to="/login"
                    style={{ color: "white", "margin-right": "0px" }}
                  >
                    Login
                  </Link>
                </li>
                <li class="nav-item">
                  <Link
                    class="nav-link"
                    to="/signup"
                    style={{ color: "white", "margin-right": "100px" }}
                  >
                    Signup
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      );
    }
  }
}

export default Navbar;
