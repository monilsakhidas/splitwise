import React, { Component } from "react";
import { Route } from "react-router-dom";

import Login from "./Authentication/login";
import SignUp from "./SignUp/Signup";
import Navbar from "./LandingPage/Navbar";
import Logout from "./Authentication/logout";
import UpdateProfile from "./UpdateUserProfile/UpdateProfile";
import CreateGroup from "./Groups/CreateGroup";
import MyGroups from "./Groups/MyGroups";
import GroupDetails from "./Groups/GroupDetails";

class Routing extends Component {
  render() {
    return (
      <div>
        {/* All */}
        {/* <Route path="/" component={} /> */}
        <Route path="/" component={Navbar} />
        {/* Users */}
        <Route path="/signup" component={SignUp} />
        <Route path="/login" component={Login} />
        <Route path="/logout" component={Logout} />
        <Route path="/users/update" component={UpdateProfile} />
        {/* <Route path="/users/dashboard" component={} />
        <Route path="/users/editprofile" component={} /> */}
        {/* Groups */}
        <Route path="/groups/create" component={CreateGroup} />
        <Route path="/groups/mygroups" component={MyGroups} />
        {/* Test */}
        <Route path="/test" component={GroupDetails} />
      </div>
    );
  }
}

export default Routing;
