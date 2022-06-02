import { Parser, ParserWithFallback } from "./parser";
import { withFallback } from "./withFallback";

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
            throw new Error(`Couldn't transform ${value} to number`);
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

export const dateParser = withFallback<Date>({
    store(value) {
        return value.toISOString();
    },
    retrieve(value) {
        if (!(typeof value === "string" || typeof value === "number")) {
            throw new Error(`Expected ${value} to be string or number`);
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            throw new Error(`Couldn't transform ${value} to date`);
        }

        return date;
    },
});

export const oneOfParser = <T extends (string | number | boolean)[]>(...values: T) => {
    return withFallback<T[number]>({
        store: String,
        retrieve(value) {
            for (const canonicalValue of values) {
                try {
                    switch (typeof canonicalValue) {
                        case "string":
                            if (stringParser.retrieve(value) === canonicalValue) return canonicalValue;
                            break;
                        case "number":
                            if (numberParser.retrieve(value) === canonicalValue) return canonicalValue;
                            break;
                        case "boolean":
                            if (booleanParser.retrieve(value) === canonicalValue) return canonicalValue;
                    }
                } catch {
                    // Try next value
                }
            }

            throw new Error(`No matching value for ${value}`);
        },
    });
};

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
