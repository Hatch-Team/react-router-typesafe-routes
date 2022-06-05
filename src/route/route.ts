import { Parser, OriginalParams, RetrievedParams, PickParsersWithFallback } from "../parser";
import { generatePath, NavigateOptions, Location } from "react-router";
import { createSearchParams } from "./helpers";

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

interface Route<TPath extends string, TPathParsers, TSearchParsers, THash extends string[]> {
    path: `/${TPath}`;
    relativePath: PathWithoutIntermediateStars<TPath>;
    buildUrl: (
        params: PartialByKey<PickWithFallback<OriginalParams<TPathParsers>, ExtractRouteParams<TPath>, string>, "*">,
        searchParams?: Partial<OriginalParams<TSearchParsers>>,
        hash?: THash[number]
    ) => string;
    buildRelativeUrl: (
        params: PartialByKey<PickWithFallback<OriginalParams<TPathParsers>, ExtractRouteParams<TPath>, string>, "*">,
        searchParams?: Partial<OriginalParams<TSearchParsers>>,
        hash?: THash[number]
    ) => string;
    retrieveParams: (
        params: Record<string, string | undefined>
    ) => PartialByKey<
        PickWithFallback<RetrievedParams<TPathParsers>, ExtractRouteParams<SanitizedPath<TPath>>, string>,
        "*"
    >;
    parseSearch: (
        hookResult: readonly [
            URLSearchParams,
            (params: Record<string, string | string[]>, options?: NavigateOptions) => void
        ]
    ) => [
        Partial<RetrievedParams<TSearchParsers>> & RetrievedParams<PickParsersWithFallback<TSearchParsers>>,
        (params: Partial<OriginalParams<TSearchParsers>>, navigateOptions?: NavigateOptions) => void
    ];
    parseHash: (location: Location) => THash[number] | undefined;
    _originalOptions: RouteOptions<TPathParsers, TSearchParsers, THash>;
    _originalPath: TPath;
}

type PickWithFallback<T, K extends string, F> = { [P in K]: P extends keyof T ? T[P] : F };

type PartialByKey<T, K> = K extends keyof T ? Omit<T, K> & Partial<Pick<T, K>> : T;

type SanitizedPath<T> = T extends `/${string}` ? never : T extends `${string}/` ? never : T;

type PathWithoutIntermediateStars<T extends string> = T extends `${infer TStart}*/`
    ? PathWithoutIntermediateStars<TStart>
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
    const pathWithoutIntermediateStars = removeIntermediateStars(path);

    function buildPath(
        params: PartialByKey<PickWithFallback<OriginalParams<TPathParsers>, ExtractRouteParams<TPath>, string>, "*">
    ) {
        const storedPathParams = storePathParams(keys, params, options.params);
        return generatePath(pathWithoutIntermediateStars, storedPathParams);
    }

    function buildSearch(params?: Partial<OriginalParams<TSearchParsers>>) {
        const storedSearchParams = storeSearchParams(params, options.searchParams);
        const searchString = createSearchParams(storedSearchParams).toString();

        return searchString ? `?${searchString}` : "";
    }

    function buildHash(hash?: THash[number]) {
        const storedHash = storeHash(hash, options.hash);

        return storedHash !== undefined ? `#${storedHash}` : "";
    }

    return {
        _originalOptions: options,
        _originalPath: path,
        relativePath: pathWithoutIntermediateStars,
        path: `/${path}`,
        buildUrl: (params, searchParams, hash) => {
            return `/${buildPath(params)}${buildSearch(searchParams)}${buildHash(hash)}`;
        },
        buildRelativeUrl: (params, searchParams, hash) => {
            return `${buildPath(params)}${buildSearch(searchParams)}${buildHash(hash)}`;
        },
        retrieveParams: (params) => {
            return parsePath(keys, params, options.params);
        },
        parseSearch: ([urlSearchParams, setUrlSearchParams]) => {
            return [
                parseSearch(urlSearchParams, options.searchParams),
                (params?: Partial<OriginalParams<TSearchParsers>>, navigateOptions?: NavigateOptions) => {
                    setUrlSearchParams(storeSearchParams(params, options.searchParams), navigateOptions);
                },
            ];
        },
        parseHash: (location: Location) => {
            return parseHash(location.hash, options.hash);
        },
    };
}

function storePathParams(
    keys: string[],
    params: Record<string, unknown>,
    parsers?: Partial<Record<string, Parser<unknown, string>>>
): Record<string, string> {
    return Object.fromEntries(
        Object.entries(params)
            .map(([key, value]) => [
                key,
                keys.includes(key) && parsers?.[key]
                    ? parsers[key]?.store(value)
                    : typeof value === "string"
                    ? value
                    : null,
            ])
            .filter(([, value]) => value !== null)
    ) as Record<string, string>;
}

function storeSearchParams(
    params?: Record<string, unknown>,
    parsers?: Partial<Record<string, Parser<unknown, string | string[]>>>
): Record<string, string | string[]> {
    return (
        params
            ? Object.fromEntries(
                  Object.entries(params)
                      .map(([key, value]) => [key, parsers?.[key] ? parsers[key]?.store(value) : null])
                      .filter(([, value]) => value !== null)
              )
            : {}
    ) as Record<string, string | string[]>;
}

function storeHash(hash?: string, hashValues?: string[]): string | undefined {
    if (hash && (hashValues?.includes(hash) || hashValues?.length === 0)) {
        return hash;
    }

    return undefined;
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

function parsePath<TKey extends string, TPathParsers extends Partial<Record<TKey, Parser<unknown>>>>(
    keys: TKey[],
    pathParams: Record<string, string | undefined>,
    parsers?: TPathParsers
): PartialByKey<PickWithFallback<RetrievedParams<TPathParsers>, TKey, string>, "*"> {
    if (keys.some((key) => typeof pathParams[key] !== "string" && key !== "*")) {
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

    return result as PartialByKey<PickWithFallback<RetrievedParams<TPathParsers>, TKey, string>, "*">;
}

function parseSearch<TSearchParsers extends Partial<Record<string, Parser<unknown, string | string[]>>>>(
    searchParams: URLSearchParams,
    parsers?: TSearchParsers
): Partial<RetrievedParams<TSearchParsers>> & RetrievedParams<PickParsersWithFallback<TSearchParsers>> {
    if (!parsers) {
        return {} as Partial<RetrievedParams<TSearchParsers>> &
            RetrievedParams<PickParsersWithFallback<TSearchParsers>>;
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
    ) as Partial<RetrievedParams<TSearchParsers>> & RetrievedParams<PickParsersWithFallback<TSearchParsers>>;
}

function parseHash(hash?: string, hashValues?: string[]): string | undefined {
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
