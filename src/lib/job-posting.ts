export type JobPostingLocale = "en" | "vi" | "zh-TW";

export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "internship", label: "Internship" },
  { value: "contract", label: "Contract" },
] as const;

export const WORKPLACE_TYPE_OPTIONS = [
  { value: "onsite", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
  { value: "remote", label: "Remote" },
] as const;

export const SALARY_PERIOD_OPTIONS = [
  { value: "hour", label: "per hour" },
  { value: "month", label: "per month" },
  { value: "year", label: "per year" },
] as const;

export const SENIORITY_OPTIONS = [
  { value: "entry_level", label: "Entry level" },
  { value: "associate", label: "Associate" },
  { value: "mid_senior", label: "Mid-Senior" },
  { value: "manager", label: "Manager" },
  { value: "director", label: "Director" },
] as const;

export const VISA_SUPPORT_OPTIONS = [
  { value: "supported", label: "Visa/work permit support available" },
  { value: "case_by_case", label: "Visa/work permit reviewed case by case" },
  { value: "not_supported", label: "No visa/work permit support" },
] as const;

export const LANGUAGE_REQUIREMENT_OPTIONS = [
  { value: "english", label: "English" },
  { value: "chinese", label: "Chinese" },
  { value: "vietnamese", label: "Vietnamese" },
  { value: "japanese", label: "Japanese" },
  { value: "korean", label: "Korean" },
  { value: "thai", label: "Thai" },
  { value: "indonesian", label: "Bahasa Indonesia" },
] as const;

export type EmploymentTypeValue = (typeof EMPLOYMENT_TYPE_OPTIONS)[number]["value"];
export type WorkplaceTypeValue = (typeof WORKPLACE_TYPE_OPTIONS)[number]["value"];
export type SalaryPeriodValue = (typeof SALARY_PERIOD_OPTIONS)[number]["value"];
export type SeniorityValue = (typeof SENIORITY_OPTIONS)[number]["value"];
export type VisaSupportValue = (typeof VISA_SUPPORT_OPTIONS)[number]["value"];
export type LanguageRequirementValue =
  (typeof LANGUAGE_REQUIREMENT_OPTIONS)[number]["value"];

export const EMPLOYMENT_TYPE_VALUES: ReadonlySet<string> = new Set(
  EMPLOYMENT_TYPE_OPTIONS.map((option) => option.value)
);
export const WORKPLACE_TYPE_VALUES: ReadonlySet<string> = new Set(
  WORKPLACE_TYPE_OPTIONS.map((option) => option.value)
);
export const SALARY_PERIOD_VALUES: ReadonlySet<string> = new Set(
  SALARY_PERIOD_OPTIONS.map((option) => option.value)
);
export const SENIORITY_VALUES: ReadonlySet<string> = new Set(
  SENIORITY_OPTIONS.map((option) => option.value)
);
export const VISA_SUPPORT_VALUES: ReadonlySet<string> = new Set(
  VISA_SUPPORT_OPTIONS.map((option) => option.value)
);
export const LANGUAGE_REQUIREMENT_VALUES: ReadonlySet<string> = new Set(
  LANGUAGE_REQUIREMENT_OPTIONS.map((option) => option.value)
);

const localizedLabels = {
  en: {
    employmentType: {
      full_time: "Full-time",
      part_time: "Part-time",
      internship: "Internship",
      contract: "Contract",
    },
    workplaceType: {
      onsite: "On-site",
      hybrid: "Hybrid",
      remote: "Remote",
    },
    salaryPeriod: {
      hour: "per hour",
      month: "per month",
      year: "per year",
    },
    seniority: {
      entry_level: "Entry level",
      associate: "Associate",
      mid_senior: "Mid-Senior",
      manager: "Manager",
      director: "Director",
    },
    visaSupport: {
      supported: "Visa/work permit support available",
      case_by_case: "Visa/work permit reviewed case by case",
      not_supported: "No visa/work permit support",
    },
    languageRequirement: {
      english: "English",
      chinese: "Chinese",
      vietnamese: "Vietnamese",
      japanese: "Japanese",
      korean: "Korean",
      thai: "Thai",
      indonesian: "Bahasa Indonesia",
    },
  },
  vi: {
    employmentType: {
      full_time: "Toàn thời gian",
      part_time: "Bán thời gian",
      internship: "Thực tập",
      contract: "Hợp đồng",
    },
    workplaceType: {
      onsite: "Làm tại văn phòng",
      hybrid: "Kết hợp",
      remote: "Từ xa",
    },
    salaryPeriod: {
      hour: "mỗi giờ",
      month: "mỗi tháng",
      year: "mỗi năm",
    },
    seniority: {
      entry_level: "Mới bắt đầu",
      associate: "Nhân sự chính thức",
      mid_senior: "Trung cấp đến cao cấp",
      manager: "Quản lý",
      director: "Giám đốc",
    },
    visaSupport: {
      supported: "Có hỗ trợ visa / giấy phép lao động",
      case_by_case: "Xem xét visa / giấy phép theo từng trường hợp",
      not_supported: "Không hỗ trợ visa / giấy phép lao động",
    },
    languageRequirement: {
      english: "Tiếng Anh",
      chinese: "Tiếng Trung",
      vietnamese: "Tiếng Việt",
      japanese: "Tiếng Nhật",
      korean: "Tiếng Hàn",
      thai: "Tiếng Thái",
      indonesian: "Tiếng Indonesia",
    },
  },
  "zh-TW": {
    employmentType: {
      full_time: "全職",
      part_time: "兼職",
      internship: "實習",
      contract: "合約",
    },
    workplaceType: {
      onsite: "現場辦公",
      hybrid: "混合",
      remote: "遠端",
    },
    salaryPeriod: {
      hour: "時薪",
      month: "月薪",
      year: "年薪",
    },
    seniority: {
      entry_level: "入門級",
      associate: "初階",
      mid_senior: "中高階",
      manager: "經理",
      director: "總監",
    },
    visaSupport: {
      supported: "提供簽證／工作許可支援",
      case_by_case: "依個案評估簽證／工作許可",
      not_supported: "不提供簽證／工作許可支援",
    },
    languageRequirement: {
      english: "英文",
      chinese: "中文",
      vietnamese: "越文",
      japanese: "日文",
      korean: "韓文",
      thai: "泰文",
      indonesian: "印尼文",
    },
  },
} as const;

function resolveLocale(locale?: JobPostingLocale): JobPostingLocale {
  return locale === "vi" || locale === "zh-TW" ? locale : "en";
}

type OptionValue =
  | EmploymentTypeValue
  | WorkplaceTypeValue
  | SalaryPeriodValue
  | SeniorityValue
  | VisaSupportValue
  | LanguageRequirementValue;

function localizedOptionLabel<
  T extends keyof (typeof localizedLabels)["en"]
>(category: T, value: OptionValue | string | null | undefined, locale?: JobPostingLocale) {
  if (!value) return undefined;
  const resolved = resolveLocale(locale);
  return localizedLabels[resolved][category][
    value as keyof (typeof localizedLabels)[typeof resolved][T]
  ];
}

export function getEmploymentTypeOptions(locale?: JobPostingLocale) {
  return EMPLOYMENT_TYPE_OPTIONS.map((option) => ({
    ...option,
    label: employmentTypeLabel(option.value, locale) || option.label,
  }));
}

export function getWorkplaceTypeOptions(locale?: JobPostingLocale) {
  return WORKPLACE_TYPE_OPTIONS.map((option) => ({
    ...option,
    label: workplaceTypeLabel(option.value, locale) || option.label,
  }));
}

export function getSalaryPeriodOptions(locale?: JobPostingLocale) {
  return SALARY_PERIOD_OPTIONS.map((option) => ({
    ...option,
    label: salaryPeriodLabel(option.value, locale) || option.label,
  }));
}

export function getSeniorityOptions(locale?: JobPostingLocale) {
  return SENIORITY_OPTIONS.map((option) => ({
    ...option,
    label: seniorityLabel(option.value, locale) || option.label,
  }));
}

export function getVisaSupportOptions(locale?: JobPostingLocale) {
  return VISA_SUPPORT_OPTIONS.map((option) => ({
    ...option,
    label: visaSupportLabel(option.value, locale) || option.label,
  }));
}

export function getLanguageRequirementOptions(locale?: JobPostingLocale) {
  return LANGUAGE_REQUIREMENT_OPTIONS.map((option) => ({
    ...option,
    label: languageRequirementOptionLabel(option.value, locale) || option.label,
  }));
}

export function employmentTypeLabel(
  value: string | null | undefined,
  locale?: JobPostingLocale
) {
  return localizedOptionLabel("employmentType", value, locale);
}

export function workplaceTypeLabel(
  value: string | null | undefined,
  locale?: JobPostingLocale
) {
  return localizedOptionLabel("workplaceType", value, locale);
}

export function salaryPeriodLabel(
  value: string | null | undefined,
  locale?: JobPostingLocale
) {
  return localizedOptionLabel("salaryPeriod", value, locale);
}

export function seniorityLabel(
  value: string | null | undefined,
  locale?: JobPostingLocale
) {
  return localizedOptionLabel("seniority", value, locale);
}

export function visaSupportLabel(
  value: string | null | undefined,
  locale?: JobPostingLocale
) {
  return localizedOptionLabel("visaSupport", value, locale);
}

export function languageRequirementOptionLabel(
  value: string | null | undefined,
  locale?: JobPostingLocale
) {
  return localizedOptionLabel("languageRequirement", value, locale);
}

export function parseLanguageRequirementTokens(
  value: string | null | undefined,
  locale?: JobPostingLocale
) {
  if (!value) return [] as Array<{ key: string; label: string; preset: boolean }>;

  const tokens = value
    .split(/\r?\n|,/)
    .map((token) => token.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const result: Array<{ key: string; label: string; preset: boolean }> = [];

  for (const token of tokens) {
    if (token.startsWith("custom:")) {
      const label = token.slice("custom:".length).trim();
      if (!label) continue;
      const key = `custom:${label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ key, label, preset: false });
      continue;
    }

    if (LANGUAGE_REQUIREMENT_VALUES.has(token)) {
      const label = languageRequirementOptionLabel(token, locale) || token;
      if (seen.has(token)) continue;
      seen.add(token);
      result.push({ key: token, label, preset: true });
      continue;
    }
  }

  return result;
}

export function serializeLanguageRequirements(
  selectedValues: string[],
  customText: string
) {
  const uniqueValues = Array.from(
    new Set(selectedValues.filter((value) => LANGUAGE_REQUIREMENT_VALUES.has(value)))
  );
  const customValues = customText
    .split(/\r?\n|,/)
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => `custom:${value}`);

  return [...uniqueValues, ...customValues].join(", ");
}

export function formatApplicationDeadline(
  value: string | null | undefined,
  locale?: JobPostingLocale
) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const dateLocale =
    locale === "vi" ? "vi-VN" : locale === "zh-TW" ? "zh-TW" : "en-US";

  return new Intl.DateTimeFormat(dateLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatSalaryRange({
  salaryMin,
  salaryMax,
  salaryCurrency,
  salaryPeriod,
  locale,
}: {
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: string | null;
  locale?: JobPostingLocale;
}) {
  if (salaryMin === null && salaryMax === null) {
    return null;
  }

  const formatter = new Intl.NumberFormat("en-US");
  const currency = (salaryCurrency || "TWD").toUpperCase();
  const period = salaryPeriodLabel(salaryPeriod || "month", locale) || "per month";

  if (salaryMin !== null && salaryMax !== null) {
    return `${currency} ${formatter.format(salaryMin)} - ${formatter.format(salaryMax)} ${period}`;
  }

  if (salaryMin !== null) {
    return `${currency} ${formatter.format(salaryMin)}+ ${period}`;
  }

  return `${currency} up to ${formatter.format(salaryMax ?? 0)} ${period}`;
}
