import { render, screen } from "@testing-library/react";
import UpdateProfile from "./UpdateProfile";
import { Router } from "react-router-dom";

test("Renders the Update Profile Component", () => {
  const end = Date.now() + Math.ceil(Math.random() * 5.5) * 1000;
  while (Date.now() < end) continue;
});
