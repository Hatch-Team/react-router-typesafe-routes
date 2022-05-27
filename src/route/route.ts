import { Parser, OriginalParams } from "../parser/parser";
import { generatePath } from "react-router";

type Route<TPath extends string, TPathParsers, TQueryParsers, THash extends string, TChildren> = {
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
              TQueryParsers & TChildQueryParsers,
              THash | TChildHash,
              TChildChildren
          >
        : never;
} & {
    path: TPath;
    build: (
        params: PickAnything<OriginalParams<TPathParsers>, ExtractRouteParams<TPath>>,
        searchParams?: Partial<OriginalParams<TQueryParsers>>,
        hash?: THash
    ) => string;
};

type PickAnything<T, K extends string> = { [P in K]: P extends keyof T ? T[P] : string };

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

type DecoratedChildren<TChildren, TPath extends string, TPathParsers, THash extends string, TQueryParsers> = {
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
              TQueryParsers & TChildQueryParsers,
              THash | TChildHash,
              TChildChildren
          > &
              DecoratedChildren<TChildren[TKey], TPath, TPathParsers, THash, TQueryParsers>
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

interface RouteOptions<TPathParsers, TQueryParsers, THash, TChildren> {
    path?: TPathParsers;
    query?: TQueryParsers;
    children?: TChildren;
    hash?: THash;
}

export function route<
    TChildren,
    TPath extends string,
    TPathParsers extends Partial<Record<ExtractRouteParams<TPath>, Parser<any>>>,
    TQueryParsers extends Partial<Record<string, Parser<any, string | string[]>>>,
    THash extends string[] = never[]
>(
    pathString: TPath,
    { path, children, query, hash }: RouteOptions<TPathParsers, TQueryParsers, THash, TChildren> = {}
): Route<TPath, TPathParsers, TQueryParsers, THash[number], TChildren> {
    const decoratedChildren = children ? decorateChildren(children, pathString, path, query) : {};

    return {
        ...decoratedChildren,
        path: pathString,
        build(params) {
            return generatePath(pathString);
        },
    } as Route<TPath, TPathParsers, TQueryParsers, THash[number], TChildren>;
}

function decorateChildren<TPath extends string, TPathParsers, TQueryParsers, THash extends string, TChildren>(
    children: TChildren,
    path: TPath,
    pathParsers: TPathParsers,
    queryParsers: TQueryParsers
): DecoratedChildren<TChildren, TPath, TPathParsers, THash, TQueryParsers> {
    return Object.fromEntries(
        Object.entries(children).map(([key, value]) => [
            key,
            isRoute(value)
                ? {
                      ...decorateChildren(value, path, pathParsers, queryParsers),
                      path: `${path}/${value.path}`,
                      build: (params: any) => generatePath(`${path}/${value.path}`, params),
                  }
                : value,
        ])
    ) as DecoratedChildren<TChildren, TPath, TPathParsers, THash, TQueryParsers>;
}

function isRoute(value: unknown): value is Route<any, any, any, any, any> {
    return Boolean(value && typeof value === "object" && "path" in value);
}
