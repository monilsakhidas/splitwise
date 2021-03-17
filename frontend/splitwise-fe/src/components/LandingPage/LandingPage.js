import React, { Component } from "react";
import cookie from "react-cookies";
import landing_plane from "../../images/landing_plane.png";
import utils from "../../utils/utils";

class LandingPage extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (utils.isJWTValid(cookie.load("jwtToken"))[0]) {
      return utils.getRedirectComponent("/users/dashboard");
    } else {
      return (
        <div>
          <div class="home-background h-100">
            <div class="container">
              <div class="row">
                <div class="col-5">
                  <div>
                    <h1>
                      <strong>
                        Less stress when
                        <br />
                        sharing expenses
                        <br />
                        <div class="splitwise-color">on trips.</div>
                      </strong>
                    </h1>
                    <i class="fa fa-plane icon-style splitwise-color"></i>
                    <i class="fa fa-home icon-style"></i>
                    <i class="fa fa-heart icon-style"></i>
                    <i class="fa fa-asterisk icon-style"></i>
                    <p>
                      <strong>
                        Keep track of your shared expenses and
                        <br />
                        balances with housemates, trips, groups,
                        <br />
                        friends, and family.
                      </strong>
                    </p>
                    <br />
                    <a
                      class="btn btn-primary btn-lg"
                      href="/signup"
                      type="button"
                      style={{ backgroundColor: "#59cfa7", border: "none" }}
                    >
                      Sign up
                    </a>
                  </div>
                </div>
                <div class="col-7">
                  {/* <i class="fa fa-plane icon-style splitwise-color " style={{ fontSize: "100px"}}></i> */}
                  <div>
                    <img
                      class="landing-plane"
                      src={landing_plane}
                      style={{ paddingTop: "20px" }}
                    ></img>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }
}

export default LandingPage;
