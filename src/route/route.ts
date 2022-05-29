import { Parser, OriginalParams, RetrievedParams } from "../parser/parser";
import { generatePath, NavigateOptions, Location } from "react-router";
import { createSearchParams, useSearchParams } from "react-router-dom";

type Route<TPath extends string, TPathParsers, TSearchParsers, THash extends string[], TChildren> = {
    [TKey in keyof TChildren]: TChildren[TKey] extends Route<
        infer TChildPath,
        infer TChildPathParsers,
        infer TChildQueryParsers,
        infer TChildHash,
        infer TChildChildren
    >
        ? Route<
              TPath extends "" ? TChildPath : TChildPath extends "" ? TPath : `${TPath}/${TChildPath}`,
              TPathParsers & TChildPathParsers,
              TSearchParsers & TChildQueryParsers,
              THash | TChildHash,
              TChildChildren
          >
        : never;
} & RouteInterface<TPath, TPathParsers, TSearchParsers, THash>;

interface RouteInterface<TPath extends string, TPathParsers, TSearchParsers, THash extends string[]> {
    relativePath: PathWithoutIntermediateStars<TPath>;
    path: `/${TPath}`;
    buildUrl: (
        params: PartialByKey<PickWithFallback<OriginalParams<TPathParsers>, ExtractRouteParams<TPath>, string>, "*">,
        searchParams?: Partial<OriginalParams<TSearchParsers>>,
        hash?: THash[number]
    ) => string;
    parsePath: (
        params: Record<string, string | undefined>
    ) => PartialByKey<
        PickWithFallback<RetrievedParams<TPathParsers>, ExtractRouteParams<SanitizedPath<TPath>>, string>,
        "*"
    >;
    parseQuery: (
        hookResult: ReturnType<typeof useSearchParams>
    ) => [Partial<RetrievedParams<TSearchParsers>>, (params: Partial<OriginalParams<TSearchParsers>>) => void];
    parseHash: (location: Location) => THash[number] | undefined;
    originalOptions: RouteOptions<TPathParsers, TSearchParsers, THash> & { pathString: TPath };
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

type DecoratedChildren<TChildren, TPath extends string, TPathParsers, THash extends string[], TSearchParsers> = {
    [TKey in keyof TChildren]: TChildren[TKey] extends Route<
        infer TChildPath,
        infer TChildPathParsers,
        infer TChildQueryParsers,
        infer TChildHash,
        infer TChildChildren
    >
        ? Route<
              `${TPath}/${TChildPath}`,
              TPathParsers & TChildPathParsers,
              TSearchParsers & TChildQueryParsers,
              THash | TChildHash,
              TChildChildren
          > &
              DecoratedChildren<TChildren[TKey], TPath, TPathParsers, THash, TSearchParsers>
        : {};
};

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
    path?: TPathParsers;
    search?: TSearchParsers;
    hash?: THash;
}

interface RouteOptionsWithChildren<TPathParsers, TSearchParsers, THash, TChildren>
    extends RouteOptions<TPathParsers, TSearchParsers, THash> {
    children?: TChildren;
}

export function route<
    TChildren,
    TPath extends string = string,
    TPathParsers extends Partial<Record<ExtractRouteParams<SanitizedPath<TPath>>, Parser<any>>> = {},
    TSearchParsers extends Partial<Record<string, Parser<any, string | string[]>>> = {},
    THash extends string[] = never[]
>(
    pathString: SanitizedPath<TPath>,
    {
        path,
        children,
        search,
        hash,
    }: RouteOptionsWithChildren<TPathParsers, TSearchParsers, THash, SanitizedChildren<TChildren>> = {}
): Route<TPath, TPathParsers, TSearchParsers, THash, TChildren> {
    const decoratedChildren = children ? decorateChildren(children, pathString, path, search, hash) : {};

    return {
        ...decoratedChildren,
        ...createRoute(pathString, { path, search, hash }),
    } as Route<TPath, TPathParsers, TSearchParsers, THash, TChildren>;
}

