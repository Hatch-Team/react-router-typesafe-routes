import { withFallback, Parser, ParserWithFallback } from "./parser";

export const stringParser = withFallback<string>({
    store(value) {
        return String(value);
    },
    retrieve(value) {
        return String(value);
    },
});

export const numberParser = withFallback<number>({
    store(value) {
        return String(value);
    },
    retrieve(value) {
        const result = Number(value);

        if (Number.isNaN(result)) {
            throw new Error("Unexpected NaN");
        }

        return result;
    },
});

export const booleanParser = withFallback<boolean>({
    store(value) {
        return String(value);
    },
    retrieve(value) {
        return Boolean(value);
    },
});

export const arrayOfParser = <TOriginal, TStored, TRetrieved>(
    parser: Parser<TOriginal, TStored, TRetrieved>
): ParserWithFallback<TOriginal[], TStored[], TRetrieved[]> => {
    return withFallback<TOriginal[], TStored[], TRetrieved[]>({
        store(values: TOriginal[]) {
            return values.map((value) => parser.store(value));
        },
        retrieve(value: unknown) {
            if (Array.isArray(value)) {
                return value.map((item) => parser.retrieve(item));
            }

            throw new Error("Expected array");
        },
        isArray: true,
    });
};
