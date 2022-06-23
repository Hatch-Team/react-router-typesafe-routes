import { generatePath } from "react-router";
import { createSearchParams } from "./helpers";
import { useMemo, useCallback } from "react";
function route(path, options = {}, children) {
    const decoratedChildren = decorateChildren(path, options, children);
    return {
        ...decoratedChildren,
        ...createRoute(path, options),
    };
}
function decorateChildren(path, options, children) {
    return Object.fromEntries(Object.entries(children !== null && children !== void 0 ? children : {}).map(([key, value]) => [
        key,
        isRoute(value)
            ? {
                ...decorateChildren(path, options, value),
                ...createRoute(path === ""
                    ? value._originalPath
                    : value._originalPath === ""
                        ? path
                        : `${path}/${value._originalPath}`, {
                    params: { ...options.params, ...value._originalOptions.params },
                    searchParams: {
                        ...options.searchParams,
                        ...value._originalOptions.searchParams,
                    },
                    hash: mergeHashValues(options.hash, value._originalOptions.hash),
                }),
            }
            : value,
    ]));
}
function isRoute(value) {
    return Boolean(value && typeof value === "object" && "_originalOptions" in value && "_originalPath" in value);
}
function createRoute(path, options) {
    const keys = getKeys(path);
    const relativePath = removeIntermediateStars(path);
    function storeParams(params) {
        return storeParamsWithParsers(keys, params, options.params);
    }
    function storeSearchParams(params) {
        return createSearchParams(storeSearchParamsWithParsers(params, options.searchParams));
    }
    function storeHash(hash) {
        return hash;
    }
    function buildRelativePath(params) {
        return generatePath(relativePath, storeParams(params));
    }
    function buildPath(params) {
        return `/${buildRelativePath(params)}`;
    }
    function buildSearch(params) {
        const searchString = storeSearchParams(params).toString();
        return searchString ? `?${searchString}` : "";
    }
    function buildHash(hash) {
        const storedHash = storeHash(hash);
        return storedHash !== undefined ? `#${storedHash}` : "";
    }
    function buildRelativeUrl(params, searchParams, hash) {
        return `${buildRelativePath(params)}${searchParams !== undefined ? buildSearch(searchParams) : ""}${hash !== undefined ? buildHash(hash) : ""}`;
    }
    function buildUrl(params, searchParams, hash) {
        return `/${buildRelativeUrl(params, searchParams, hash)}`;
    }
    function retrieveParams(params) {
        return retrieveParamsWithParsers(keys, params, options.params);
    }
    function retrieveSearchParams(params) {
        return retrieveSearchParamsWithParsers(params, options.searchParams);
    }
    function retrieveHash(location) {
        return retrieveHashWithHashValues(location.hash, options.hash);
    }
    function useParams(params) {
        return useMemo(() => retrieveParams(params), [params]);
    }
    function useSearchParams([urlSearchParams, setUrlSearchParams]) {
        const searchParams = useMemo(() => retrieveSearchParams(urlSearchParams), [urlSearchParams]);
        const setSearchParams = useCallback((params, navigateOptions) => {
            setUrlSearchParams(storeSearchParams(params), navigateOptions);
        }, [setUrlSearchParams]);
        return [searchParams, setSearchParams];
    }
    function useHash(location) {
        return useMemo(() => retrieveHashWithHashValues(location.hash, options.hash), [location.hash]);
    }
    return {
        _originalOptions: options,
        _originalPath: path,
        relativePath,
        path: `/${path}`,
        storeParams,
        storeSearchParams,
        storeHash,
        buildPath,
        buildRelativePath,
        buildSearch,
        buildHash,
        buildUrl,
        buildRelativeUrl,
        retrieveParams,
        retrieveSearchParams,
        retrieveHash,
        useParams,
        useSearchParams,
        useHash,
    };
}
function storeParamsWithParsers(keys, params, parsers) {
    return Object.fromEntries(Object.entries(params)
        .map(([key, value]) => {
        var _a;
        return [
            key,
            keys.includes(key) && (parsers === null || parsers === void 0 ? void 0 : parsers[key]) && value !== undefined
                ? (_a = parsers[key]) === null || _a === void 0 ? void 0 : _a.store(value)
                : typeof value === "string"
                    ? value
                    : null,
        ];
    })
        .filter(([, value]) => value !== null));
}
function storeSearchParamsWithParsers(params, parsers) {
    return (params
        ? Object.fromEntries(Object.entries(params)
            .map(([key, value]) => {
            var _a;
            return [
                key,
                (parsers === null || parsers === void 0 ? void 0 : parsers[key]) && value !== undefined ? (_a = parsers[key]) === null || _a === void 0 ? void 0 : _a.store(value) : null,
            ];
        })
            .filter(([, value]) => value !== null))
        : {});
}
function mergeHashValues(firstHash, secondHash) {
    if (!firstHash && !secondHash) {
        return undefined;
    }
    if ((firstHash === null || firstHash === void 0 ? void 0 : firstHash.length) === 0 || (secondHash === null || secondHash === void 0 ? void 0 : secondHash.length) === 0) {
        return [];
    }
    return [...(firstHash !== null && firstHash !== void 0 ? firstHash : []), ...(secondHash !== null && secondHash !== void 0 ? secondHash : [])];
}
function retrieveParamsWithParsers(keys, pathParams, parsers) {
    if (keys.some((key) => typeof pathParams[key] !== "string")) {
        throw new Error("Insufficient params");
    }
    const result = {};
    keys.forEach((key) => {
        var _a;
        if (parsers === null || parsers === void 0 ? void 0 : parsers[key]) {
            try {
                result[key] = (_a = parsers[key]) === null || _a === void 0 ? void 0 : _a.retrieve(pathParams[key]);
            }
            catch (error) {
                if (key !== "*") {
                    throw error;
                }
            }
        }
        else {
            result[key] = pathParams[key];
        }
    });
    return result;
}
function retrieveSearchParamsWithParsers(searchParams, parsers) {
    if (!parsers) {
        return {};
    }
    return Object.fromEntries(Object.entries(parsers)
        .map(([key, value]) => {
        let nextValue;
        try {
            nextValue = (value === null || value === void 0 ? void 0 : value.isArray)
                ? value.retrieve(searchParams.getAll(key))
                : value === null || value === void 0 ? void 0 : value.retrieve(searchParams.get(key));
        }
        catch {
            nextValue = null;
        }
        return [key, nextValue];
    })
        .filter(([, value]) => value !== null));
}
function retrieveHashWithHashValues(hash, hashValues) {
    if ((hashValues === null || hashValues === void 0 ? void 0 : hashValues.length) === 0 || (hash && (hashValues === null || hashValues === void 0 ? void 0 : hashValues.includes(hash)))) {
        return hash === null || hash === void 0 ? void 0 : hash.substring(1, hash === null || hash === void 0 ? void 0 : hash.length);
    }
    return undefined;
}
function getKeys(path) {
    const params = path
        .split(":")
        .filter((_, index) => Boolean(index))
        .map((part) => part.split("/")[0]);
    if (path.includes("*")) {
        params.push("*");
    }
    return params;
}
function removeIntermediateStars(path) {
    return path.replace("*/", "");
}
export { route };
