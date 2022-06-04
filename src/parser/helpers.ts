export function assertIsString(value: unknown, message?: string): asserts value is string {
    if (typeof value !== "string") {
        throw new Error(message ?? `Expected ${String(value)} to be a string`);
    }
}

export function assertIsNotNaN(value: unknown, message?: string): asserts value is number {
    if (Number.isNaN(value)) {
        throw new Error(message ?? `Unexpected NaN`);
    }
}

export function assertIsBoolean(value: unknown, message?: string): asserts value is boolean {
    if (typeof value !== "boolean") {
        throw new Error(message ?? `Expected ${String(value)} to be a boolean`);
    }
}

export function assertIsArray(value: unknown, message?: string): asserts value is unknown[] {
    if (!Array.isArray(value)) {
        throw new Error(message ?? `Expected ${String(value)} to be an array`);
    }
}

export function assertIsValidDate(value: Date, message?: string): asserts value is Date {
    if (Number.isNaN(value.getTime())) {
        throw new Error(message ?? `Unexpected invalid date`);
    }
}