function decorateChildren<TPath extends string, TPathParsers, TSearchParsers, THash extends string[], TChildren>(
    children: TChildren,
    path: SanitizedPath<TPath>,
    pathParsers?: TPathParsers,
    searchParsers?: TSearchParsers,
    hash?: THash
): DecoratedChildren<TChildren, TPath, TPathParsers, THash, TSearchParsers> {
    return Object.fromEntries(
        Object.entries(children).map(([key, value]) => [
            key,
            isRoute(value)
                ? {
                      ...decorateChildren(value, path, pathParsers, searchParsers, hash),
                      ...createRoute(
                          (path === ""
                              ? value.originalOptions.pathString
                              : value.originalOptions.pathString === ""
                              ? path
                              : `${path}/${value.originalOptions.pathString}`) as SanitizedPath<any>,
                          {
                              path: { ...pathParsers, ...value.originalOptions.path },
                              search: { ...searchParsers, ...value.originalOptions.search },
                              hash: mergeHashValues(hash, value.originalOptions.hash as string[] | undefined),
                          }
                      ),
                  }
                : value,
        ])
    ) as DecoratedChildren<TChildren, TPath, TPathParsers, THash, TSearchParsers>;
}

function isRoute(value: unknown): value is Route<any, any, any, any, any> {
    return Boolean(value && typeof value === "object" && "originalOptions" in value);
}

function createRoute<
    TPath extends string,
    TPathParsers extends Partial<Record<ExtractRouteParams<SanitizedPath<TPath>>, Parser<any>>> = {},
    TSearchParsers extends Partial<Record<string, Parser<any, string | string[]>>> = {},
    THash extends string[] = never[]
>(
    path: SanitizedPath<TPath>,
    options: RouteOptions<TPathParsers, TSearchParsers, THash>
): RouteInterface<TPath, TPathParsers, TSearchParsers, THash> {
    const keys = getKeys(path);
    const pathWithoutIntermediateStars = removeIntermediateStars(path);

    return {
        relativePath: pathWithoutIntermediateStars,
        path: `/${path}`,
        originalOptions: { ...options, pathString: path },
        buildUrl: (params, searchParams, hash) => {
            const storedPathParams = storePathParams(keys, params, options.path);
            const storedSearchParams = storeSearchParams(searchParams, options.search);
            const storedHash = storeHash(hash, options.hash);

            const pathString = generatePath(pathWithoutIntermediateStars, storedPathParams);
            const searchString = createSearchParams(storedSearchParams).toString();

            return `/${pathString}${searchString ? `?${searchString}` : ""}${
                storedHash !== null ? `#${storedHash}` : ""
            }`;
        },
        parsePath: (params) => {
            return parsePath(keys, params, options.path);
        },
        parseQuery: ([urlSearchParams, setUrlSearchParams]) => {
            return [
                parseSearch(urlSearchParams, options.search),
                (params?: Partial<OriginalParams<TSearchParsers>>, navigateOptions?: NavigateOptions) => {
                    setUrlSearchParams(storeSearchParams(params, options.search), navigateOptions);
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
    );
}

function storeSearchParams(
    params?: Record<string, unknown>,
    parsers?: Partial<Record<string, Parser<unknown, string | string[]>>>
): Record<string, string | string[]> {
    return params
        ? Object.fromEntries(
              Object.entries(params)
                  .map(([key, value]) => [key, parsers?.[key] ? parsers[key]?.store(value) : null])
                  .filter(([, value]) => value !== null)
          )
        : {};
}

function storeHash(hash?: string, hashValues?: string[]): string | null {
    if (hash && (hashValues?.includes(hash) || hashValues?.length === 0)) {
        return hash;
    }

    return null;
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

function parsePath<TKey extends string, TPathParsers extends Partial<Record<TKey, Parser<string>>>>(
    keys: TKey[],
    pathParams: Record<string, string | undefined>,
    parsers?: TPathParsers
): PartialByKey<PickWithFallback<RetrievedParams<TPathParsers>, TKey, string>, "*"> {
    if (keys.some((key) => typeof pathParams[key] !== "string" && key !== "*")) {
        throw new Error("Insufficient params");
    }

    let result: Record<string, unknown> = {};

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
): Partial<RetrievedParams<TSearchParsers>> {
    if (!parsers) {
        return {};
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
    );
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
