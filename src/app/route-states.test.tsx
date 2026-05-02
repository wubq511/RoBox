import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import ErrorPage from "./error";
import LoadingPage from "./loading";
import NotFoundPage from "./not-found";

describe("route state pages", () => {
  it("renders a Chinese 404 page with a workspace return link", () => {
    const html = renderToStaticMarkup(<NotFoundPage />);

    expect(html).toContain("页面不存在");
    expect(html).toContain('href="/dashboard"');
  });

  it("renders a Chinese global loading state", () => {
    const html = renderToStaticMarkup(<LoadingPage />);

    expect(html).toContain("正在加载");
  });

  it("renders a Chinese global error boundary with retry support", () => {
    const reset = vi.fn();
    const html = renderToStaticMarkup(
      <ErrorPage error={new Error("boom")} reset={reset} />,
    );

    expect(html).toContain("页面出错");
    expect(html).toContain("重新尝试");
  });
});
