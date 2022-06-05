import { Parser, OriginalParams, RetrievedParams, PickParsersWithFallback, OmitParsersWithFallback } from "../parser";
import { generatePath, NavigateOptions, Location } from "react-router";
import { createSearchParams } from "./helpers";
import { useMemo, useCallback } from "react";

type RouteWithChildren<
    TChildren,
    TPath extends string,
    TPathParsers,
    TSearchParsers,
    THash extends string[]
> = DecoratedChildren<TChildren, TPath, TPathParsers, TSearchParsers, THash> &
    Route<TPath, TPathParsers, TSearchParsers, THash>;

type DecoratedChildren<TChildren, TPath extends string, TPathParsers, TSearchParsers, THash extends string[]> = {
    [TKey in keyof TChildren]: TChildren[TKey] extends RouteWithChildren<
        infer TChildChildren,
        infer TChildPath,
        infer TChildPathParsers,
        infer TChildQueryParsers,
        infer TChildHash
    >
        ? RouteWithChildren<
              TChildChildren,
              TPath extends "" ? TChildPath : TChildPath extends "" ? TPath : `${TPath}/${TChildPath}`,
              TPathParsers & TChildPathParsers,
              TSearchParsers & TChildQueryParsers,
              THash | TChildHash
          >
        : TChildren[TKey];
};

type InSearchParams<TSearchParsers> = Partial<OriginalParams<TSearchParsers>>;
type OutSearchParams<TSearchParsers> = Partial<RetrievedParams<TSearchParsers>> &
    RetrievedParams<PickParsersWithFallback<TSearchParsers>>;

type InParams<TKey extends string, TPathParsers> = PartialByKey<
    PickWithFallback<OriginalParams<TPathParsers>, TKey, string>,
    "*"
>;
type OutParams<TKey extends string, TPathParsers> = PartialByKey<
    PickWithFallback<RetrievedParams<TPathParsers>, TKey, string>,
    "*" extends keyof OmitParsersWithFallback<TPathParsers> ? "*" : ""
>;

interface Route<TPath extends string, TPathParsers, TSearchParsers, THash extends string[]> {
    path: `/${TPath}`;
    relativePath: PathWithoutIntermediateStars<TPath>;
    storeParams: (params: InParams<ExtractRouteParams<TPath>, TPathParsers>) => Record<string, string>;
    storeSearchParams: (params: InSearchParams<TSearchParsers>) => URLSearchParams;
    storeHash: (hash: THash[number]) => THash[number];
    buildPath: (params: InParams<ExtractRouteParams<TPath>, TPathParsers>) => string;
    buildRelativePath: (params: InParams<ExtractRouteParams<TPath>, TPathParsers>) => string;
    buildSearch: (params: InSearchParams<TSearchParsers>) => string;
    buildHash: (hash: THash[number]) => string;
    buildUrl: (
        params: InParams<ExtractRouteParams<TPath>, TPathParsers>,
        searchParams?: InSearchParams<TSearchParsers>,
        hash?: THash[number]
    ) => string;
    buildRelativeUrl: (
        params: InParams<ExtractRouteParams<TPath>, TPathParsers>,
        searchParams?: InSearchParams<TSearchParsers>,
        hash?: THash[number]
    ) => string;
    retrieveParams: (
        params: Record<string, string | undefined>
    ) => OutParams<ExtractRouteParams<SanitizedPath<TPath>>, TPathParsers>;
    retrieveSearchParams: (searchParams: URLSearchParams) => OutSearchParams<TSearchParsers>;
    retrieveHash: (location: Location) => THash[number] | undefined;
    useParams: (
        params: Record<string, string | undefined>
    ) => OutParams<ExtractRouteParams<SanitizedPath<TPath>>, TPathParsers>;
    useSearchParams: (
        hookResult: readonly [URLSearchParams, (params: URLSearchParams, options?: NavigateOptions) => void]
    ) => readonly [
        OutSearchParams<TSearchParsers>,
        (params: InSearchParams<TSearchParsers>, navigateOptions?: NavigateOptions) => void
    ];
    useHash: (location: Location) => THash[number] | undefined;
    _originalOptions: RouteOptions<TPathParsers, TSearchParsers, THash>;
    _originalPath: TPath;
}

type PickWithFallback<T, K extends string, F> = { [P in K]: P extends keyof T ? T[P] : F };

type PartialByKey<T, K> = K extends keyof T ? Omit<T, K> & Partial<Pick<T, K>> : T;

type SanitizedPath<T> = T extends `/${string}` ? never : T extends `${string}/` ? never : T;

type PathWithoutIntermediateStars<T extends string> = T extends `${infer TStart}*/${infer TEnd}`
    ? PathWithoutIntermediateStars<`${TStart}${TEnd}`>
    : T;

type SanitizedChildren<T> = T extends Record<infer TKey, unknown>
    ? TKey extends string
        ? TKey extends Capitalize<TKey>
            ? T
            : never
        : T
    : T;

