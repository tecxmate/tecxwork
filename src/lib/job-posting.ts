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

export type EmploymentTypeValue = (typeof EMPLOYMENT_TYPE_OPTIONS)[number]["value"];
export type WorkplaceTypeValue = (typeof WORKPLACE_TYPE_OPTIONS)[number]["value"];
export type SalaryPeriodValue = (typeof SALARY_PERIOD_OPTIONS)[number]["value"];
export type SeniorityValue = (typeof SENIORITY_OPTIONS)[number]["value"];
export type VisaSupportValue = (typeof VISA_SUPPORT_OPTIONS)[number]["value"];

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

export function employmentTypeLabel(value: string | null | undefined) {
  return EMPLOYMENT_TYPE_OPTIONS.find((option) => option.value === value)?.label;
}

export function workplaceTypeLabel(value: string | null | undefined) {
  return WORKPLACE_TYPE_OPTIONS.find((option) => option.value === value)?.label;
}

export function salaryPeriodLabel(value: string | null | undefined) {
  return SALARY_PERIOD_OPTIONS.find((option) => option.value === value)?.label;
}

export function seniorityLabel(value: string | null | undefined) {
  return SENIORITY_OPTIONS.find((option) => option.value === value)?.label;
}

export function visaSupportLabel(value: string | null | undefined) {
  return VISA_SUPPORT_OPTIONS.find((option) => option.value === value)?.label;
}

export function formatApplicationDeadline(value: string | null | undefined) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
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
}: {
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: string | null;
}) {
  if (salaryMin === null && salaryMax === null) {
    return null;
  }

  const formatter = new Intl.NumberFormat("en-US");
  const currency = (salaryCurrency || "TWD").toUpperCase();
  const period = salaryPeriodLabel(salaryPeriod || "month") || "per month";

  if (salaryMin !== null && salaryMax !== null) {
    return `${currency} ${formatter.format(salaryMin)} - ${formatter.format(salaryMax)} ${period}`;
  }

  if (salaryMin !== null) {
    return `${currency} ${formatter.format(salaryMin)}+ ${period}`;
  }

  return `${currency} up to ${formatter.format(salaryMax ?? 0)} ${period}`;
}
