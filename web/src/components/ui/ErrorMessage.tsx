"use client";

interface ErrorMessageProps {
  message: string;
  onDismiss: () => void;
}

export default function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
      <p className="flex-1 text-sm text-red-700 dark:text-red-300">
        {message}
      </p>
      <button
        onClick={onDismiss}
        className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300 cursor-pointer"
      >
        &times;
      </button>
    </div>
  );
}
