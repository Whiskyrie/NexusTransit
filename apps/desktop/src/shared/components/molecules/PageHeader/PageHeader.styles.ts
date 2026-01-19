/**
 * PageHeader Component Styles
 */

export const pageHeaderStyles = {
  container: "flex items-center justify-between",
  leftSection: "flex items-center gap-3",
  iconWrapper: {
    base: "w-12 h-12 rounded-xl flex items-center justify-center",
    colors: {
      primary: "bg-orange-50",
      success: "bg-green-50",
      warning: "bg-yellow-50",
      error: "bg-red-50",
      info: "bg-blue-50",
    },
  },
  icon: {
    colors: {
      primary: "text-orange-600",
      success: "text-green-600",
      warning: "text-yellow-600",
      error: "text-red-600",
      info: "text-blue-600",
    },
  },
  textContainer: "flex flex-col",
  title: "text-2xl font-semibold text-gray-900",
  description: "text-sm text-gray-500 mt-0.5",
  actions: "flex items-center gap-3",
  breadcrumbs: {
    container: "flex items-center gap-2 text-sm mb-3",
    item: "text-gray-500 hover:text-gray-900 transition-colors",
    separator: "text-gray-300",
    active: "text-gray-900 font-medium",
  },
} as const;
