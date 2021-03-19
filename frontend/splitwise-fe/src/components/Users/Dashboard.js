import React, { Component } from "react";
import utils from "../../utils/utils";
import config from "../../config/config";
import cookie from "react-cookies";
import axios from "axios";
import Modal from "react-modal";
import SettleUp from "../Users/SettleUp";
import defaultProfileImage from "../../images/profile_placeholder.jpg";

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

class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tokenState: utils.isJWTValid(cookie.load("jwtToken"))[0],
      areYouOwed: false,
      doYouOwe: false,
      youOweTotal: "",
      youGetTotal: "",
      totalBalance: "",
      youOwe: {},
      doYouOwe: {},
      isPopUpOpen: false,
    };
  }

  togglePopUp = () => {
    this.setState({
      isPopUpOpen: !this.state.isPopUpOpen,
    });
  };

  async componentDidMount() {
    try {
      // Get currency
      const currencyResponse = await axios.get(
        config.BACKEND_URL + "/users/currency",
        {
          headers: utils.getJwtHeader(cookie.load("jwtToken")),
        }
      );

      // Get debts
      const balanceStatementsResponse = await axios.get(
        config.BACKEND_URL + "/users/debts",
        {
          headers: utils.getJwtHeader(cookie.load("jwtToken")),
        }
      );

      // Get total balance
      const balanceResponse = await axios.get(
        config.BACKEND_URL + "/users/balance",
        {
          headers: utils.getJwtHeader(cookie.load("jwtToken")),
        }
      );

      const youAreOwed = balanceStatementsResponse.data.youAreOwed;
      const youOwe = balanceStatementsResponse.data.youOwe;
      this.setState({
        youOwe,
        youAreOwed,
        doYouOwe: !utils.isEmpty(youOwe),
        areYouOwed: !utils.isEmpty(youAreOwed),
        youOweTotal: balanceResponse.data.owe
          ? balanceResponse.data.owe
          : currencyResponse.data.symbol + "0.00",
        youGetTotal: balanceResponse.data.get
          ? balanceResponse.data.get
          : currencyResponse.data.symbol + "0.00",
        totalBalance: balanceResponse.data.total
          ? balanceResponse.data.total
          : currencyResponse.data.symbol + "0.00",
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        this.setState({
          tokenState: false,
        });
        console.log(error.response);
      }
    }
  }

  render() {
    if (!this.state.tokenState) {
      return utils.getRedirectComponent("/login");
    } else {
      let youOwe = null;
      let youAreOwed = null;

      // YOU OWE HTML
      if (!this.state.doYouOwe) {
        youOwe = (
          <div className="row">
            <div style={{ margin: "170px" }}>
              <h4 style={{ font: "Bookman" }}>You do not owe anything</h4>
            </div>
          </div>
        );
      } else {
        youOwe = [];
        for (let key in this.state.youOwe) {
          const statementList = this.state.youOwe[key].statements.map(
            (statement) => {
              return (
                <li>
                  <small class="text-muted">{statement}</small>
                </li>
              );
            }
          );
          youOwe.push(
            <div className="row">
              <div className="card" style={{ borderWidth: "0px" }}>
                <div
                  class="card-horizontal"
                  style={{ display: "flex", flex: "1 1 auto" }}
                >
                  <div className="img-square-wrapper">
                    <img
                      height="60px"
                      width="60px"
                      style={{
                        borderRadius: "30px",
                        marginTop: "22px",
                        marginLeft: "16px",
                      }}
                      src={
                        this.state.youOwe[key].image == null
                          ? utils.getProfileImageUrl()
                          : utils.getProfileImageUrl(
                              this.state.youOwe[key].image
                            )
                      }
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = defaultProfileImage;
                      }}
                    />
                  </div>
                  <div class="card-body">
                    <div style={{ fontSize: "x-large" }}>
                      {this.state.youOwe[key].name}
                    </div>
                    <div style={{ color: "orange" }}>
                      <text class="card-title">
                        you owe{" "}
                        {utils.getFormattedAmount(
                          Object.values(this.state.youOwe[key].amount)
                        )}
                      </text>
                    </div>

                    {/* <p class="card-text"> */}
                    <div class="card-text" style={{ marginLeft: "-19px" }}>
                      <ul style={{ listStyleType: "circle" }}>
                        {statementList}
                      </ul>
                    </div>
                    {/* </p> */}
                  </div>
                </div>
              </div>
            </div>
          );
        }
      }

      // YOU ARE OWED HTML
      if (!this.state.areYouOwed) {
        youAreOwed = (
          <div className="row">
            <div style={{ margin: "170px" }}>
              <h4 style={{ font: "Bookman" }}>You are not owed anything</h4>
            </div>
          </div>
        );
      } else {
        youAreOwed = [];
        for (let key in this.state.youAreOwed) {
          const statementList = this.state.youAreOwed[key].statements.map(
            (statement) => {
              return (
                <li>
                  <small class="text-muted">{statement}</small>
                </li>
              );
            }
          );
          youAreOwed.push(
            <div className="row">
              <div className="card" style={{ borderWidth: "0px" }}>
                <div
                  class="card-horizontal"
                  style={{ display: "flex", flex: "1 1 auto" }}
                >
                  <div className="img-square-wrapper">
                    <img
                      height="60px"
                      width="60px"
                      style={{
                        borderRadius: "30px",
                        marginTop: "22px",
                        marginLeft: "16px",
                      }}
                      src={
                        this.state.youAreOwed[key].image == null
                          ? utils.getProfileImageUrl()
                          : utils.getProfileImageUrl(
                              this.state.youAreOwed[key].image
                            )
                      }
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = defaultProfileImage;
                      }}
                    />
                  </div>
                  <div class="card-body">
                    <div style={{ fontSize: "x-large" }}>
                      {this.state.youAreOwed[key].name}
                    </div>
                    <div style={{ color: "#5BC5A7" }}>
                      <text class="card-title">
                        owes you{" "}
                        {utils.getFormattedAmount(
                          Object.values(this.state.youAreOwed[key].amount)
                        )}
                      </text>
                    </div>
                    <div class="card-text" style={{ marginLeft: "-19px" }}>
                      <ul style={{ listStyleType: "circle" }}>
                        {statementList}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }
      }
      return (
        <div>
          <div className="row">
            <div className="col-1"></div>
            <div
              className="col-10"
              style={{
                borderLeft: "1px solid #ddd",
                borderRight: "1px solid #ddd",
              }}
            >
              <div
                className="row"
                style={{
                  backgroundColor: "whitesmoke",
                  borderBottom: "1px solid #ddd",
                  height: "80px",
                }}
              >
                <div
                  className="col-md-4"
                  style={{ marginTop: "21px", marginLeft: "523px" }}
                >
                  <div className="row">
                    <h2>Dashboard</h2>
                  </div>
                </div>
                <div className="col-md-2">
                  <div
                    className="row"
                    style={{ marginTop: "22px", marginLeft: "97px" }}
                  >
                    <button
                      className="btn large btn orange"
                      style={{
                        backgroundColor: "#5BC5A7",
                        color: "white",
                      }}
                      onClick={this.togglePopUp}
                    >
                      Settle up
                    </button>
                    <div>
                      <Modal
                        style={customStyles}
                        isOpen={this.state.isPopUpOpen}
                        ariaHideApp={false}
                      >
                        <SettleUp closePopUp={this.togglePopUp} />
                      </Modal>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="row"
                style={{
                  backgroundColor: "whitesmoke",
                  height: "80px",
                  borderBottom: "1px solid #ddd",
                }}
              >
                <div className="col-4">
                  <div className="row">
                    <div style={{ paddingTop: "9px", paddingLeft: "140px" }}>
                      <h5 className="text-muted">Total balance</h5>
                    </div>
                  </div>
                  <div className="row">
                    <div style={{ paddingTop: "0px", paddingLeft: "140px" }}>
                      <small>{this.state.totalBalance}</small>
                    </div>
                  </div>
                </div>
                <div
                  className="col-4"
                  style={{
                    borderLeft: "1px solid #ddd",
                    borderRight: "1px solid #ddd",
                  }}
                >
                  <div className="row">
                    <div style={{ paddingTop: "9px", paddingLeft: "140px" }}>
                      <h5 className="text-muted">You owe</h5>
                    </div>
                  </div>
                  <div className="row">
                    <div
                      style={{
                        paddingTop: "0px",
                        paddingLeft: "140px",
                        color: "#FF652F",
                      }}
                    >
                      <small>{this.state.youOweTotal}</small>
                    </div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="row">
                    <div style={{ paddingTop: "9px", paddingLeft: "140px" }}>
                      <h5 className="text-muted">You are owed</h5>
                    </div>
                  </div>
                  <div className="row">
                    <div
                      style={{
                        paddingTop: "0px",
                        paddingLeft: "140px",
                        color: "#5BC5A7",
                      }}
                    >
                      <small>{this.state.youGetTotal}</small>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-6">
                  <div style={{ marginLeft: "6px", marginTop: "10px" }}>
                    <h5 className="text-muted">YOU OWE</h5>
                  </div>
                </div>
                <div className="col-6">
                  <div style={{ paddingLeft: "428px", paddingTop: "10px" }}>
                    <h5 className="text-muted">YOU ARE OWED</h5>
                  </div>
                </div>
              </div>
              <div className="row">
                <div
                  className="col-6"
                  style={{ borderRight: "1px solid #ddd" }}
                >
                  {/* YOU OWES STARTS FROM HERE */}
                  {youOwe}
                  {/* END HERE */}
                </div>
                <div className="col-6">
                  {/* YOU ARE OWED STARTS FROM HERE */}
                  {youAreOwed}
                  {/* END HERE */}
                </div>
              </div>
            </div>
            <div className="col-1"></div>
          </div>
        </div>
      );
    }
  }
}

export default Dashboard;