type ExtractRouteParams<TPath extends string> = string extends TPath
    ? never
    : TPath extends `${infer TStart}:${infer TParam}/${infer TRest}`
    ? TParam | ExtractRouteParams<TRest>
    : TPath extends `${infer TStart}:${infer TParam}`
    ? TParam
    : TPath extends `${infer TBefore}*${infer TAfter}`
    ? "*"
    : never;

interface RouteOptions<TPathParsers, TSearchParsers, THash> {
    params?: TPathParsers;
    searchParams?: TSearchParsers;
    hash?: THash;
}

function route<
    TChildren,
    TPath extends string = string,
    /* eslint-disable @typescript-eslint/no-explicit-any */
    TPathParsers extends Partial<Record<ExtractRouteParams<SanitizedPath<TPath>>, Parser<any>>> = Record<never, never>,
    TSearchParsers extends Partial<Record<string, Parser<any, string | string[]>>> = Record<never, never>,
    /* eslint-enable */
    THash extends string[] = never[]
>(
    path: SanitizedPath<TPath>,
    options: RouteOptions<TPathParsers, TSearchParsers, THash> = {},
    children?: SanitizedChildren<TChildren>
): RouteWithChildren<TChildren, TPath, TPathParsers, TSearchParsers, THash> {
    const decoratedChildren = decorateChildren(path, options, children);

    return {
        ...decoratedChildren,
        ...createRoute(path, options),
    };
}

function decorateChildren<TPath extends string, TPathParsers, TSearchParsers, THash extends string[], TChildren>(
    path: SanitizedPath<TPath>,
    options: RouteOptions<TPathParsers, TSearchParsers, THash>,
    children?: TChildren
): DecoratedChildren<TChildren, TPath, TPathParsers, TSearchParsers, THash> {
    return Object.fromEntries(
        Object.entries(children ?? {}).map(([key, value]) => [
            key,
            isRoute(value)
                ? {
                      ...decorateChildren(path, options, value),
                      ...createRoute(
                          path === ""
                              ? value._originalPath
                              : value._originalPath === ""
                              ? path
                              : `${path}/${value._originalPath}`,
                          {
                              params: { ...options.params, ...value._originalOptions.params },
                              searchParams: {
                                  ...options.searchParams,
                                  ...value._originalOptions.searchParams,
                              },
                              hash: mergeHashValues(options.hash, value._originalOptions.hash),
                          }
                      ),
                  }
                : value,
        ])
    ) as DecoratedChildren<TChildren, TPath, TPathParsers, TSearchParsers, THash>;
}

function isRoute(
    value: unknown
): value is RouteWithChildren<unknown, string, Record<never, never>, Record<never, never>, string[]> {
    return Boolean(value && typeof value === "object" && "_originalOptions" in value && "_originalPath" in value);
}

function createRoute<
    TPath extends string,
    /* eslint-disable @typescript-eslint/no-explicit-any */
    TPathParsers extends Partial<Record<ExtractRouteParams<SanitizedPath<TPath>>, Parser<any>>> = Record<never, never>,
    TSearchParsers extends Partial<Record<string, Parser<any, string | string[]>>> = Record<never, never>,
    /* eslint-enable */
    THash extends string[] = never[]
