import { Link } from "react-router-dom";
import { IoChevronForward } from "react-icons/io5";
import { twMerge } from "tailwind-merge";
import type { BreadcrumbItem } from "@/stores/breadcrumbStore";

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={twMerge("flex flex-wrap items-center gap-1 text-sm", className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
            {index > 0 ? (
              <IoChevronForward
                className="h-3.5 w-3.5 shrink-0 text-faint"
                aria-hidden
              />
            ) : null}
            {item.to && !isLast ? (
              <Link
                to={item.to}
                className="font-medium text-muted transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={
                  isLast
                    ? "font-semibold text-ink"
                    : "font-medium text-muted"
                }
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
