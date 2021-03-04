import React, { Component } from "react";
import Invite from "./Invite";
import AcceptedGroups from "./AcceptedGroups";
import utils from "../../utils/utils";
import config from "../../config/config";
import cookie from "react-cookies";
import axios from "axios";

class MyGroups extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tokenState: utils.isJWTValid(cookie.load("jwtToken"))[0],
      invitedToGroups: [],
      acceptedGroups: [],
      emptyInvitationsFlag: false,
      emptyMyGroupsFlag: false,
      searchInput: "",
      error: true,
      errorMessage: "",
    };
  }

  handleSearch = (onChangeEvent) => {
    this.setState({
      searchInput: onChangeEvent.target.value,
    });
  };

  // Only remove invite
  removeInvite = (group) => {
    const updatedInvites = this.state.invitedToGroups.filter((invite) => {
      return group.id != invite.id;
    });
    const emptyInvitationsFlag = updatedInvites.length == 0 ? true : false;
    this.setState({
      invitedToGroups: updatedInvites,
      emptyInvitationsFlag,
    });
  };

  // removeInvite and add to group
  removeInviteAndAddToGroup = (group) => {
    const updatedInvites = this.state.invitedToGroups.filter((invite) => {
      return group.id != invite.id;
    });
    const emptyInvitationsFlag = updatedInvites.length == 0 ? true : false;
    this.setState({
      acceptedGroups: [...this.state.acceptedGroups, group],
      emptyMyGroupsFlag: false,
      invitedToGroups: updatedInvites,
      emptyInvitationsFlag,
    });
  };

  // remove the group when the user leaves it
  removeGroup = (group) => {
    const updatedGroups = this.state.acceptedGroups.filter((acceptedGroup) => {
      return group.id != acceptedGroup.id;
    });
    this.setState({
      acceptedGroups: updatedGroups,
      emptyMyGroupsFlag: updatedGroups.length == 0 ? true : false,
    });
  };

  // Component did mount (API Calls)
  async componentDidMount() {
    try {
      const invitationsResponse = await axios.get(
        config.BACKEND_URL + "/groups/invitations",
        { headers: utils.getJwtHeader(cookie.load("jwtToken")) }
      );
      const acceptedResponse = await axios.get(
        config.BACKEND_URL + "/groups/mygroups",
        { headers: utils.getJwtHeader(cookie.load("jwtToken")) }
      );

      // Check this out if there is some error
      this.setState({
        invitedToGroups: invitationsResponse.data.groups,
        acceptedGroups: acceptedResponse.data.groups,
      });

      // set empty flags
      this.setState({
        emptyInvitationsFlag:
          this.state.invitedToGroups.length == 0 ? true : false,
        emptyMyGroupsFlag: this.state.acceptedGroups.length == 0 ? true : false,
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        this.setState({
          tokenState: false,
        });
      } else if (error.response && error.response.status === 400) {
        this.setState({
          errorMessage: error.response.data.errorMessage,
          error: true,
        });
      } else {
        console.log("Inside Main Error");
        console.log(error);
      }
    }
  }

  // Render method
  render() {
    if (!this.state.tokenState) {
      return utils.getRedirectComponent("/login");
    } else {
      // Find searched groups
      let searchedGroups = this.state.acceptedGroups.filter((group) => {
        if (group.name != null && this.state.searchInput != null)
          return group.name
            .toLowerCase()
            .includes(this.state.searchInput.toLowerCase());
        else return true;
      });

      // Initialize cards
      let inviteCards = null;
      let myGroupCards = null;

      // Update cards according to flag
      if (this.state.emptyInvitationsFlag) {
        inviteCards = (
          <div style={{ margin: "170px" }}>
            <h4 style={{ font: "Bookman" }}>No Invites</h4>
          </div>
        );
      } else {
        inviteCards = this.state.invitedToGroups.map((group) => {
          return (
            <div>
              <Invite
                groupDetails={group}
                key={group.id}
                removeInviteAndAddToGroup={this.removeInviteAndAddToGroup}
                removeInvite={this.removeInvite}
              />
            </div>
          );
        });
      }
      if (this.state.emptyMyGroupsFlag) {
        myGroupCards = (
          <div style={{ margin: "170px" }}>
            <h4 style={{ font: "Bookman" }}>No Groups Available</h4>
          </div>
        );
      } else {
        myGroupCards = searchedGroups.map((group) => {
          return (
            <div>
              <AcceptedGroups
                key={group.id}
                groupDetails={group}
                removeGroup={this.removeGroup}
              />
            </div>
          );
        });
      }

      return (
        <div className="container" style={{ borderWidth: 1 }}>
          <div className="row">
            <div className="col-6" style={{ width: 1 }}>
              <h4
                class="display-6"
                style={{
                  marginLeft: "60px",
                  marginBottom: "40px",
                  marginLeft: "150px",
                  marginTop: "10px",
                }}
              >
                Group Invites
              </h4>
              {inviteCards}
            </div>

            <div className="col-6" style={{ width: 1 }}>
              <h4
                class="display-6"
                style={{
                  marginLeft: "60px",
                  marginBottom: "40px",
                  marginLeft: "150px",
                  marginTop: "10px",
                }}
              >
                Your Groups
              </h4>
              <input
                type="text"
                style={{ width: "400px", marginLeft: "10px" }}
                name="searchInput"
                onChange={this.handleSearch}
                placeholder="Search your groups here..."
              ></input>
              <br /> <br />
              {myGroupCards}
            </div>
          </div>
        </div>
      );
    }
  }
}

export default MyGroups;

// <div class="col-sm-12">
//               <div class="card">
//                 <div class="card-body">
//                   <h5 class="card-title">Special title treatment</h5>
//                   <p class="card-text">
//                     With supporting text below as a natural lead-in to
//                     additional content.
//                   </p>
//                   <a href="#" class="btn btn-primary">
//                     Go somewhere
//                   </a>
//                 </div>
//               </div>
//             </div>
