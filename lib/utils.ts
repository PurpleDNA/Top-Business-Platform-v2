import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getColorClasses = (color: string) => {
  const colorMap: Record<string, { bg: string; darkBg: string; text: string }> =
    {
      orange: {
        bg: "bg-orange-200",
        darkBg: "dark:bg-orange-500",
        text: "text-orange-950",
      },
      blue: {
        bg: "bg-blue-200",
        darkBg: "dark:bg-blue-500",
        text: "text-blue-950",
      },
      green: {
        bg: "bg-green-200",
        darkBg: "dark:bg-green-500",
        text: "text-green-950",
      },
      white: {
        bg: "bg-slate-100",
        darkBg: "dark:bg-slate-400",
        text: "text-slate-950",
      },
      brown: {
        bg: "bg-amber-300",
        darkBg: "dark:bg-amber-700",
        text: "text-amber-950",
      },
      pink: {
        bg: "bg-pink-200",
        darkBg: "dark:bg-pink-500",
        text: "text-pink-950",
      },
    };

  return (
    colorMap[color.toLowerCase()] || {
      bg: "bg-gray-200",
      darkBg: "dark:bg-gray-500",
      text: "text-gray-950",
    }
  );
};

export const getBadgeColorClasses = (color: string) => {
  const classes = getColorClasses(color);
  const colorName = color.toLowerCase();
  return `${classes.bg} ${classes.text} dark:bg-${colorName}-500/20 dark:text-${colorName}-400`;
};

export const getSortedBreadItems = (
  breadQuantities?: Record<string, number> | null,
  multipliers?: Record<string, number> | null
) => {
  const prices = multipliers ?? {};
  const breadItems = Object.entries(breadQuantities ?? {})
    .map(([color, quantity]) => ({
      color,
      quantity,
    }))
    .sort(
      (a, b) =>
        (prices[b.color.toLowerCase()] ?? 0) -
        (prices[a.color.toLowerCase()] ?? 0)
    )
    .filter((item) => item.quantity > 0);

  return breadItems;
};
