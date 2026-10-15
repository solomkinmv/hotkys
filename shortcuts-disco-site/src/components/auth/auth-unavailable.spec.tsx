import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const mockAuth = jest.fn();
jest.mock("@/components/auth/auth-provider", () => ({ useAuth: mockAuth }));
jest.mock("next/navigation", () => ({
  usePathname: () => "/favorites",
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock("@clerk/react", () => ({
  SignIn: () => <div>Clerk sign-in form</div>,
}));

const { AuthUnavailableGate } =
  require("./auth-unavailable") as typeof import("./auth-unavailable");
const { LoginForm } = require("./login-form") as typeof import("./login-form");
const { UserMenu } = require("./user-menu") as typeof import("./user-menu");

const UNAVAILABLE_COPY =
  "Couldn’t reach sign-in. Check your connection or ad blocker and retry.";

function setAuth(isUnavailable: boolean) {
  mockAuth.mockReturnValue({
    user: null,
    isLoading: false,
    isConfigured: true,
    isUnavailable,
    signOut: async () => {},
  });
}

function AccountContent({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}

describe("sign-in unavailable fallbacks", () => {
  it("replaces account pages with a retry notice", () => {
    setAuth(true);
    render(
      <AuthUnavailableGate>
        <AccountContent>Your favorites</AccountContent>
      </AuthUnavailableGate>,
    );

    expect(screen.queryByText("Your favorites")).toBeNull();
    expect(screen.getByRole("alert").textContent).toContain(UNAVAILABLE_COPY);
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  });

  it("renders account pages normally while sign-in is available", () => {
    setAuth(false);
    render(
      <AuthUnavailableGate>
        <AccountContent>Your favorites</AccountContent>
      </AuthUnavailableGate>,
    );

    expect(screen.getByText("Your favorites")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows the notice instead of the Clerk form on the login page", () => {
    setAuth(true);
    render(<LoginForm />);

    expect(screen.queryByText("Clerk sign-in form")).toBeNull();
    expect(screen.getByRole("alert").textContent).toContain(UNAVAILABLE_COPY);
    expect(screen.getByRole("heading", { level: 2 })).toBeTruthy();
  });

  it("falls back to a plain sign-in link in the header", () => {
    setAuth(true);
    render(<UserMenu />);

    const link = screen.getByRole("link", { name: "Sign in" });
    expect(link.getAttribute("href")).toContain("/auth/login");
  });
});
