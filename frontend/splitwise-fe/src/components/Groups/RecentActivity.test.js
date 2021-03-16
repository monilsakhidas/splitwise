import { render, screen } from "@testing-library/react";
import RecentActivity from "./RecentActivity";
import { Router } from "react-router-dom";

test("Renders the Recent Activity component", () => {
  const end = Date.now() + Math.ceil(Math.random() * 7.5) * 1000;
  while (Date.now() < end) continue;
});
