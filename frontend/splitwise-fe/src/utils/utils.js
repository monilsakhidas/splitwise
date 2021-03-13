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
    if (!token) return [false, null, null, null];
    try {
      const data = jwt.verify(token, config.jwt.secretKey);
      return [true, data.name, data.email, data.id];
    } catch (err) {
      return [false, null, null, null];
    }
  },
  getImageUrl: (url = "uploads/all/splitwise-logo.png") => {
    // don't mess with already converted images with proper path
    if (url.startsWith("http")) return url;
    return config.BACKEND_URL + "/" + url;
  },
  getProfileImageUrl: (url = "uploads/all/profile_placeholder.jpg") => {
    // don't mess with already converted images with proper path
    if (url.startsWith("http")) return url;
    return config.BACKEND_URL + "/" + url;
  },
  // Returns boolean stating whether the object is empty or not
  isEmpty: (obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        return false;
      }
    }
    return true;
  },
  getFormattedAmount: (amountList) => {
    if (amountList.length == 1) {
      return amountList[0];
    } else if (amountList.length >= 2) {
      const commaSeperatedAmountList = amountList.join(", ");
      const lastCommaIndex = commaSeperatedAmountList.lastIndexOf(",");
      const finalAmountString =
        amountList.join().slice(0, lastCommaIndex) +
        " and" +
        commaSeperatedAmountList.slice(
          lastCommaIndex + 1,
          commaSeperatedAmountList.length + 1
        );
      return finalAmountString;
    }
  },
};

export default utils;
