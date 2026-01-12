export interface Model {
  value: string;
  label: string;
  supportsVision?: boolean;
}

export const models: Model[] = [
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash", supportsVision: true },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro", supportsVision: true },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash", supportsVision: true },
  { value: "gemini-1.5-flash-8b", label: "Gemini 1.5 Flash 8B", supportsVision: true },
  { value: "gemini-pro", label: "Gemini Pro" },
];

export const getModelByValue = (value: string): Model | undefined => {
  return models.find((model) => model.value === value);
};
