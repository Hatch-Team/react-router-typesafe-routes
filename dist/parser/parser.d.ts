interface Parser<TOriginal, TStored = string, TRetrieved = TOriginal> {
    store: (value: TOriginal) => TStored;
    retrieve: (value: unknown) => TRetrieved;
    isArray?: boolean;
}
interface ParserWithFallback<TOriginal, TStored = string, TRetrieved = TOriginal> extends Parser<TOriginal, TStored, TRetrieved> {
    (fallback: TRetrieved): Parser<TOriginal, TStored, TRetrieved> & {
        __brand: "withFallback";
    };
}
declare type OriginalParams<TParsers> = Params<TParsers, true>;
declare type RetrievedParams<TParsers> = Params<TParsers>;
declare type PickParsersWithFallback<T> = Pick<T, KeysWithFallback<T>>;
declare type OmitParsersWithFallback<T> = Omit<T, KeysWithFallback<T>>;
declare type KeysWithFallback<T> = {
    [TKey in keyof T]: KeyWithFallback<T[TKey], TKey>;
}[keyof T];
declare type KeyWithFallback<T, K> = T extends {
    __brand: "withFallback";
} ? K : never;
declare type Params<TParsers, TUseOriginal extends boolean = false> = {
    [TKey in keyof TParsers]: ParserType<TParsers[TKey], TUseOriginal>;
};
declare type ParserType<T, TUseOriginal extends boolean> = T extends Parser<infer TOriginal, unknown, infer TRetrieved> ? TUseOriginal extends true ? TOriginal : TRetrieved : never;
export { Parser, ParserWithFallback, OriginalParams, RetrievedParams, PickParsersWithFallback, OmitParsersWithFallback, };
