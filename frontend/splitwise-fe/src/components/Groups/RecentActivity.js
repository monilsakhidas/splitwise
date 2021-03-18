import React, { Component } from "react";
import utils from "../../utils/utils";
import config from "../../config/config";
import cookie from "react-cookies";
import axios from "axios";
import Select from "react-select";

class RecentActivity extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tokenState: utils.isJWTValid(cookie.load("jwtToken"))[0],
      selectedOrder: 1,
      selectedGroupId: 0,
      groups: [{ label: "All groups", value: 0 }],
      activities: [],
    };
  }

  handleGroupChange = async (onGroupChangeEvent) => {
    const newGroup = onGroupChangeEvent.value;
    let activitiesResponse = null;
    if (newGroup == 0) {
      // Find activities across all groups
      activitiesResponse = await axios.get(
        config.BACKEND_URL +
          "/users/activity?" +
          "orderBy=" +
          this.state.selectedOrder,
        { headers: utils.getJwtHeader(cookie.load("jwtToken")) }
      );
    } else {
      // Find activities across selected groups
      activitiesResponse = await axios.get(
        config.BACKEND_URL +
          "/users/activity?" +
          "groupId=" +
          newGroup +
          "&orderBy=" +
          this.state.selectedOrder,
        { headers: utils.getJwtHeader(cookie.load("jwtToken")) }
      );
    }

    // Set state
    this.setState({
      selectedGroupId: onGroupChangeEvent.value,
      activities: activitiesResponse.data.recentActivities,
    });
  };

  handleOrderingChange = async (onOrderChangeEvent) => {
    const newOrder = onOrderChangeEvent.value;
    let activitiesResponse = null;
    if (this.state.selectedGroupId == 0) {
      // Find activities across all groups
      activitiesResponse = await axios.get(
        config.BACKEND_URL + "/users/activity?" + "orderBy=" + newOrder,
        { headers: utils.getJwtHeader(cookie.load("jwtToken")) }
      );
    } else {
      // Find activities across selected groups
      activitiesResponse = await axios.get(
        config.BACKEND_URL +
          "/users/activity?" +
          "groupId=" +
          this.state.selectedGroupId +
          "&orderBy=" +
          newOrder,
        { headers: utils.getJwtHeader(cookie.load("jwtToken")) }
      );
    }

    this.setState({
      selectedOrder: onOrderChangeEvent.value,
      activities: activitiesResponse.data.recentActivities,
    });
  };

  componentDidMount = async () => {
    try {
      // Find all groups of the logged in user
      const response = await axios.get(
        config.BACKEND_URL + "/groups/mygroups",
        {
          headers: utils.getJwtHeader(cookie.load("jwtToken")),
        }
      );
      const myGroupOptions = response.data.groups.map((group) => {
        return {
          label: group.name,
          value: group.id,
        };
      });

      // Find activities across all groups sorted by most recent first
      const activitiesResponse = await axios.get(
        config.BACKEND_URL +
          "/users/activity?" +
          "orderBy=" +
          this.state.selectedOrder,
        { headers: utils.getJwtHeader(cookie.load("jwtToken")) }
      );
      // Set state
      this.setState({
        groups: [...this.state.groups, ...myGroupOptions],
        activities: activitiesResponse.data.recentActivities,
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        this.setState({
          tokenState: false,
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
      let activityCards = null;
      if (
        this.state.activities == null ||
        (this.state.activities && this.state.activities.length == 0)
      ) {
        activityCards = (
          <div style={{ marginTop: "230px", marginLeft: "370px" }}>
            <h4 style={{ font: "Bookman" }}>No recent activity</h4>
          </div>
        );
      } else {
        activityCards = this.state.activities.map((activity) => {
          return (
            <div
              className="row"
              style={{
                borderBottom: "1px solid #ddd",
                borderLeft: "1px solid #ddd",
              }}
            >
              <div className="card" style={{ borderWidth: "0px" }}>
                <div
                  class="card-horizontal"
                  style={{ display: "flex", flex: "1 1 auto" }}
                >
                  <div className="img-square-wrapper">
                    <img
                      height="80px"
                      width="80px"
                      style={{
                        borderRadius: "80px",
                        marginTop: "12px",
                        marginLeft: "16px",
                      }}
                      src={
                        activity.image == null
                          ? utils.getProfileImageUrl()
                          : utils.getProfileImageUrl(activity.image)
                      }
                    />
                  </div>
                  <div class="card-body">
                    <h4 class="card-title">{activity.description}</h4>
                    <p class="card-text">
                      <div
                        style={{
                          color:
                            activity.balanceStatement.indexOf("get") == -1
                              ? activity.balanceStatement.indexOf(
                                  "transactions"
                                ) == -1
                                ? "orange"
                                : "black"
                              : "#20BF9F",
                        }}
                      >
                        {activity.balanceStatement}
                        <br />
                      </div>
                      <div
                        style={{
                          color:
                            activity.expenseStatement &&
                            activity.expenseStatement.indexOf("get") == -1
                              ? "orange"
                              : "#20BF9F",
                        }}
                      >
                        {activity.expenseStatement}
                        <br />
                      </div>
                      <div>
                        <small class="text-muted">{activity.time}</small>
                      </div>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        });
      }
      return (
        <div>
          <div className="row">
            <div className="col-4" style={{ textAlign: "left" }}>
              <div className="row">
                <div className="col-12" style={{ marginTop: "10px" }}>
                  <Select
                    options={this.state.groups}
                    placeholder="Select group"
                    onChange={this.handleGroupChange}
                  />
                </div>
                <div className="col-12" style={{ marginTop: "10px" }}>
                  <Select
                    options={[
                      { label: "Most recent first", value: 1 },
                      { label: "Least recent first", value: 2 },
                    ]}
                    placeholder="Select order by"
                    onChange={this.handleOrderingChange}
                  />
                </div>
              </div>
            </div>
            <div className="col-8">
              <div
                className="row"
                style={{
                  backgroundColor: "whitesmoke",
                  height: "70px",
                  borderBottom: "1px solid #ddd",
                  borderLeft: "1px solid #ddd",
                }}
              >
                <div
                  style={{
                    marginLeft: "20px",
                    marginTop: "14px",
                  }}
                >
                  <h2>Recent Activity</h2>
                </div>
              </div>
              {activityCards}
              {/* <div
                class="card-footer"
                style={{ height: "10px", borderWidth: "0px" }}
              >
              </div> */}
            </div>
          </div>
        </div>
      );
    }
  }
}

export default RecentActivity;
