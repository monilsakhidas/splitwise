import React, { Component } from "react";
import utils from "../../utils/utils";
import cookie from "react-cookies";
import AsyncSelect from "react-select/async";
import splitwiselogo from "../../images/splitwise-logo.png";
import axios from "axios";
import config from "../../config/config";

class CreateGroup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: "",
      users: [],
      error: true,
      tokenState: utils.isJWTValid(cookie.load("jwtToken"))[0],
      errorMessage: "",
      updatedProfileImage: "",
      updatedProfileImagePath: utils.getImageUrl,
      wasImageUpdated: false,
    };
  }

  handleSubmit = async (onSubmitEvent) => {
    onSubmitEvent.preventDefault();
    if (!this.state.error) {
      try {
        // Initialize form data
        let formData = new FormData();
        // add Image to for data
        if (this.state.wasImageUpdated) {
          formData.append(
            "groupImage",
            this.state.updatedProfileImage,
            this.state.updatedProfileImage.name
          );
        }
        // We need to send a list of userIds.
        const userIdList = this.state.users.map((user) => {
          return user.value;
        });
        console.log(userIdList);
        formData.append("name", this.state.name);
        formData.append("users", userIdList);
        const response = await axios.post(
          config.BACKEND_URL + "/groups/create",
          formData,
          {
            headers: Object.assign(
              utils.getJwtHeader(cookie.load("jwtToken")),
              utils.getFormDataHeader
            ),
          }
        );
        if (response.status === 200) {
          this.props.history.push("/users/dashboard");
        }
      } catch (error) {
        if (error.response.status === 401) {
          this.setState({ tokenState: false });
        } else {
          this.setState({
            error: true,
            errorMessage: error.response.data.errorMessage,
          });
        }
      }
      // const { name, users } = this.state;
      // try {
      //   // We need to send a list of userIds.
      //   const userIdList = users.map((user) => {
      //     return user.value;
      //   });
      //   const response = await axios.post(
      //     config.BACKEND_URL + "/groups/create",
      //     { name, users: userIdList },
      //     { headers: utils.getJwtHeader(cookie.load("jwtToken")) }
      //   );
      //   this.props.history.push("/users/dashboard");
      // } catch (error) {
      //   if (error.response.status === 401) {
      //     this.setState({ tokenState: false });
      //   } else {
      //     this.setState({
      //       error: true,
      //       errorMessage: error.response.data.errorMessage,
      //     });
      //   }
      // }
    }
  };

  // LEFT TO DO
  handleImageChange = (onImageChangeEvent) => {
    this.setState({
      updatedProfileImage: onImageChangeEvent.target.files[0],
      wasImageUpdated: true,
    });
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

  handleUsers = (addedUsers) => {
    this.setState({
      users: addedUsers,
      error: false,
    });
  };

  searchOptions = async (inp, callback) => {
    try {
      const response = await axios.get(
        config.BACKEND_URL + "/search/users?keyword=" + inp,
        { headers: utils.getJwtHeader(cookie.load("jwtToken")) }
      );
      const searchedUsers = response.data.users.map((user) => {
        return {
          label: user.name + "(" + user.email + ")",
          value: user.id,
        };
      });
      callback(searchedUsers);
    } catch (error) {
      if (error.response.status === 401)
        this.setState({
          tokenState: false,
        });
      else {
        console.log("NOT INSIDE LOADS 401");
        console.log(error.response);
      }
    }
  };

  render() {
    if (this.state.tokenState) {
      let errorMessage = null;
      if (this.state.error) {
        errorMessage = (
          <div style={{ color: "red" }}>{this.state.errorMessage}</div>
        );
      }
      return (
        <div>
          <div className="row" style={{ height: "10vh" }}></div>
          <div className="row" style={{ height: "100vh" }}>
            <div className="col-3"></div>
            <div className="col-2">
              <img src={splitwiselogo} width="200" height="200" alt="" />
              <div className="row p-1 m-3">
                <input
                  style={{ marginLeft: "20px" }}
                  accept="image/x-png,image/gif,image/jpeg"
                  type="file"
                  name="groupImage"
                  onChange={this.handleImageChange}
                />
              </div>
            </div>
            <div className="col-6">
              <h5>Group Name</h5>
              <form onSubmit={this.handleSubmit} id="Login">
                <input
                  placeholder="Enter Group name"
                  type="text"
                  id="groupName"
                  name="groupName"
                  style={{ width: "300px", marginBottom: "40px" }}
                  onChange={this.handleNameChange}
                ></input>

                <AsyncSelect
                  isMulti
                  value={this.state.users}
                  onChange={this.handleUsers}
                  placeholder={"Search by name or email"}
                  loadOptions={this.searchOptions}
                />
                {errorMessage}
                <button
                  type="submit"
                  className="btn btn-success"
                  style={{
                    backgroundColor: "#FF8C00",
                    marginTop: "100px",
                    marginLeft: "0px",
                  }}
                  onSubmit={this.handleSubmit}
                >
                  Save
                </button>
              </form>
            </div>
          </div>
        </div>
      );
    } else {
      return utils.getRedirectComponent("/login");
    }
  }
}

export default CreateGroup;
