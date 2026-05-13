export function ZenQuoteWidget({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-zinc-900 bg-white p-6 dark:border-zinc-100 dark:bg-zinc-950">
      <p className="text-center text-lg font-medium leading-relaxed text-zinc-900 dark:text-zinc-50">
        「{text}」
      </p>
    </div>
  );
}