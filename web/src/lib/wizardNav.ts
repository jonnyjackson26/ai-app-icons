// Build an in-page search string that preserves all existing params and only
// swaps (or sets) `step`. Keeps `cli_callback`, `cli_token`, `cli_project`,
// and any future tracking params across step navigations. Returns a `?` URL
// suitable for `router.push`.
export function stepHref(
  current: URLSearchParams | ReadonlyURLSearchParams,
  step: string,
): string {
  const next = new URLSearchParams(current.toString());
  next.set("step", step);
  return `?${next.toString()}`;
}

// Minimal structural type that matches both `URLSearchParams` and Next's
// ReadonlyURLSearchParams (which only exposes read methods).
interface ReadonlyURLSearchParams {
  toString(): string;
}
