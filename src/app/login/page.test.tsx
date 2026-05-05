import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/server/auth/actions", () => ({
  requestMagicLinkAction: vi.fn(),
}));

vi.mock("@/server/auth/session", () => ({
  getOptionalAppUser: vi.fn(async () => null),
}));

vi.mock("@/server/auth/service", async () => {
  const actual =
    await vi.importActual<typeof import("@/server/auth/service")>(
      "@/server/auth/service",
    );

  return {
    ...actual,
    hasAllowedEmails: vi.fn(() => true),
  };
});

import LoginPage from "./page";

describe("LoginPage", () => {
  it("renders the login page in Chinese", async () => {
    const page = await LoginPage();
    const html = renderToStaticMarkup(page);

    expect(html).toContain("RoBox");
    expect(html).toContain("管理你的 Prompt 与 Skill");
    expect(html).not.toContain("Sign in to your private");
    expect(html).not.toContain("Passwordless login");
    expect(html).not.toContain("Allowlist only");
    expect(html).not.toContain("Send magic link");
  });
});
