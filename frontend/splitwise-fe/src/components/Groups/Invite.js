import React, { Component } from "react";
import cookie from "react-cookies";
import utils from "../../utils/utils";
import config from "../../config/config";
import axios from "axios";
import defaultGroupPhoto from "../../images/splitwise-logo.png";

class Invite extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: this.props.groupDetails.id,
      name: this.props.groupDetails.name,
      image:
        this.props.groupDetails.image == null
          ? utils.getImageUrl()
          : utils.getImageUrl(this.props.groupDetails.image),
      tokenState: utils.isJWTValid(cookie.load("jwtToken"))[0],
    };
  }

  acceptInvitation = async (acceptEvent) => {
    try {
      const response = await axios.post(
        config.BACKEND_URL + "/groups/accept",
        { id: this.state.id },
        { headers: utils.getJwtHeader(cookie.load("jwtToken")) }
      );
      this.props.removeInviteAndAddToGroup(this.state);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        this.setState({
          tokenState: false,
        });
      } else {
        console.log(error.response);
      }
    }
  };
  rejectInvitation = async (rejectEvent) => {
    try {
      const response = await axios.post(
        config.BACKEND_URL + "/groups/reject",
        { id: this.state.id },
        { headers: utils.getJwtHeader(cookie.load("jwtToken")) }
      );
      this.props.removeInvite(this.state);
    } catch (error) {
      if (error.response.status === 401) {
        this.setState({
          tokenState: false,
        });
      } else {
        console.log(error.response);
      }
    }
  };

  // LEFT TODO
  displayImage = () => {};

  render() {
    if (!this.state.tokenState) {
      return utils.getRedirectComponent("/login");
    } else {
      return (
        <div class="col-sm-12" style={{ marginBottom: "20px" }}>
          <div class="card" style={{ backgroundColor: "whitesmoke" }}>
            <div class="row">
              <div class="col-sm-3">
                <img
                  src={this.state.image}
                  width="134"
                  height="114"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = defaultGroupPhoto;
                  }}
                  alt=""
                />
              </div>
              <div class="col-sm-9">
                <div class="card-body">
                  <h5 class="card-title">{this.state.name}</h5>
                  <button
                    Width="89px"
                    onClick={this.acceptInvitation}
                    className="btn btn-success"
                    style={{ marginRight: 10 }}
                  >
                    Accept
                  </button>
                  <button
                    class="btn btn-danger"
                    onClick={this.rejectInvitation}
                    Width="89px"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }
}

export default Invite;
