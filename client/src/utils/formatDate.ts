export const formatDateMMDDYYYY = (dateInput: string | number | Date | null | undefined): string => {
  if (!dateInput) return "N/A";

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "N/A";

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear());

  return `${month}/${day}/${year}`;
};
