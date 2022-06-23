import { Parser, ParserWithFallback } from "./parser";
export declare function withFallback<TOriginal, TStored = string, TRetrieved = TOriginal>({ store, retrieve, isArray, }: Parser<TOriginal, TStored, TRetrieved>): ParserWithFallback<TOriginal, TStored, TRetrieved>;
