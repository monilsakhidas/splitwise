import React, { Component } from "react";
import cookie from "react-cookies";
import utils from "../../utils/utils";
import Modal from "react-modal";
import config from "../../config/config";
import axios from "axios";
import { Link } from "react-router-dom";
import EditGroup from "./EditGroup";

class AcceptedGroups extends Component {
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
      error: false,
      errorMessage: "",
      isPopUpOpen: false,
    };
  }

  togglePopup = () => {
    this.setState({
      isPopUpOpen: !this.state.isPopUpOpen,
      error: false,
      errorMessage: "",
    });
  };

  leaveGroup = async (onClickEvent) => {
    try {
      const response = await axios.post(
        config.BACKEND_URL + "/groups/leave",
        { id: this.state.id },
        { headers: utils.getJwtHeader(cookie.load("jwtToken")) }
      );
      this.props.removeGroup(this.state);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        this.setState({
          tokenState: false,
        });
      } else if (error.response && error.response.status === 400) {
        this.setState({
          error: true,
          errorMessage: error.response.data.errorMessage,
        });
      } else {
        console.log(error);
      }
    }
  };

  render() {
    if (!this.state.tokenState) {
      return utils.getRedirectComponent("/login");
    } else {
      let renderError = null;
      if (this.state.error) {
        renderError = (
          <div style={{ color: "red", display: "block", marginLeft: "17px" }}>
            {this.state.errorMessage}
          </div>
        );
      }

      let editOption = (
        <div>
          <div>
            {/* <div
            className="edit-option"
            class="btn btn-primary"
            Width="89px"
            style={{ marginRight: 10 }}
          > */}
            <button
              className="btn btn-warning"
              onClick={this.togglePopup}
              style={{ marginLeft: 10 }}
            >
              Edit Group
            </button>
          </div>
          <Modal isOpen={this.state.isPopUpOpen}>
            <EditGroup
              groupDetails={this.state}
              ariaHideApp={false}
              closePopUp={this.togglePopup}
            />
          </Modal>
        </div>
      );

      let groupDescriptionOption = (
        <div>
          <div className="profile-edit" style={{ height: "20%" }}>
            <Link
              className="btn btn-primary"
              style={{ marginLeft: 10 }}
              to={{
                pathname: "/groups/group-description",
                state: {
                  groupDetails: this.state,
                },
              }}
            >
              Details
            </Link>
          </div>
        </div>
      );

      return (
        <div class="col-sm-12" style={{ marginBottom: "20px" }}>
          <div class="card">
            <div class="row">
              <div class="col-sm-3">
                <img src={this.state.image} width="134" height="114" alt="" />
              </div>
              <div class="col-sm-9">
                <div
                  class="card-body"
                  style={{ backgroundColor: "whitesmoke" }}
                >
                  <h5 class="card-title">{this.state.name}</h5>
                  <div className="row">
                    {/* <button
                      class="btn btn-primary"
                      Width="89px"
                      style={{ marginRight: 10 }}
                    >
                      Details
                    </button> */}
                    <div>{groupDescriptionOption}</div>
                    {editOption}
                    <button
                      class="btn btn-danger"
                      Width="89px"
                      onClick={this.leaveGroup}
                      style={{ marginLeft: 10 }}
                    >
                      Leave
                    </button>
                  </div>
                </div>
              </div>
              {renderError}
            </div>
          </div>
          {/* <div className="row p-4" style={{ marginLeft: "160px" }}>
            <div className="col-2">
              <div className="row">
                <h6>{editOption}</h6>
              </div>
            </div> */}
          {/* <div className="col-2" style={{ marginLeft: "40px" }}>
              <div className="row">{groupDescriptionOption}</div>
            </div> */}
          {/* </div> */}
        </div>
      );
    }
  }
}

export default AcceptedGroups;
