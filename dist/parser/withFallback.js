export function withFallback({ store, retrieve, isArray, }) {
    const getParserMethods = (fallback) => ({
        store,
        retrieve(storedValue) {
            try {
                return retrieve(storedValue);
            }
            catch {
                return fallback;
            }
        },
        isArray,
    });
    return Object.assign(getParserMethods, { store, retrieve, isArray });
}
