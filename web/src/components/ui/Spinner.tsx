"use client";

export default function Spinner({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400" />
      {message && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}
