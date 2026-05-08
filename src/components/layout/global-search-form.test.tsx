import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/tools",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams("search=cli"),
}));

import { GlobalSearchForm } from "./global-search-form";

describe("GlobalSearchForm", () => {
  it("renders search as a client-side navigation form", () => {
    const html = renderToStaticMarkup(<GlobalSearchForm />);

    expect(html).toContain('name="search"');
    expect(html).toContain('value="cli"');
    expect(html).not.toContain('action="/tools"');
  });
});
