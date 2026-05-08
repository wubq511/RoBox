import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GitHubImportForm } from "./github-import-form";

describe("GitHubImportForm", () => {
  it("renders a GitHub import form without replacing the manual skill path", () => {
    const html = renderToStaticMarkup(<GitHubImportForm />);

    expect(html).toContain("粘贴 GitHub 仓库、README 或 SKILL.md 链接");
    expect(html).toContain("导入");
  });

  it("renders repository and README guidance for tool imports", () => {
    const html = renderToStaticMarkup(<GitHubImportForm type="tool" />);

    expect(html).toContain("粘贴 GitHub 仓库或 README 链接");
    expect(html).not.toContain("SKILL.md");
  });
});
