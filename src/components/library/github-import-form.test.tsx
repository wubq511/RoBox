import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GithubImportForm } from "./github-import-form";

describe("GithubImportForm", () => {
  it("renders a GitHub import form without replacing the manual skill path", () => {
    const html = renderToStaticMarkup(<GithubImportForm />);

    expect(html).toContain("从 GitHub 导入");
    expect(html).toContain('name="githubUrl"');
    expect(html).toContain("https://github.com/tw93/Waza");
    expect(html).toContain("导入 Skill");
    expect(html).toContain("github.com");
    expect(html).toContain("raw.githubusercontent.com");
  });
});
