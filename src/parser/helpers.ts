export function assertIsString(value: unknown): asserts value is string {
    if (typeof value !== "string") {
        throw new Error(`Expected ${value} to be string`);
    }
}

export function assertIsArray(value: unknown): asserts value is unknown[] {
    if (!Array.isArray(value)) {
        throw new Error(`Expected ${value} to be an array`);
    }
}
