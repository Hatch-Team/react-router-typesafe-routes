export function assertIsString(value, message) {
    if (typeof value !== "string") {
        throw new Error(message !== null && message !== void 0 ? message : `Expected ${String(value)} to be a string`);
    }
}
export function assertIsNumber(value, message) {
    if (typeof value !== "number") {
        throw new Error(message !== null && message !== void 0 ? message : `Expected ${String(value)} to be a number`);
    }
}
export function assertIsNotNaN(value, message) {
    if (Number.isNaN(value)) {
        throw new Error(message !== null && message !== void 0 ? message : `Unexpected NaN`);
    }
}
export function assertIsBoolean(value, message) {
    if (typeof value !== "boolean") {
        throw new Error(message !== null && message !== void 0 ? message : `Expected ${String(value)} to be a boolean`);
    }
}
export function assertIsArray(value, message) {
    if (!Array.isArray(value)) {
        throw new Error(message !== null && message !== void 0 ? message : `Expected ${String(value)} to be an array`);
    }
}
export function assertIsValidDate(value, message) {
    if (Number.isNaN(value.getTime())) {
        throw new Error(message !== null && message !== void 0 ? message : `Unexpected invalid date`);
    }
}
