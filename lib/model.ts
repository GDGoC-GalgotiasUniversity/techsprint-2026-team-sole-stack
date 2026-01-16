export interface Model {
  value: string;
  label: string;
  supportsVision?: boolean;
}

export const models: Model[] = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", supportsVision: true }
];

export const getModelByValue = (value: string): Model | undefined => {
  return models.find((model) => model.value === value);
};
