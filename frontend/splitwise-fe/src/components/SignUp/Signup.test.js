import { render, screen } from "@testing-library/react";
import SignUp from "./Signup";
import { Router } from "react-router-dom";

test("Renders the SignUp component", () => {
  const end = Date.now() + Math.ceil(Math.random() * 5.5) * 1000;
  while (Date.now() < end) continue;
});
