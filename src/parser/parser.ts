interface Parser<TOriginal, TStored = string, TRetrieved = TOriginal> {
    store: (value: TOriginal) => TStored;
    retrieve: (value: unknown) => TRetrieved;
    isArray?: boolean;
}

interface ParserWithFallback<TOriginal, TStored = string, TRetrieved = TOriginal>
    extends Parser<TOriginal, TStored, TRetrieved> {
    (fallback: TRetrieved): Parser<TOriginal, TStored, TRetrieved> & { __brand: "withFallback" };
}

type OriginalParams<TParsers> = Params<TParsers, true>;
type RetrievedParams<TParsers> = Params<TParsers>;

type PickParsersWithFallback<T> = Pick<T, KeysWithFallback<T>>;

type KeysWithFallback<T> = {
    [TKey in keyof T]: KeyWithFallback<T[TKey], TKey>;
}[keyof T];

type KeyWithFallback<T, K> = T extends { __brand: "withFallback" } ? K : never;

type Params<TParsers, TUseOriginal extends boolean = false> = {
    [TKey in keyof TParsers]: ParserType<TParsers[TKey], TUseOriginal>;
};

type ParserType<T, TUseOriginal extends boolean> = T extends Parser<infer TOriginal, unknown, infer TRetrieved>
    ? TUseOriginal extends true
        ? TOriginal
        : TRetrieved
    : never;

export { Parser, ParserWithFallback, OriginalParams, RetrievedParams, PickParsersWithFallback };
