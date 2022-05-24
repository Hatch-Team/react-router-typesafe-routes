export interface Parser<TOriginal, TStored = string, TRetrieved = TOriginal> {
    store: (value: TOriginal) => TStored;
    retrieve: (value: unknown) => TRetrieved;
}

export interface ParserWithFallback<TOriginal, TStored = string, TRetrieved = TOriginal>
    extends Parser<TOriginal, TStored, TRetrieved> {
    (fallback: TRetrieved): Parser<TOriginal, TStored, TRetrieved>;
}

export function withFallback<TOriginal, TStored = string, TRetrieved = TOriginal>({
    store,
    retrieve,
}: Parser<TOriginal, TStored, TRetrieved>): ParserWithFallback<TOriginal, TStored, TRetrieved> {
    const getParserMethods = (fallback: TRetrieved) => ({
        store,
        retrieve(storedValue: unknown) {
            try {
                return retrieve(storedValue);
            } catch {
                return fallback;
            }
        },
    });

    return Object.assign(getParserMethods, { store, retrieve });
}
