import type { ReactNode } from "react";
import { surfacePanelClass } from "@/lib/surfaceStyles";

type PageIntroProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
};

export function PageIntro({ title, description, action }: PageIntroProps) {
  const body = (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {title}
      </h1>
      {description != null && description !== "" ? (
        <div className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {description}
        </div>
      ) : null}
    </>
  );

  return (
    <div
      className={`p-5 sm:p-6 ${surfacePanelClass}`}
    >
      {action ? (
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>{body}</div>
          <div className="shrink-0">{action}</div>
        </div>
      ) : (
        <div>{body}</div>
      )}
    </div>
  );
}
