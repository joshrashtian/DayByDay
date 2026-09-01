import { Link } from "react-router-dom";
import { IoChevronForward } from "react-icons/io5";

export type TasksBreadcrumbItem = {
  label: string;
  to?: string;
};

type TasksBreadcrumbProps = {
  items: TasksBreadcrumbItem[];
};

export function TasksBreadcrumb({ items }: TasksBreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Tasks breadcrumb"
      className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-1 px-5 pt-6 text-sm sm:px-8 xl:max-w-4xl"
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