>(
    path: SanitizedPath<TPath>,
    options: RouteOptions<TPathParsers, TSearchParsers, THash>
): Route<TPath, TPathParsers, TSearchParsers, THash> {
    const keys = getKeys(path);
    const relativePath = removeIntermediateStars(path);

    function storeParams(params: InParams<ExtractRouteParams<TPath>, TPathParsers>) {
        return storeParamsWithParsers(keys, params, options.params);
    }

    function storeSearchParams(params: InSearchParams<TSearchParsers>) {
        return createSearchParams(storeSearchParamsWithParsers(params, options.searchParams));
    }

    function storeHash(hash: THash[number]) {
        return hash;
    }

    function buildRelativePath(params: InParams<ExtractRouteParams<TPath>, TPathParsers>) {
        return generatePath(relativePath, storeParams(params));
    }

    function buildPath(params: InParams<ExtractRouteParams<TPath>, TPathParsers>) {
        return `/${buildRelativePath(params)}`;
    }

    function buildSearch(params: InSearchParams<TSearchParsers>) {
        const searchString = storeSearchParams(params).toString();

        return searchString ? `?${searchString}` : "";
    }

    function buildHash(hash: THash[number]) {
        const storedHash = storeHash(hash);

        return storedHash !== undefined ? `#${storedHash}` : "";
    }

    function buildRelativeUrl(
        params: InParams<ExtractRouteParams<TPath>, TPathParsers>,
        searchParams?: InSearchParams<TSearchParsers>,
        hash?: THash[number]
    ) {
        return `${buildRelativePath(params)}${searchParams !== undefined ? buildSearch(searchParams) : ""}${
            hash !== undefined ? buildHash(hash) : ""
        }`;
    }

    function buildUrl(
        params: InParams<ExtractRouteParams<TPath>, TPathParsers>,
        searchParams?: InSearchParams<TSearchParsers>,
        hash?: THash[number]
    ) {
        return `/${buildRelativeUrl(params, searchParams, hash)}`;
    }

    function retrieveParams(params: Record<string, string | undefined>) {
        return retrieveParamsWithParsers(keys, params, options.params);
    }

    function retrieveSearchParams(params: URLSearchParams) {
        return retrieveSearchParamsWithParsers(params, options.searchParams);
    }

    function retrieveHash(location: Location) {
        return retrieveHashWithHashValues(location.hash, options.hash);
    }

    function useParams(params: Record<string, string | undefined>) {
        return useMemo(() => retrieveParams(params), [params]);
    }

    function useSearchParams([urlSearchParams, setUrlSearchParams]: readonly [
        URLSearchParams,
        (params: URLSearchParams, options?: NavigateOptions) => void
    ]): [
        OutSearchParams<TSearchParsers>,
        (params: InSearchParams<TSearchParsers>, navigateOptions?: NavigateOptions) => void
    ] {
        const searchParams = useMemo(() => retrieveSearchParams(urlSearchParams), [urlSearchParams]);

        const setSearchParams = useCallback(
            (params: InSearchParams<TSearchParsers>, navigateOptions?: NavigateOptions) => {
                setUrlSearchParams(storeSearchParams(params), navigateOptions);
            },
            [setUrlSearchParams]
        );

        return [searchParams, setSearchParams];
    }

    function useHash(location: Location) {
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

function storeParamsWithParsers(
    keys: string[],
    params: Record<string, unknown>,
    parsers?: Partial<Record<string, Parser<unknown>>>
): Record<string, string> {
    return Object.fromEntries(
        Object.entries(params)
            .map(([key, value]) => [
                key,
                keys.includes(key) && parsers?.[key] && value !== undefined
                    ? parsers[key]?.store(value)
                    : typeof value === "string"
                    ? value
                    : null,
            ])
            .filter(([, value]) => value !== null)
    ) as Record<string, string>;
}

function storeSearchParamsWithParsers(
    params?: Record<string, unknown>,
    parsers?: Partial<Record<string, Parser<unknown, string | string[]>>>
): Record<string, string | string[]> {
    return (
        params
            ? Object.fromEntries(
                  Object.entries(params)
                      .map(([key, value]) => [
                          key,
                          parsers?.[key] && value !== undefined ? parsers[key]?.store(value) : null,
                      ])
                      .filter(([, value]) => value !== null)
              )
            : {}
    ) as Record<string, string | string[]>;
}

function mergeHashValues<T, U>(firstHash?: T[], secondHash?: U[]): (T | U)[] | undefined {
    if (!firstHash && !secondHash) {
        return undefined;
    }

    if (firstHash?.length === 0 || secondHash?.length === 0) {
        return [];
    }

    return [...(firstHash ?? []), ...(secondHash ?? [])];
}

function retrieveParamsWithParsers<TKey extends string, TPathParsers extends Partial<Record<TKey, Parser<unknown>>>>(
    keys: TKey[],
    pathParams: Record<string, string | undefined>,
    parsers?: TPathParsers
): OutParams<TKey, TPathParsers> {
    if (keys.some((key) => typeof pathParams[key] !== "string")) {
        throw new Error("Insufficient params");
    }

    const result: Record<string, unknown> = {};

    keys.forEach((key) => {
        if (parsers?.[key]) {
            try {
                result[key] = parsers[key]?.retrieve(pathParams[key]);
            } catch (error) {
                if (key !== "*") {
                    throw error;
                }
            }
        } else {
            result[key] = pathParams[key];
        }
    });

    return result as OutParams<TKey, TPathParsers>;
}

function retrieveSearchParamsWithParsers<
    TSearchParsers extends Partial<Record<string, Parser<unknown, string | string[]>>>
>(searchParams: URLSearchParams, parsers?: TSearchParsers): OutSearchParams<TSearchParsers> {
    if (!parsers) {
        return {} as OutSearchParams<TSearchParsers>;
    }

    return Object.fromEntries(
        Object.entries(parsers)
            .map(([key, value]) => {
                let nextValue: unknown;

                try {
                    nextValue = value?.isArray
                        ? value.retrieve(searchParams.getAll(key))
                        : value?.retrieve(searchParams.get(key));
                } catch {
                    nextValue = null;
                }

                return [key, nextValue];
            })
            .filter(([, value]) => value !== null)
    ) as OutSearchParams<TSearchParsers>;
}

function retrieveHashWithHashValues(hash?: string, hashValues?: string[]): string | undefined {
    if (hashValues?.length === 0 || (hash && hashValues?.includes(hash))) {
        return hash?.substring(1, hash?.length);
    }

    return undefined;
}

function getKeys<TPath extends string>(path: TPath): ExtractRouteParams<TPath>[] {
    const params = path
        .split(":")
        .filter((_, index) => Boolean(index))
        .map((part) => part.split("/")[0]);

    if (path.includes("*")) {
        params.push("*");
    }

    return params as ExtractRouteParams<TPath>[];
}

function removeIntermediateStars<TPath extends string>(path: TPath): PathWithoutIntermediateStars<TPath> {
    return path.replace("*/", "") as PathWithoutIntermediateStars<TPath>;
}

export { Route, RouteWithChildren, route };
