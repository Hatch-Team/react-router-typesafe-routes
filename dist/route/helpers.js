// We copy react-router implementation to exclude react-router-dom/react-router-native dependencies.
export function createSearchParams(params) {
    return new URLSearchParams(Object.keys(params).reduce((memo, key) => {
        const value = params[key];
        return memo.concat(Array.isArray(value) ? value.map((v) => [key, v]) : [[key, value]]);
    }, []));
}
