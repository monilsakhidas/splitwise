import { Component } from "react";
import cookie from "react-cookies";
import utils from "../../utils/utils";

class Logout extends Component {
  render() {
    const isJWTValid = utils.isJWTValid(cookie.load("jwtToken"))[0];
    if (isJWTValid) {
      const allCookies = cookie.loadAll();
      Object.keys(allCookies).forEach((cookieKey) => {
        cookie.remove(cookieKey, { path: "/" });
      });
    }
    return utils.getRedirectComponent("/");
  }
}

export default Logout;
