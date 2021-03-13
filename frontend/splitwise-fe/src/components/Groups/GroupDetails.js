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
    const [tokenState, _, __, loggedInUserId] = utils.isJWTValid(
      cookie.load("jwtToken")
    );
    console.log();
    if (this.props.location.state) {
      this.state = {
        tokenState,
        loggedInUserId,
        id: this.props.location.state.groupDetails.id,
        name: this.props.location.state.groupDetails.name,
        groupBalances: [],
        groupExpenses: [],
        image: this.props.location.state.groupDetails.image,
        loans: [],
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
      // group debts api
      const groupDebtsResponse = await axios.get(
        config.BACKEND_URL + "/groups/debts/" + this.state.id,
        { headers: utils.getJwtHeader(cookie.load("jwtToken")) }
      );

      // set group balances in state
      this.setState({
        groupBalances: groupBalanceResponse.data.groupBalances,
        groupExpenses: groupExpenseResponse.data.expenses,
        loans: groupDebtsResponse.data.loans,
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
      let groupDebts = null;
      if (this.state.loans.length != 0) {
        groupDebts = this.state.loans.map((loan) => {
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
                            loan.loaneeImage == null
                              ? utils.getProfileImageUrl()
                              : utils.getProfileImageUrl(loan.loaneeImage)
                          }
                        />
                      </div>
                      <div class="col-sm-8">
                        <div style={{ marginLeft: "20px", marginTop: "10px" }}>
                          <h5>{loan.loaneeName}</h5>
                          <span
                            style={{
                              color: "orange",
                            }}
                          >
                            owes&nbsp;
                            <b style={{ color: "black" }}>{loan.loanerName}</b>
                            &nbsp;
                            {loan.amount}
                          </span>
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
        groupDebts = (
          <div style={{ margin: "210px" }}>
            <h4 style={{ font: "Bookman" }}>All Accounts settled!</h4>
          </div>
        );
      }
      console.log(groupDebts);
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
                          <span
                            style={{
                              color: userBalance.groupStatement.includes("get")
                                ? "#20BF9F"
                                : "orange",
                            }}
                          >
                            {userBalance.groupStatement}
                          </span>
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
              className="row"
              style={{
                borderBottom: "1px solid #ddd",
                borderRight: "1px solid #ddd",
                borderLeft: "1px solid #ddd",
              }}
            >
              <div className="card" style={{ borderWidth: "0px" }}>
                <div
                  class="card-horizontal"
                  style={{ display: "flex", flex: "1 1 auto", width: "400px" }}
                >
                  <div className="img-square-wrapper">
                    <img
                      height="100px"
                      width="100px"
                      style={{
                        borderRadius: "200px",
                        marginTop: "12px",
                        marginLeft: "16px",
                      }}
                      src={
                        expense.image == null
                          ? utils.getProfileImageUrl()
                          : utils.getProfileImageUrl(expense.image)
                      }
                    />
                  </div>
                  <div class="card-body">
                    <h4
                      class="card-title"
                      style={{ width: "600px", fontSize: "25px" }}
                    >
                      {expense.description}
                    </h4>
                    <p class="card-text">
                      <div
                        style={{
                          color:
                            expense.userId !== this.state.loggedInUserId
                              ? "orange"
                              : "#20BF9F",
                          width: "600px",
                          fontSize: "20px",
                        }}
                      >
                        {expense.userId != this.state.loggedInUserId
                          ? expense.paidByUserName + " paid " + expense.amount
                          : "You paid " + expense.amount}
                        <br />
                      </div>
                      <div>
                        <small class="text-muted">{expense.time}</small>
                      </div>
                    </p>
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

      // return (
      //   <div>
      //     <div
      //       className="row"
      //       style={{
      //         marginLeft: "200px",
      //         height: "10vh",
      //         backgroundColor: "whitesmoke",
      //       }}
      //     >
      //       <div class="col-3">
      //         <img
      //           height="50px"
      //           width="50px"
      //           style={{
      //             borderRadius: "50px",
      //             marginTop: "10px",
      //           }}
      //           src={this.state.image}
      //         />
      //       </div>
      //       <div
      //         class="col-3"
      //         style={{
      //           fontSize: "27px",
      //         }}
      //       >
      //         <div style={{ marginTop: "15px" }}>{this.state.name}</div>
      //       </div>
      //       <div class="col-2">
      //         <button
      //           className="btn large btn orange"
      //           style={{
      //             marginBottom: "-50px",
      //             marginLeft: "50px",
      //             backgroundColor: "#FF652F",
      //             color: "white",
      //           }}
      //           onClick={this.togglePopUp}
      //         >
      //           Add Expense
      //         </button>
      //         <div style={{ height: "100px" }}>
      //           <Modal
      //             style={customStyles}
      //             isOpen={this.state.isPopUpOpen}
      //             ariaHideApp={false}
      //           >
      //             <AddExpense
      //               groupDetails={this.state}
      //               closePopUp={this.togglePopUp}
      //             />
      //           </Modal>
      //         </div>
      //       </div>
      //       <div class="col-3" style={{ backgroundColor: "white" }}>
      //         {groupBalances}
      //       </div>
      //       <div class="col-1" style={{ backgroundColor: "white" }}></div>
      //     </div>
      //     <div
      //       class="col-1"
      //       style={{ textAlign: "center", backgroundColor: "white" }}
      //     ></div>
      //     <div class="col-8" style={{ textAlign: "center", marginTop: "2px" }}>
      //       {groupExpenses}
      //     </div>
      //   </div>
      // );
      return (
        <div>
          <div className="row">
            <div className="col-3">{groupDebts}</div>
            <div className="col-6">
              <div
                className="row"
                style={{ backgroundColor: "whitesmoke", height: "70px" }}
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
                  class="col-8"
                  style={{
                    fontSize: "27px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ marginTop: "15px" }}>{this.state.name}</div>
                </div>
                <div class="col-3">
                  <button
                    className="btn large btn orange"
                    style={{
                      marginBottom: "-42px",
                      marginLeft: "30px",
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
              </div>
              {groupExpenses}
            </div>
            <div className="col-3">{groupBalances}</div>
          </div>
        </div>
      );
    }
  }
}

export default GroupDetails;
