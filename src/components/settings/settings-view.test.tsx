import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SettingsView } from "./settings-view";

describe("SettingsView", () => {
  it("renders custom category management and other settings in Chinese", () => {
    const html = renderToStaticMarkup(<SettingsView />);

    expect(html).toContain("自定义分类");
    expect(html).toContain("Prompt 分类");
    expect(html).toContain("Skill 分类");
    expect(html).toContain("DEEPSEEK_API_KEY");
    expect(html).toContain("github.com");
    expect(html).toContain("raw.githubusercontent.com");
    expect(html).toContain("JSON");
    expect(html).toContain("Markdown");
    expect(html).toContain("设置");
    expect(html).not.toContain("Placeholder only");
    expect(html).not.toContain("固定分类");
  });
});
