import { ItemForm } from "@/components/library/item-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createPromptAction,
  initialItemFormState,
  type ItemFormState,
} from "@/server/items/actions";

async function submitNewPrompt(
  state: ItemFormState | void,
  formData: FormData,
) {
  return createPromptAction(state ?? initialItemFormState, formData);
}

export default async function NewPromptPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 lg:px-8 lg:py-8">
      <Card className="rounded-[28px] border-border/70">
        <CardHeader className="gap-3 border-b border-border/70 pb-5">
          <CardTitle className="text-3xl tracking-[-0.04em]">New prompt</CardTitle>
          <CardDescription className="text-sm leading-6">
            Save the raw prompt first. Variables can stay empty and be refined later.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ItemForm
            type="prompt"
            action={submitNewPrompt}
            submitLabel="Save prompt"
            initialValues={{
              title: "",
              summary: "",
              category: "Writing",
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
