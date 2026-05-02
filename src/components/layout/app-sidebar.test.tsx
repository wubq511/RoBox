import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

import { AppSidebar } from "./app-sidebar";

describe("AppSidebar", () => {
  it("does not render hard-coded health or stale phase data", () => {
    const html = renderToStaticMarkup(
      <AppSidebar userEmail="robert@example.com" />,
    );

    expect(html).not.toContain("Library health");
    expect(html).not.toContain("72%");
    expect(html).not.toContain(">OK<");
    expect(html).not.toContain("Phase 2");
    expect(html).toContain("当前账号");
    expect(html).toContain("robert@example.com");
  });
});
