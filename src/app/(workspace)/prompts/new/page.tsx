import { ItemForm } from "@/components/library/item-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createPromptAction } from "@/server/items/actions";

export default async function NewPromptPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 lg:px-8 lg:py-8">
      <Card className="rounded-[28px] border-border/70">
        <CardHeader className="gap-3 border-b border-border/70 pb-5">
          <CardTitle className="text-3xl tracking-[-0.04em]">New Prompt</CardTitle>
          <CardDescription className="text-sm leading-6">
            Paste the raw prompt, save it first, then refine variables and structure later.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ItemForm
            type="prompt"
            action={createPromptAction}
            submitLabel="Save Prompt"
            initialValues={{
              title: "",
              summary: "",
              category: "Other",
              tags: [],
              content: "",
              sourceUrl: "",
              variables: [],
            }}
          />
        </CardContent>
      </Card>
    </main>
  );
}
