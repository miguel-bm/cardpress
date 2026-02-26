import * as Accordion from "@radix-ui/react-accordion";
import type { ReactNode } from "react";

interface Props {
  value: string;
  title: string;
  children: ReactNode;
}

export default function AccordionSection({ value, title, children }: Props) {
  return (
    <Accordion.Item
      value={value}
      className="rounded-xl border border-border bg-surface"
    >
      <Accordion.Header className="flex">
        <Accordion.Trigger className="group flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-text hover:text-text-muted focus:outline-none">
          {title}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="px-4 pb-4">{children}</div>
      </Accordion.Content>
    </Accordion.Item>
  );
}
