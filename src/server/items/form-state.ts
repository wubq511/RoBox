export type ItemFormState = {
  status: "idle" | "error" | "pending";
  message: string;
};

export const initialItemFormState: ItemFormState = {
  status: "idle",
  message: "",
};
