import { cn } from "@/lib/utils";

export function Badge({ children, className, variant = "secondary", ...props }) {
  const variantClasses =
    variant === "secondary"
      ? "bg-gray-100 text-gray-700 border border-gray-300"
      : variant === "outline"
      ? "border border-gray-300 text-gray-600"
      : "bg-gray-100 text-gray-700"

  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", variantClasses, className)} {...props}>
      {children}
    </span>
  )
}
