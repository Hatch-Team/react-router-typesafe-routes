import { withFallback } from "./withFallback";
import { assertIsString, assertIsArray, assertIsBoolean, assertIsValidDate, assertIsNumber } from "./helpers";
export const stringParser = withFallback({
    store(value) {
        return value;
    },
    retrieve(value) {
        assertIsString(value);
        return value;
    },
});
export const numberParser = withFallback({
    store(value) {
        return JSON.stringify(value);
    },
    retrieve(value) {
        assertIsString(value);
        const parsedValue = JSON.parse(value);
        assertIsNumber(parsedValue);
        return parsedValue;
    },
});
export const booleanParser = withFallback({
    store(value) {
        return JSON.stringify(value);
    },
    retrieve(value) {
        assertIsString(value);
        const parsedValue = JSON.parse(value);
        assertIsBoolean(parsedValue);
        return parsedValue;
    },
});
export const dateParser = withFallback({
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
export const oneOfParser = (...values) => {
    return withFallback({
        store: String,
        retrieve(value) {
            for (const canonicalValue of values) {
                try {
                    switch (typeof canonicalValue) {
                        case "string":
                            if (stringParser.retrieve(value) === canonicalValue)
                                return canonicalValue;
                            break;
                        case "number":
                            if (numberParser.retrieve(value) === canonicalValue)
                                return canonicalValue;
                            break;
                        case "boolean":
                            if (booleanParser.retrieve(value) === canonicalValue)
                                return canonicalValue;
                    }
                }
                catch {
                    // Try next value
                }
            }
            throw new Error(`No matching value for ${String(value)}`);
        },
    });
};
export const arrayOfParser = (parser) => {
    return withFallback({
        store(values) {
            return values.map((value) => parser.store(value));
        },
        retrieve(value) {
            assertIsArray(value);
            return value.map((item) => parser.retrieve(item));
        },
        isArray: true,
    });
};
