import dayjs from "dayjs";
import { format, fromUnixTime } from "date-fns";

export const clone: any = (obj: any) => {
  return JSON.parse(JSON.stringify(obj));
};

export function isNumeric(str: any) {
  if (typeof str === "number") return true;
  if (typeof str != "string") return false; // we only process strings!
  // @ts-expect-error - parseInt can accept string but TypeScript strict mode requires explicit type
  return !isNaN(str) && !isNaN(parseInt(str)); // ...and ensure strings of whitespace fail
}

export const addIdInLoading = async (
  id: string,
  setLoading: React.Dispatch<React.SetStateAction<{ selectedId: string[] }>>
) => {
  setLoading(prev => {
    return {
      ...prev,
      selectedId: [...prev.selectedId, id],
    };
  });
};

export const getDefaultName = (date: Date) => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  };

  return date
    .toLocaleString("en-US", options)
    .replaceAll("/", ".")
    .replaceAll(",", "");
};

export const removeIdFromLoading = async (
  id: string,
  setLoading: React.Dispatch<React.SetStateAction<{ selectedId: string[] }>>
) => {
  setLoading(prev => ({
    ...prev,
    selectedId: prev.selectedId.filter(item => item !== id),
  }));
};

export const formatDate = (date: Date | string | number): string => {
  if (!date) return "N/A";

  let validDate: Date;

  if (typeof date === "number") {
    // Assume it's a Unix timestamp (seconds since epoch)
    validDate = new Date(date * 1000); // Convert seconds to milliseconds
  } else {
    validDate = new Date(date);
  }

  if (isNaN(validDate.getTime())) return "Invalid Date";

  return validDate.toDateString();
};

export const formatTime = (date: Date | string | number): string => {
  if (!date) return "N/A";

  let validDate: Date;

  if (typeof date === "number") {
    // Assume it's a Unix timestamp (seconds since epoch)
    validDate = fromUnixTime(date);
  } else {
    validDate = new Date(date);
  }

  if (isNaN(validDate.getTime())) return "Invalid Date";

  return format(validDate, "HH:mm");
};

export const areDatesSame = (
  date1: string | Date,
  date2: string | Date
): boolean => {
  return dayjs(date1).isSame(date2, "day");
};

export const calculateDifferenceInDays = (
  from: string | Date | number,
  to: string | Date | number
): number => {
  const dayjsDate1 = dayjs(from);
  const dayjsDate2 = dayjs(to);
  // return dayjsDate2.diff(dayjsDate1, 'day');
  return dayjsDate1.diff(dayjsDate2, "day");
};

export const getCurrentTimeOfZone = (timezone: string) => {
  if (!timezone) {
    return "";
  }
  const date = new Date();
  // const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  };
  // const formattedTime = date.toLocaleDateString('en-US', options);
  const formattedTime = new Intl.DateTimeFormat("en-US", options).format(date);

  return formattedTime;
};

export const getCapitalizedString = (input: string) => {
  const str = input.trim();
  if (typeof str !== "string" || str.length === 0) {
    return str;
  }
  return input.replace(/\b\w/g, match => match.toUpperCase());
};

export const getLabelFromKey = (input: string) => {
  return input
    .replace(/_/g, " ")
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

type ParamsValue = number | string | boolean | null;
export default function makeQueryParams(
  paramsObj: Record<string, ParamsValue | ParamsValue[]>
) {
  const searchParams = new URLSearchParams();

  Object.entries(paramsObj).forEach(([key, value]) => {
    if (value instanceof Array || Array.isArray(value)) {
      value.length && searchParams.set(key, value.join(","));
    } else if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      value && searchParams.set(key, String(value));
    }
  });

  return searchParams.toString();
}

export const filterObjectByKeys = (
  obj: Record<string, any>,
  allowedKeys: string[]
) => {
  return Object.keys(obj).reduce(
    (filteredObj: Record<string, any>, key: string) => {
      if (allowedKeys.includes(key)) {
        filteredObj[key] = obj[key];
      }
      return filteredObj;
    },
    {}
  );
};

// export default function makeQueryParams(paramsObj: Record<string, ParamsValue | ParamsValue[]>): string {
//   const searchParams = new URLSearchParams();

//   const processValue = (key: string, value: ParamsValue | ParamsValue[]) => {
//     if (Array.isArray(value)) {
//       value.length && searchParams.set(key, value.join(','));
//     } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
//       value && searchParams.set(key, String(value));
//     } else if (typeof value === 'object' && value !== null) {
//       Object.entries(value).forEach(([subKey, subValue]) => {
//         processValue(`${key}.${subKey}`, subValue);
//       });
//     }
//   };

//   Object.entries(paramsObj).forEach(([key, value]) => {
//     processValue(key, value);
//   });

//   return searchParams.toString();
// }
