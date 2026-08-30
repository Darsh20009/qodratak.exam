export function fuzzySearch(query: string, text: string): boolean {
  if (!query || !text) return false;

  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  if (textLower.includes(queryLower)) {
    return true;
  }

  let queryIndex = 0;
  for (let index = 0; index < textLower.length && queryIndex < queryLower.length; index++) {
    if (textLower[index] === queryLower[queryIndex]) {
      queryIndex++;
    }
  }

  return queryIndex === queryLower.length;
}

export function advancedSearch(
  query: string,
  items: any[],
  searchFields: string[],
): any[] {
  if (!query || !items.length) return items;

  return items.filter((item) =>
    searchFields.some((field) => {
      const fieldValue = item[field];
      return typeof fieldValue === "string" && fuzzySearch(query, fieldValue);
    }),
  );
}

export default {
  fuzzySearch,
  advancedSearch,
};