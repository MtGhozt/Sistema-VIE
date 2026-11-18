/** Formatea ORCID al estilo del wizard: 0000-0000-0000-000X */
export function formatOrcidValue(raw: string): string {
  const characters = raw.toUpperCase().replace(/[^0-9X]/g, "");
  const digits = characters.replace(/\D/g, "").slice(0, 16);
  const value =
    characters.endsWith("X") && digits.length === 15 ? `${digits}X` : digits;
  return value.match(/.{1,4}/g)?.join("-") ?? "";
}

export function formatOrcidInput(input: HTMLInputElement): string {
  const cursorPosition = input.selectionStart ?? input.value.length;
  const inputBeforeCursor = input.value
    .slice(0, cursorPosition)
    .toUpperCase()
    .replace(/[^0-9X]/g, "");
  const characters = input.value.toUpperCase().replace(/[^0-9X]/g, "");
  const digits = characters.replace(/\D/g, "").slice(0, 16);
  const value =
    characters.endsWith("X") && digits.length === 15 ? `${digits}X` : digits;
  const digitsBeforeCursor = inputBeforeCursor.replace(/X/g, "").length;
  const cursorCharacters = Math.min(
    digitsBeforeCursor +
      (inputBeforeCursor.endsWith("X") && value.endsWith("X") ? 1 : 0),
    value.length,
  );
  const formatted = value.match(/.{1,4}/g)?.join("-") ?? "";
  const formattedCursor =
    cursorCharacters === 0
      ? 0
      : cursorCharacters + Math.floor((cursorCharacters - 1) / 4);

  requestAnimationFrame(() => {
    try {
      input.setSelectionRange(formattedCursor, formattedCursor);
    } catch {
      /* ignore */
    }
  });
  return formatted;
}
