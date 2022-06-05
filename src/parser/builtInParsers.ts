import { Parser, ParserWithFallback } from "./parser";
import { withFallback } from "./withFallback";
import { assertIsString, assertIsArray, assertIsBoolean, assertIsValidDate, assertIsNumber } from "./helpers";

export const stringParser = withFallback<string>({
    store(value) {
        return value;
    },
    retrieve(value) {
        assertIsString(value);

        return value;
    },
});

export const numberParser = withFallback<number>({
    store(value) {
        return JSON.stringify(value);
    },
    retrieve(value) {
        assertIsString(value);

        const parsedValue: unknown = JSON.parse(value);
        assertIsNumber(parsedValue);

        return parsedValue;
    },
});

export const booleanParser = withFallback<boolean>({
    store(value) {
        return JSON.stringify(value);
    },
    retrieve(value) {
        assertIsString(value);

        const parsedValue: unknown = JSON.parse(value);
        assertIsBoolean(parsedValue);

        return parsedValue;
    },
});

export const dateParser = withFallback<Date>({
    store(value) {
        return value.toISOString();
    },
    retrieve(value) {
        assertIsString(value);

        const parsedValue = new Date(value);
        assertIsValidDate(parsedValue, `Couldn't transform ${value} to date`);

        return parsedValue;
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

            throw new Error(`No matching value for ${String(value)}`);
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
            assertIsArray(value);

            return value.map((item) => parser.retrieve(item));
        },
        isArray: true,
    });
};
