import { Parser, ParserWithFallback } from "./parser";

export function withFallback<TOriginal, TStored = string, TRetrieved = TOriginal>({
    store,
    retrieve,
    isArray,
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
        isArray,
    });

    return Object.assign(getParserMethods, { store, retrieve, isArray });
}
