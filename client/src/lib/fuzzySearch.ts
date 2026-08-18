// دالة البحث الضبابي البسيط
export function fuzzySearch(query: string, text: string): boolean {
  if (!query || !text) return false;

  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  // البحث المباشر
  if (textLower.includes(queryLower)) {
    return true;
  }

  // البحث الضبابي - السماح ببعض الأخطاء
  let queryIndex = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
    }
  }

  return queryIndex === queryLower.length;
}

// دالة البحث المتقدم
export function advancedSearch(query: string, items: any[], searchFields: string[]): any[] {
  if (!query || !items.length) return items;

  return items.filter(item => {
    return searchFields.some(field => {
      const fieldValue = item[field];
      if (typeof fieldValue === 'string') {
        return fuzzySearch(query, fieldValue);
      }
      return false;
    });
  });
}

// تصدير افتراضي
export default {
  fuzzySearch,
  advancedSearch
};