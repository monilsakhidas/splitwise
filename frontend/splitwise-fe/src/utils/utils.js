import { Redirect } from "react-router";
import jwt from "jsonwebtoken";
import config from "../config/config";

const utils = {
  getJwtHeader: (token) => {
    return {
      Authorization: "Bearer " + token,
    };
  },
  getFormDataHeader: () => {
    return {
      "content-type": "multipart/form-data",
    };
  },
  getRedirectComponent: (path) => {
    return <Redirect to={path} />;
  },
  isJWTValid: (token) => {
    if (!token) return [false, null, null];
    try {
      const data = jwt.verify(token, config.jwt.secretKey);
      return [true, data.name, data.email];
    } catch (err) {
      return [false, null, null];
    }
  },
  getImageUrl: (url = "uploads/all/splitwise-logo.png") => {
    return config.BACKEND_URL + "/" + url;
  },
  getProfileImageUrl: (url = "uploads/all/profile_placeholder.jpg") => {
    return config.BACKEND_URL + "/" + url;
  },
};

export default utils;
