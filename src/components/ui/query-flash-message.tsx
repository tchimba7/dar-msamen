"use client";

import { useEffect } from "react";

type QueryFlashMessageProps = {
  message: string;
  className?: string;
  clearParams: string[];
};

export function QueryFlashMessage({ message, className, clearParams }: QueryFlashMessageProps) {
  useEffect(() => {
    const url = new URL(window.location.href);
    let hasChanges = false;

    for (const param of clearParams) {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
        hasChanges = true;
      }
    }

    if (!hasChanges) {
      return;
    }

    const nextQuery = url.searchParams.toString();
    const nextUrl = `${url.pathname}${nextQuery ? `?${nextQuery}` : ""}${url.hash}`;

    window.history.replaceState(window.history.state, "", nextUrl);
  }, [clearParams]);

  return <p className={className}>{message}</p>;
}
