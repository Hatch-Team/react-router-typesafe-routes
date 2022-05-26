export interface Parser<TOriginal, TStored = string, TRetrieved = TOriginal> {
    store: (value: TOriginal) => TStored;
    retrieve: (value: unknown) => TRetrieved;
    isArray?: boolean;
}

export interface ParserWithFallback<TOriginal, TStored = string, TRetrieved = TOriginal>
    extends Parser<TOriginal, TStored, TRetrieved> {
    (fallback: TRetrieved): Parser<TOriginal, TStored, TRetrieved>;
}

export type OriginalParams<TParsers> = Params<TParsers, true>;
export type RetrievedParams<TParsers> = Params<TParsers>;

type Params<TParsers, TUseOriginal extends boolean = false> = {
    [TKey in keyof TParsers]: ParserType<TParsers[TKey], TUseOriginal>;
};

type ParserType<T, TUseOriginal extends boolean> = T extends Parser<infer TOriginal, unknown, infer TRetrieved>
    ? TUseOriginal extends true
        ? TOriginal
        : TRetrieved
    : never;

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
