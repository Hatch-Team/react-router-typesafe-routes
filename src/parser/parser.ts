interface Parser<TOriginal, TStored = string, TRetrieved = TOriginal> {
    store: (value: TOriginal) => TStored;
    retrieve: (value: unknown) => TRetrieved;
    isArray?: boolean;
}

interface ParserWithFallback<TOriginal, TStored = string, TRetrieved = TOriginal>
    extends Parser<TOriginal, TStored, TRetrieved> {
    (fallback: TRetrieved): Parser<TOriginal, TStored, TRetrieved>;
}

type OriginalParams<TParsers> = Params<TParsers, true>;
type RetrievedParams<TParsers> = Params<TParsers>;

type Params<TParsers, TUseOriginal extends boolean = false> = {
    [TKey in keyof TParsers]: ParserType<TParsers[TKey], TUseOriginal>;
};

type ParserType<T, TUseOriginal extends boolean> = T extends Parser<infer TOriginal, unknown, infer TRetrieved>
    ? TUseOriginal extends true
        ? TOriginal
        : TRetrieved
    : never;

export { Parser, ParserWithFallback, OriginalParams, RetrievedParams };
