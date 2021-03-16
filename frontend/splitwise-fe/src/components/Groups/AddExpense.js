import React, { Component } from "react";
import utils from "../../utils/utils";
import config from "../../config/config";
import cookie from "react-cookies";
import axios from "axios";

class AddExpense extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: this.props.groupDetails.id,
      name: this.props.groupDetails.name,
      groupImage:
        this.props.groupDetails.image == null
          ? utils.getImageUrl()
          : utils.getImageUrl(this.props.groupDetails.image),
      tokenState: utils.isJWTValid(cookie.load("jwtToken"))[0],
      wasExpenseAdded: false,
      amount: "",
      description: "",
      currencySymbol: "",
      error: false,
      errorMessage: "",
    };
  }

  handleAmountChange = (amountChangeEvent) => {
    if (amountChangeEvent.target.value <= 0) {
      this.setState({
        errorMessage: "Enter a valid amount to record the expense",
        error: true,
        amount: "",
      });
    } else {
      this.setState({
        errorMessage: "",
        error: false,
        amount: amountChangeEvent.target.value,
      });
    }
  };

  handleDescriptionChange = (descriptionChangeEvent) => {
    if (
      /[~`!#$@%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(
        descriptionChangeEvent.target.value
      )
    ) {
      this.setState({
        error: true,
        errorMessage: "Description should not contain any special characters.",
        description: "",
      });
    } else {
      this.setState({
        error: false,
        errorMessage: "",
        description: descriptionChangeEvent.target.value,
      });
    }
  };

  handleSubmit = async (handleSubmitEvent) => {
    handleSubmitEvent.preventDefault();
    try {
      const response = await axios.post(
        config.BACKEND_URL + "/groups/addexpense",
        {
          description: this.state.description,
          groupId: this.state.id,
          amount: this.state.amount,
        },
        { headers: utils.getJwtHeader(cookie.load("jwtToken")) }
      );
      window.location.reload();
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
        console.log(error);
      }
    }
  };

  componentDidMount = async () => {
    // Find the currency of the user
    try {
      const response = await axios.get(config.BACKEND_URL + "/users/currency", {
        headers: utils.getJwtHeader(cookie.load("jwtToken")),
      });
      this.setState({
        currencySymbol: response.data.symbol,
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
          <div class="container">
            <div
              class="row"
              style={{ backgroundColor: "#20BF9F", color: "white" }}
            >
              <p
                style={{
                  marginLeft: "160px",
                  marginTop: "10px",
                  fontWeight: "100px",
                }}
              >
                Add an Expense
              </p>
            </div>
            <div class="row" style={{ backgroundColor: "whitesmoke" }}>
              <p style={{ margin: "10px" }}>
                With <b>you</b> and
                <img
                  style={{
                    marginLeft: "5px",
                    borderRadius: "200px",
                    marginBottom: "3px",
                  }}
                  src={this.state.groupImage}
                  width="20"
                  height="20"
                  alt=""
                />
                &nbsp; All of <b>{this.state.name}</b>
              </p>
            </div>
            <div class="row">
              <h1></h1>
            </div>
            <div class="row">
              <h1></h1>
            </div>
            <div class="row">
              <h1></h1>
            </div>
            <div class="row">
              <div className="col-1"></div>
              <div className="col-2"></div>
              {/* <div className="col-3">
                  <img src={description} width="100px" height="100px" alt="" />
                </div> */}
              <div className="col-9">
                <form onSubmit={this.handleSubmit} id="Login" method="POST">
                  <input
                    placeholder="Enter Description"
                    type="text"
                    id="description"
                    name="description"
                    style={{ border: "0", borderBottom: "2px dotted" }}
                    onChange={this.handleDescriptionChange}
                  ></input>
                  <div className="row">
                    <input
                      class="input-group-prepend"
                      value={this.state.currencySymbol}
                      size="3"
                      style={{
                        marginTop: "10px",
                        marginLeft: "13px",
                        marginRight: "5px",
                        border: "0",
                        marginBottom: "-13px",
                      }}
                    ></input>
                    {/* <div
                      class="input-group-prepend"
                      style={{
                        marginTop: "0px",
                        marginLeft: "0px",
                        marginRight: "0px",
                        border: "0",
                        marginBottom: "0px",
                      }}
                    >
                      <span>{this.state.currencySymbol}</span>
                    </div> */}
                    <input
                      placeholder="0.00"
                      type="number"
                      min="0"
                      size="19"
                      id="amount"
                      name="amount"
                      required
                      style={{
                        border: "0",
                        borderBottom: "2px dotted",
                        marginTop: "20px",
                        marginLeft: "-10px",
                        width: "142.5px",
                      }}
                      onChange={this.handleAmountChange}
                    ></input>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-amber"
                    style={{
                      backgroundColor: "#20BF9F",
                      marginTop: "20px",
                      marginLeft: "0px",
                    }}
                    onSubmit={this.handleSubmit}
                  >
                    Save
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger"
                    style={{
                      backgroundColor: "red",
                      marginTop: "20px",
                      marginLeft: "10px",
                    }}
                    onClick={this.props.closePopUp}
                  >
                    Close
                  </button>
                </form>
                {renderError}
              </div>
            </div>
          </div>
        </div>
      );
    }
  }
}

export default AddExpense;
