import { Parser, OriginalParams } from "../parser/parser";
import { generatePath } from "react-router";
import { createSearchParams } from "react-router-dom";

type Route<TPath extends string, TPathParsers, TSearchParsers, THash extends string[], TChildren> = {
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
          >
        : never;
} & RouteInterface<TPath, TPathParsers, TSearchParsers, THash>;

interface RouteInterface<TPath extends string, TPathParsers, TSearchParsers, THash extends string[]> {
    relativePath: TPath;
    path: `/${TPath}`;
    buildUrl: (
        params: PartialByKey<PickWithFallback<OriginalParams<TPathParsers>, ExtractRouteParams<TPath>, string>, "*">,
        searchParams?: Partial<OriginalParams<TSearchParsers>>,
        hash?: THash[number]
    ) => string;
    originalOptions: RouteOptions<TPathParsers, TSearchParsers, THash>;
}

type PickWithFallback<T, K extends string, F> = { [P in K]: P extends keyof T ? T[P] : F };

type PartialByKey<T, K> = K extends keyof T ? Omit<T, K> & Partial<Pick<T, K>> : T;

type SanitizedPath<T> = T extends `/${string}` ? never : T extends `${string}/` ? never : T;

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
    : TPath extends `${infer TStart}*`
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
    TPathParsers extends Partial<Record<ExtractRouteParams<TPath>, Parser<any>>> = {},
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
                      ...createRoute(`${path}/${value.relativePath}` as SanitizedPath<any>, {
                          path: { ...pathParsers, ...value.originalOptions.path },
                          search: { ...searchParsers, ...value.originalOptions.search },
                          hash: mergeHashValues(hash, value.originalOptions.hash as string[] | undefined),
                      }),
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
    TPathParsers extends Partial<Record<ExtractRouteParams<TPath>, Parser<any>>> = {},
    TSearchParsers extends Partial<Record<string, Parser<any, string | string[]>>> = {},
    THash extends string[] = never[]
>(
    path: SanitizedPath<TPath>,
    options: RouteOptions<TPathParsers, TSearchParsers, THash>
): RouteInterface<TPath, TPathParsers, TSearchParsers, THash> {
    return {
        relativePath: path,
        path: `/${path}`,
        originalOptions: options,
        buildUrl: (params, searchParams, hash) => {
            const storedPathParams = storePathParams(params, options.path);
            const storedSearchParams = storeSearchParams(searchParams, options.search);
            const storedHash = storeHash(hash, options.hash);

            const pathString = generatePath(path, storedPathParams);
            const searchString = createSearchParams(storedSearchParams).toString();

            return `/${pathString}${searchString ? `?${searchString}` : ""}${
                storedHash !== null ? `#${storedHash}` : ""
            }`;
        },
    };
}

function storePathParams(
    params: Record<string, unknown>,
    parsers?: Partial<Record<string, Parser<unknown, string>>>
): Record<string, string> {
    return Object.fromEntries(
        Object.entries(params)
            .map(([key, value]) => [
                key,
                parsers?.[key] ? parsers[key]?.store(value) : typeof value === "string" ? value : null,
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
