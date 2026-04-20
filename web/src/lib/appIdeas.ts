export const APP_IDEAS: string[] = [
  "A meditation app with calming nature visuals",
  "A recipe tracker for weeknight home cooks",
  "A habit tracker that gamifies daily routines",
  "A sleep analysis app with soft dreamy tones",
  "A plant care reminder app",
  "A language learning companion with a friendly mascot",
  "A budgeting app for college students",
  "A workout logger with bold energetic colors",
  "A weather app with hand-drawn illustrations",
  "A book reading tracker",
  "A podcast discovery app",
  "A focus timer with ambient soundscapes",
  "A travel journal with map integration",
  "A dog walking scheduler",
  "A grocery list with pantry sync",
  "A mindful journaling app",
  "A bird-watching field guide",
  "A guitar chord trainer",
  "A coffee brewing timer and recipe app",
  "A chess puzzle app for beginners",
];

export function pickTwoRandom(pool: readonly string[]): [string, string] {
  if (pool.length < 2) throw new Error("pickTwoRandom: pool too small");
  const a = Math.floor(Math.random() * pool.length);
  let b = Math.floor(Math.random() * (pool.length - 1));
  if (b >= a) b += 1;
  return [pool[a], pool[b]];
}
