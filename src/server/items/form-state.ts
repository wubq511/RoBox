export type ItemFormState = {
  status: "idle" | "error";
  message: string;
};

export const initialItemFormState: ItemFormState = {
  status: "idle",
  message: "",
};
