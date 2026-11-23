export const FIELD_TYPES = ["Boolean", "Checkbox", "Date", "Dropdown", "Email", "Number", "Phone", "Radio", "Text", "TextArea"];
export const VALIDATION_TYPES = ["MaxLength", "MaxValue", "MinLength", "MinValue", "Regex", "Required"];
export const CHOICE_TYPES = ["Checkbox", "Dropdown", "Radio"];

const numericRules = ["MinLength", "MaxLength", "MinValue", "MaxValue"];
const choiceRequired = ["Dropdown", "Radio"];

export const isProductPriceField = (field) => ["price", "productprice"].includes(field.key.trim().toLowerCase());

export function configurationError(fields) {
  if (fields.filter(isProductPriceField).length > 1) return "Use one listing price field.";
  const keys = new Set();
  for (const field of fields) {
    const key = field.key.trim().toLowerCase();
    if (!key || !field.label.trim()) return "Each field needs a label and key.";
    if (keys.has(key)) return `The field key "${field.key}" is used more than once.`;
    keys.add(key);
    if (!FIELD_TYPES.includes(field.type)) return `Choose a supported field type for ${field.label}.`;
    if (isProductPriceField(field) && field.type !== "Number") return "The listing price field must use the Number type.";
    if (choiceRequired.includes(field.type) && !field.options.length) return `Add options for ${field.label}.`;

    const ruleTypes = new Set();
    for (const rule of field.validations) {
      if (!VALIDATION_TYPES.includes(rule.type) || ruleTypes.has(rule.type)) {
        return `Choose a different validation for ${field.label}.`;
      }
      ruleTypes.add(rule.type);
      if (numericRules.includes(rule.type)) {
        const number = Number(rule.value);
        const length = rule.type.endsWith("Length");
        if (!String(rule.value).trim() || !Number.isFinite(number) || (length && (!Number.isInteger(number) || number < 0))) {
          return `Enter a valid ${rule.type} for ${field.label}.`;
        }
      }
      if (rule.type === "Regex") {
        try {
          if (!rule.value) throw new Error();
          new RegExp(rule.value);
        } catch {
          return `Enter a valid regular expression for ${field.label}.`;
        }
      }
    }
  }
  return "";
}

export function prepareProductFields(fields) {
  return fields.map((field, index) => ({
    label: field.label.trim(),
    key: field.key.trim(),
    type: field.type,
    placeholder: field.placeholder.trim(),
    order: index + 1,
    options: CHOICE_TYPES.includes(field.type) ? field.options : [],
    validations: field.validations.map((rule) => ({
      type: rule.type,
      value: rule.type === "Required" ? null : String(rule.value),
      description: rule.description.trim(),
      messageEn: rule.messageEn.trim(),
      messageAr: rule.messageAr.trim(),
    })),
  }));
}
