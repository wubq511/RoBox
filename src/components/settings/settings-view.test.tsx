import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SettingsView } from "./settings-view";

describe("SettingsView", () => {
  it("renders concrete MVP settings notes and placeholders", () => {
    const html = renderToStaticMarkup(<SettingsView />);

    expect(html).toContain("DEEPSEEK_API_KEY");
    expect(html).toContain("DEEPSEEK_MODEL");
    expect(html).toContain("Writing");
    expect(html).toContain("Coding");
    expect(html).toContain("Other");
    expect(html).toContain("github.com");
    expect(html).toContain("raw.githubusercontent.com");
    expect(html).toContain("GITHUB_TOKEN");
    expect(html).toContain("JSON / Markdown");
    expect(html).toContain("Placeholder only");
  });
});
