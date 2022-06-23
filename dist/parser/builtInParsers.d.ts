import { Parser, ParserWithFallback } from "./parser";
export declare const stringParser: ParserWithFallback<string, string, string>;
export declare const numberParser: ParserWithFallback<number, string, number>;
export declare const booleanParser: ParserWithFallback<boolean, string, boolean>;
export declare const dateParser: ParserWithFallback<Date, string, Date>;
export declare const oneOfParser: <T extends (string | number | boolean)[]>(...values: T) => ParserWithFallback<T[number], string, T[number]>;
export declare const arrayOfParser: <TOriginal, TStored, TRetrieved>(parser: Parser<TOriginal, TStored, TRetrieved>) => ParserWithFallback<TOriginal[], TStored[], TRetrieved[]>;
