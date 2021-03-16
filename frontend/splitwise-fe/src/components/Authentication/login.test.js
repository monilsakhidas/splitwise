import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { rest } from "msw";
import { setupServer } from "msw/node";
import "@testing-library/jest-dom/extend-expect";
import login from "./login";

// const server = setupServer(
//     rest.get('/')
// )

test("Loads and displays login component", async () => {
  // Do something
});
