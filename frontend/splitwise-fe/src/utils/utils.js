import { Redirect } from "react-router";
import jwt from "jsonwebtoken";
import config from "../config/config";

const utils = {
  getJwtHeader: (token) => {
    return {
      Authorization: "Bearer " + token,
    };
  },
  getRedirectComponent: (path) => {
    return <Redirect to={path} />;
  },
  isJWTValid: (token) => {
    if (!token) return [false, null, null];
    try {
      const data = jwt.verify(token, config.jwt.secretKey);
      console.log(data);
      return [true, data.name, data.email];
    } catch (err) {
      return [false, null, null];
    }
  },
};

export default utils;
