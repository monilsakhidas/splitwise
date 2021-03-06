import React, { Component } from "react";
import cookie from "react-cookies";
import utils from "../../utils/utils";
import config from "../../config/config";
import axios from "axios";

class EditGroup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: this.props.groupDetails.id,
      name: this.props.groupDetails.name,
      image: this.props.groupDetails.image,
      tokenState: utils.isJWTValid(cookie.load("jwtToken"))[0],
      error: false,
      errorMessage: "",
      wasImageUpdated: false,
      updatedProfileImage: "",
    };
  }

  // TO DO !!!!!
  handleImageChange = (onImageChangeEvent) => {
    this.setState({
      wasImageUpdated: true,
      updatedProfileImage: onImageChangeEvent.target.files[0],
    });
    console.log(this.state);
  };

  handleSubmit = async (onSubmitEvent) => {
    onSubmitEvent.preventDefault();
    if (!this.state.error && utils.isJWTValid(cookie.load("jwtToken"))[0]) {
      try {
        let formData = new FormData();
        if (this.state.wasImageUpdated) {
          formData.append(
            "groupImage",
            this.state.updatedProfileImage,
            this.state.updatedProfileImage.name
          );
        }
        formData.append("id", this.state.id);
        formData.append("name", this.state.name);
        const response = await axios.put(
          config.BACKEND_URL + "/groups/editgroup",
          formData,
          {
            headers: Object.assign(
              utils.getJwtHeader(cookie.load("jwtToken")),
              utils.getFormDataHeader
            ),
          }
        );
        if (response.status === 200) {
          // Refresh the page
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
      }
    } else if (!utils.isJWTValid(cookie.load("jwtToken"))[0]) {
      this.setState({
        tokenState: false,
      });
    }
  };

  handleNameChange = (nameChangeEvent) => {
    if (
      /[~`!#$@%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(
        nameChangeEvent.target.value
      )
    ) {
      this.setState({
        error: true,
        errorMessage: "Group's name should not contain special characters",
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

  render() {
    console.log(this.props.groupDetails.image);
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
      return (
        <div>
          <h1 style={{ marginLeft: "500px" }}>Update Group Details</h1>
          <div className="row" style={{ height: "10vh" }}></div>
          <div className="row" style={{ height: "100vh" }}>
            <div className="col-3"></div>
            <div className="col-2">
              <img src={this.state.image} width="200" height="200" alt="" />
              <div className="row">
                <input
                  style={{ marginLeft: "20px", marginTop: "30px" }}
                  accept="image/x-png,image/gif,image/jpeg"
                  type="file"
                  name="groupImage"
                  onChange={this.handleImageChange}
                />
              </div>
            </div>
            <div className="col-6">
              <h3>Edit Group Name</h3>
              <form onSubmit={this.handleSubmit} id="Login">
                <input
                  placeholder={this.state.name}
                  type="text"
                  id="groupName"
                  name="groupName"
                  style={{ width: "300px", marginTop: "10px" }}
                  onChange={this.handleNameChange}
                ></input>
                <div className="row">
                  <button
                    type="submit"
                    className="btn btn-success"
                    style={{
                      backgroundColor: "#FF8C00",
                      marginTop: "200px",
                      marginLeft: "10px",
                    }}
                    onSubmit={this.handleSubmit}
                  >
                    Save
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger"
                    style={{
                      backgroundColor: "#FF8C00",
                      marginTop: "200px",
                      marginLeft: "10px",
                    }}
                    onClick={this.props.closePopUp}
                  >
                    Close
                  </button>
                </div>
              </form>

              {renderError}
            </div>
          </div>
        </div>
      );
    }
  }
}

export default EditGroup;
