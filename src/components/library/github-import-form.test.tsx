import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GithubImportForm } from "./github-import-form";

describe("GithubImportForm", () => {
  it("renders a GitHub import form without replacing the manual skill path", () => {
    const html = renderToStaticMarkup(<GithubImportForm />);

    expect(html).toContain("Import from GitHub");
    expect(html).toContain('name="githubUrl"');
    expect(html).toContain("https://github.com/tw93/Waza");
    expect(html).toContain("Import Skill");
    expect(html).toContain("github.com");
    expect(html).toContain("raw.githubusercontent.com");
  });
});
