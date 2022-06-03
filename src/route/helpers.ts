// We copy react-router implementation to exclude react-router-dom/react-router-native dependencies.
export function createSearchParams(params: Record<string, string | string[]>): URLSearchParams {
    return new URLSearchParams(
        Object.keys(params).reduce((memo, key) => {
            let value = params[key];
            return memo.concat(Array.isArray(value) ? value.map((v) => [key, v]) : [[key, value]]);
        }, [] as string[][])
    );
}
