import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ItemForm } from "./item-form";

const noopAction = async () => undefined;

describe("ItemForm", () => {
  it("uses the explicit type prop for the hidden type field and prompt variable section", () => {
    const html = renderToStaticMarkup(
      <ItemForm
        type="prompt"
        action={noopAction}
        submitLabel="Save prompt"
        initialValues={{
          title: "Prompt title",
          summary: "Prompt summary",
          category: "Writing",
          tags: ["draft"],
          content: "Prompt body",
          sourceUrl: "",
          variables: [],
        }}
      />,
    );

    expect(html).toContain('name="type" value="prompt"');
    expect(html).toContain("Variables");
    expect(html).toContain('name="variables"');
  });

  it("uses the explicit type prop for skill source fields and omits the prompt variable section", () => {
    const html = renderToStaticMarkup(
      <ItemForm
        type="skill"
        action={noopAction}
        submitLabel="Save skill"
        initialValues={{
          title: "Skill title",
          summary: "Skill summary",
          category: "Agent",
          tags: ["workflow"],
          content: "Skill body",
          sourceUrl: "https://github.com/example/repo",
          variables: [],
        }}
      />,
    );

    expect(html).toContain('name="type" value="skill"');
    expect(html).toContain("Source URL");
    expect(html).not.toContain("Add variable");
  });
});
