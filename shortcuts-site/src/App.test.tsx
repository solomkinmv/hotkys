import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

test("renders learn react link", async () => {
    render(
      <BrowserRouter>
          <App />
      </BrowserRouter>,
    );

    const linkElement = await screen.findByText(/Shortcuts Disco/i);
    expect(linkElement).toBeInTheDocument();
});
