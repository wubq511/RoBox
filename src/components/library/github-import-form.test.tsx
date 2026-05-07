import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GitHubImportForm } from "./github-import-form";

describe("GitHubImportForm", () => {
  it("renders a GitHub import form without replacing the manual skill path", () => {
    const html = renderToStaticMarkup(<GitHubImportForm />);

    expect(html).toContain("粘贴 GitHub 仓库或 README 链接");
    expect(html).toContain("导入");
  });
});
