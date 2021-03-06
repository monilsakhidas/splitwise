import React, { Component } from "react";
import utils from "../../utils/utils";
import config from "../../config/config";
import cookie from "react-cookies";
import axios from "axios";
import AddExpense from "./AddExpense";
import Modal from "react-modal";

const customStyles = {
  content: {
    top: "40%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    height: "460px",
    width: "500px",
    transform: "translate(-50%, -50%)",
  },
};

class GroupDetails extends Component {
  constructor(props) {
    super(props);
    if (this.props.location.state) {
      this.state = {
        tokenState: utils.isJWTValid(cookie.load("jwtToken"))[0],
        id: this.props.location.state.groupDetails.id,
        name: this.props.location.state.groupDetails.name,
        groupBalances: [],
        groupExpenses: [],
        image: this.props.location.state.groupDetails.image,
        isPopUpOpen: false,
        outOfState: false,
      };
    } else {
      this.setState({
        outOfState: true,
      });
    }
  }

  togglePopUp = () => {
    this.setState({
      isPopUpOpen: !this.state.isPopUpOpen,
    });
  };
  componentDidMount = async () => {
    try {
      // group balance api
      const groupBalanceResponse = await axios.get(
        config.BACKEND_URL + "/groups/groupbalance/" + this.state.id,
        { headers: utils.getJwtHeader(cookie.load("jwtToken")) }
      );
      // group expenses api
      const groupExpenseResponse = await axios.get(
        config.BACKEND_URL + "/groups/expenses/" + this.state.id,
        { headers: utils.getJwtHeader(cookie.load("jwtToken")) }
      );
      // set group balances in state
      this.setState({
        groupBalances: groupBalanceResponse.data.groupBalances,
        groupExpenses: groupExpenseResponse.data.expenses,
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
    } else if (this.state.outOfState) {
      return utils.getRedirectComponent("/groups/mygroups");
    } else {
      let groupBalances = null;
      let groupExpenses = null;
      if (this.state.groupBalances.length != 0) {
        groupBalances = this.state.groupBalances.map((userBalance) => {
          return (
            <div>
              <div class="card-content">
                <div class="card-body cleartfix">
                  <div class="media align-items-stretch">
                    <div class="row">
                      <div class="col-sm-4">
                        <img
                          height="100px"
                          width="100px"
                          style={{ borderRadius: "200px" }}
                          src={
                            userBalance.image == null
                              ? utils.getProfileImageUrl()
                              : utils.getProfileImageUrl(userBalance.image)
                          }
                        />
                      </div>
                      <div class="col-sm-8">
                        <div style={{ marginLeft: "20px", marginTop: "10px" }}>
                          <h5>{userBalance.name}</h5>
                          <span>{userBalance.groupStatement}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        });
      } else {
        groupBalances = (
          <div style={{ margin: "210px" }}>
            <h4 style={{ font: "Bookman" }}>All Accounts settled!</h4>
          </div>
        );
      }
      if (this.state.groupExpenses.length != 0) {
        groupExpenses = this.state.groupExpenses.map((expense) => {
          return (
            <div
              class="card-content"
              style={{
                marginLeft: "0px",
                marginTop: "1px",
              }}
            >
              <div
                class="card-body cleartfix"
                style={{ textAlign: "center", marginTop: "2px" }}
              >
                <div
                  class="media align-items-stretch"
                  style={{ textAlign: "center", marginTop: "2px" }}
                >
                  <div
                    class="row"
                    style={{
                      textAlign: "center",
                      marginTop: "2px",
                      marginLeft: "200px",
                    }}
                  >
                    <div class="col-2" style={{ width: "600px" }}>
                      <div style={{ textAlign: "left", marginLeft: "-24px" }}>
                        {expense.month.toUpperCase()}
                      </div>
                      <div style={{ textAlign: "left", marginLeft: "-10px" }}>
                        {expense.day}
                      </div>
                    </div>
                    <div
                      class="col-5"
                      style={{
                        textAlign: "left",
                        marginTop: "2px",
                        marginLeft: "0px",
                      }}
                    >
                      {expense.description}
                    </div>
                    <div
                      class="col-5"
                      style={{
                        textAlign: "right",
                        marginLeft: "0px",
                        marginTop: "2px",
                      }}
                    >
                      {expense.paidByUserName + " paid " + expense.amount}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        });
      } else {
        groupExpenses = (
          <div style={{ margin: "170px", textAlign: "right" }}>
            <h4 style={{ font: "Bookman" }}>No Expenses recorded yet!</h4>
          </div>
        );
      }

      return (
        <div>
          <div
            className="row"
            style={{
              marginLeft: "200px",
              height: "10vh",
              backgroundColor: "whitesmoke",
            }}
          >
            <div class="col-1">
              <img
                height="50px"
                width="50px"
                style={{
                  borderRadius: "50px",
                  marginTop: "10px",
                }}
                src={this.state.image}
              />
            </div>
            <div
              class="col-4"
              style={{
                fontSize: "27px",
              }}
            >
              <div style={{ marginTop: "15px" }}>{this.state.name}</div>
            </div>
            <div class="col-2">
              <button
                className="btn large btn orange"
                style={{
                  marginBottom: "-50px",
                  marginLeft: "50px",
                  backgroundColor: "#FF652F",
                  color: "white",
                }}
                onClick={this.togglePopUp}
              >
                Add Expense
              </button>
              <div style={{ height: "100px" }}>
                <Modal
                  style={customStyles}
                  isOpen={this.state.isPopUpOpen}
                  ariaHideApp={false}
                >
                  <AddExpense
                    groupDetails={this.state}
                    closePopUp={this.togglePopUp}
                  />
                </Modal>
              </div>
            </div>
            <div class="col-4" style={{ backgroundColor: "white" }}>
              {groupBalances}
            </div>
            <div class="col-1" style={{ backgroundColor: "white" }}></div>
          </div>
          <div
            class="col-1"
            style={{ textAlign: "center", backgroundColor: "white" }}
          ></div>
          <div class="col-7" style={{ textAlign: "center", marginTop: "2px" }}>
            {groupExpenses}
          </div>
        </div>
      );
    }
  }
}

export default GroupDetails;
