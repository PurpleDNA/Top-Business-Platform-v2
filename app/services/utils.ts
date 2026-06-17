/* eslint-disable @typescript-eslint/no-explicit-any */
export const formatDate = (dateString: string) => {
  try {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

export const formatDateTime = (
  timestamp: string | number | Date | null | undefined,
) => {
  if (!timestamp) return "No date";

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "Invalid date";

  const formattedDate = date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos", // pin it — server and client now agree
  });

  const timePeriod = getTimePeriod(timestamp);

  return `${formattedDate}, ${timePeriod}`;
};

export const getTimePeriod = (timestamp: any) => {
  const date = new Date(timestamp);
  const hours = date.getHours();

  if (hours >= 5 && hours < 12) {
    return "Morning";
  } else if (hours >= 12 && hours < 17) {
    return "Afternoon";
  } else if (hours >= 17 && hours < 21) {
    return "Evening";
  } else {
    return "Night";
  }
};

export function getTimeFrame(dateStr: any): string {
  // Example input: "Fri 12 September 2025, Evening"
  // We just need the date part, ignore the "Evening"
  const datePart = dateStr.split(",")[0]; // "Fri 12 September 2025"

  const inputDate = new Date(datePart);
  const today = new Date();

  // Normalize both dates (ignore time-of-day differences)
  inputDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - inputDate.getTime();
  if (diffMs < 0) return "in the future";

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  if (diffWeeks <= 4) return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;

  return "more than a month ago";
}
