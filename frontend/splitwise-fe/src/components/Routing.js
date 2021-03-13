import React, { Component } from "react";
import { Route } from "react-router-dom";

import Login from "./Authentication/login";
import SignUp from "./SignUp/Signup";
import Navbar from "./LandingPage/Navbar";
import Logout from "./Authentication/logout";
import UpdateProfile from "./Users/UpdateProfile";
import CreateGroup from "./Groups/CreateGroup";
import MyGroups from "./Groups/MyGroups";
import GroupDetails from "./Groups/GroupDetails";
import RecentActivity from "./Groups/RecentActivity";
import Dashboard from "./Users/Dashboard";

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
        <Route path="/users/activity" component={RecentActivity} />
        <Route path="/users/dashboard" component={Dashboard} />
        {/* Groups */}
        <Route path="/groups/create" component={CreateGroup} />
        <Route path="/groups/mygroups" component={MyGroups} />
        <Route path="/groups/group-description" component={GroupDetails} />
      </div>
    );
  }
}

export default Routing;
