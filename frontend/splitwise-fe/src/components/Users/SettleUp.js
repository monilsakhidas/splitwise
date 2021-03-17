import React, { Component } from "react";
import utils from "../../utils/utils";
import config from "../../config/config";
import cookie from "react-cookies";
import axios from "axios";
import Select from "react-select";
import Lottie from "react-lottie";
import * as loading from "../../animations/196-material-wave-loading.json";

const loadingOptions = {
  loop: true,
  autoplay: true,
  animationData: loading.default,
  rendererSettings: {
    preserverAspectRatio: "xMidYMid slice",
  },
};

class SettleUp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tokenState: utils.isJWTValid(cookie.load("jwtToken"))[0],
      usersSettleUpOptions: [],
      error: false,
      errorMessage: "",
      selectedUserId: "",
      isDisabled: false,
      isLoading: false,
    };
  }

  async componentDidMount() {
    try {
      // get list of users with the the logged in user can settle up
      const usersSettleUpListResponse = await axios.get(
        config.BACKEND_URL + "/users/settle",
        {
          headers: utils.getJwtHeader(cookie.load("jwtToken")),
        }
      );
      if (usersSettleUpListResponse.status === 200) {
        const usersSettleUpOptions = await usersSettleUpListResponse.data.users.map(
          (user) => {
            return {
              label: user.name + "(" + user.email + ")",
              value: user.id,
            };
          }
        );
        this.setState({
          usersSettleUpOptions,
        });
      }
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
  }

  handleUserChange = (onUserSelectEvent) => {
    this.setState({
      error: false,
      errorMessage: "",
      selectedUserId: onUserSelectEvent.value,
    });
  };

  handleSubmit = async (onSubmitEvent) => {
    onSubmitEvent.preventDefault();
    // Disabling the submit form button for settle up
    this.setState({
      isDisabled: true,
      isLoading: true,
    });
    try {
      const response = await axios.post(
        config.BACKEND_URL + "/users/settle",
        { id: this.state.selectedUserId },
        {
          headers: utils.getJwtHeader(cookie.load("jwtToken")),
        }
      );
      if (response.status === 200) {
        this.setState({
          isLoading: false,
        });
        window.location.reload();
      }
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
      // Enabling the submit form button for settle up
      this.setState({
        isDisabled: false,
        isLoading: false,
      });
    }
  };

  render() {
    if (!this.state.tokenState) {
      return utils.getRedirectComponent("/login");
    } else {
      let renderError = null;
      if (this.state.error) {
        renderError = (
          <div style={{ color: "red", display: "block" }}>
            {this.state.errorMessage}
          </div>
        );
      }
      let animation = null;
      if (this.state.isLoading) {
        animation = (
          <Lottie options={loadingOptions} height={120} width={200} />
        );
      }
      return (
        <div style={{ backgroundColor: "white", height: "438px" }}>
          <div className="container">
            <div
              className="row"
              style={{ backgroundColor: "#5BC5A7", color: "#FFFFFF" }}
            >
              <p
                style={{
                  marginLeft: "197px",
                  marginTop: "15px",
                  fontWeight: "100px",
                }}
              >
                Settle up
              </p>
            </div>

            <div className="row" style={{ marginTop: "10px" }}>
              <div className="col-12">
                <Select
                  options={this.state.usersSettleUpOptions}
                  placeholder="Select a user"
                  onChange={this.handleUserChange}
                />
              </div>
            </div>

            <div
              className="row"
              style={{
                marginTop: "60px",
                height: "120px",
                width: "120px",
                marginLeft: "159px",
              }}
            >
              {animation}
            </div>

            <div className="row">
              <form method="post" onSubmit={this.handleSubmit}>
                <button
                  type="submit"
                  className="btn btn-amber align-self-end"
                  style={{
                    backgroundColor: "#5BC5A7",
                    marginTop: "70px",
                    marginLeft: "22px",
                    color: "#FFFFFF",
                  }}
                  disabled={this.state.isDisabled}
                  onSubmit={this.handleSubmit}
                >
                  Settle up
                </button>
              </form>
              <button
                type="submit"
                className="btn btn-danger"
                style={{
                  backgroundColor: "red",
                  marginTop: "70px",
                  marginLeft: "10px",
                }}
                onClick={this.props.closePopUp}
              >
                Close
              </button>
            </div>
            <div
              className="row"
              style={{ marginLeft: "7px", marginTop: "4px" }}
            >
              {renderError}
            </div>
          </div>
        </div>
      );
    }
  }
}

export default SettleUp;
