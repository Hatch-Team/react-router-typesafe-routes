import { withFallback } from "./parser";

export const stringParser = withFallback<string>({
    store(value) {
        return String(value);
    },
    retrieve(value) {
        return String(value);
    },
});
