import React, { Component } from "react";
import utils from "../../utils/utils";
import config from "../../config/config";
import cookie from "react-cookies";
import axios from "axios";

class GroupDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tokenState: utils.isJWTValid(cookie.load("jwtToken"))[0],
    };
  }

  render() {
    if (!this.state.tokenState) {
      return utils.getRedirectComponent("/login");
    } else {
      return (
        <div class="row">
          <div class="col-xl-6 col-md-12">
            <div class="card overflow-hidden">
              <div class="card-content">
                <div class="card-body cleartfix">
                  <div class="media align-items-stretch">
                    <div class="align-self-center">
                      <i class="icon-pencil primary font-large-2 mr-2"></i>
                    </div>
                    <div class="media-body">
                      <h4>Total Posts</h4>
                      <span>Monthly blog posts</span>
                    </div>
                    <div class="align-self-center">
                      <h1>18,000</h1>
                    </div>
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

export default GroupDetails;
