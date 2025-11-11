import { settingsService } from "./settingsService";

type SupportedDateFormat = "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
type SupportedTimeFormat = "12hr" | "24hr";

const resolveLocale = (language?: string) => {
  switch (language) {
    case "fil":
      return "fil-PH";
    case "en":
    default:
      return "en-US";
  }
};

const resolveDateOptions = (
  format: SupportedDateFormat
): Intl.DateTimeFormatOptions => {
  const base: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  switch (format) {
    case "DD/MM/YYYY":
      return { ...base, day: "2-digit", month: "2-digit" } as Intl.DateTimeFormatOptions;
    case "YYYY-MM-DD":
      return {
        ...base,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      } as Intl.DateTimeFormatOptions;
    case "MM/DD/YYYY":
    default:
      return base;
  }
};

const normaliseDate = (value: Date | string | number) => {
  if (value instanceof Date) return value;
  return new Date(value);
};

export const getAppPreferences = () => settingsService.loadAppPreferences();

export const formatDate = (value: Date | string | number) => {
  const prefs = getAppPreferences();
  const locale = resolveLocale(prefs.language);
  const options = resolveDateOptions(
    (prefs.dateFormat as SupportedDateFormat) || "MM/DD/YYYY"
  );

  return normaliseDate(value).toLocaleDateString(locale, options);
};

export const formatTime = (value: Date | string | number) => {
  const prefs = getAppPreferences();
  const locale = resolveLocale(prefs.language);
  const hour12 = ((prefs.timeFormat as SupportedTimeFormat) || "12hr") === "12hr";

  return normaliseDate(value).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12,
  });
};

export const formatDateTime = (value: Date | string | number) => {
  const date = formatDate(value);
  const time = formatTime(value);
  return `${date} ${time}`.trim();
};
