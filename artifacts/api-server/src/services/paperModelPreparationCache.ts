export function createPaperModelPreparationCache<T>(
  prepare: (modelNumber: number) => Promise<T | null>,
) {
  const prepared = new Map<number, Promise<T | null>>();

  const load = async (modelNumber: number): Promise<T | null> => {
    const cached = prepared.get(modelNumber);
    if (cached) return cached;

    const pending = prepare(modelNumber);
    prepared.set(modelNumber, pending);
    try {
      const value = await pending;
      if (value === null) prepared.delete(modelNumber);
      return value;
    } catch (error) {
      prepared.delete(modelNumber);
      throw error;
    }
  };

  const prewarm = async (modelNumbers: number[], batchSize = 4) => {
    const uniqueModelNumbers = [...new Set(modelNumbers)]
      .filter((number) => Number.isSafeInteger(number) && number > 0);
    const safeBatchSize = Number.isSafeInteger(batchSize) && batchSize > 0 ? batchSize : 4;
    let ready = 0;
    let failed = 0;

    for (let offset = 0; offset < uniqueModelNumbers.length; offset += safeBatchSize) {
      const batch = uniqueModelNumbers.slice(offset, offset + safeBatchSize);
      const results = await Promise.allSettled(batch.map(load));
      for (const result of results) {
        if (result.status === "fulfilled" && result.value !== null) ready += 1;
        else failed += 1;
      }
    }

    return { total: uniqueModelNumbers.length, ready, failed };
  };

  return { load, prewarm };
}
