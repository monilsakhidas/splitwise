import { Component } from "react";
import cookie from "react-cookies";
import utils from "../../utils/utils";
import { connect } from "react-redux";
import { logout } from "../../features/userSlice";

class Logout extends Component {
  render() {
    const isJWTValid = utils.isJWTValid(cookie.load("jwtToken"))[0];
    if (isJWTValid) {
      const allCookies = cookie.loadAll();
      Object.keys(allCookies).forEach((cookieKey) => {
        cookie.remove(cookieKey, { path: "/" });
      });
      // Redux action NOT WORKING
      this.props.logout({});
    }
    return utils.getRedirectComponent("/");
  }
}

const matchStateToProps = (state) => {
  return {};
};

const matchDispatchToProps = (dispatch) => {
  return {
    logout: () => dispatch(logout()),
  };
};

export default connect(matchStateToProps, matchDispatchToProps)(Logout);
