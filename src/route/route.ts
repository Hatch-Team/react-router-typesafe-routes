import { Parser, OriginalParams } from "../parser/parser";
import { generatePath } from "react-router";

type Route<TPath extends string, TPathParsers, TQueryParsers, TChildren> = {
    [TKey in keyof TChildren]: TChildren[TKey] extends Route<
        infer TChildPath,
        infer TChildPathParsers,
        infer TChildQueryParsers,
        infer TChildChildren
    >
        ? Route<
              `${TPath}/${TChildPath}`,
              TPathParsers & TChildPathParsers,
              TQueryParsers & TChildQueryParsers,
              TChildChildren
          >
        : never;
} & {
    path: TPath;
    build: (
        params: PickAnything<OriginalParams<TPathParsers>, ExtractRouteParams<TPath>>,
        searchParams?: Partial<OriginalParams<TQueryParsers>>
    ) => string;
};

type PickAnything<T, K extends string> = { [P in K]: P extends keyof T ? T[P] : string };

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

type DecoratedChildren<TChildren, TPath extends string, TPathParsers, TQueryParsers> = {
    [TKey in keyof TChildren]: TChildren[TKey] extends Route<
        infer TChildPath,
        infer TChildPathParsers,
        infer TChildQueryParsers,
        infer TChildChildren
    >
        ? Route<
              `${TPath}/${TChildPath}`,
              TPathParsers & TChildPathParsers,
              TQueryParsers & TChildQueryParsers,
              TChildChildren
          > &
              DecoratedChildren<TChildren[TKey], TPath, TPathParsers, TQueryParsers>
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

interface RouteOptions<TPathParsers, TQueryParsers, TChildren> {
    path?: TPathParsers;
    query?: TQueryParsers;
    children?: TChildren;
}

export function route<
    TPath extends string,
    TPathParsers extends Partial<Record<ExtractRouteParams<TPath>, Parser<any>>>,
    TQueryParsers extends Partial<Record<string, Parser<any, string | string[]>>>,
    TChildren
>(
    pathString: TPath,
    { path, children, query }: RouteOptions<TPathParsers, TQueryParsers, TChildren> = {}
): Route<TPath, TPathParsers, TQueryParsers, TChildren> {
    const decoratedChildren = children ? decorateChildren(children, pathString, path, query) : {};

    return {
        ...decoratedChildren,
        path: pathString,
        build(params) {
            return generatePath(pathString);
        },
    } as Route<TPath, TPathParsers, TQueryParsers, TChildren>;
}

function decorateChildren<TPath extends string, TPathParsers, TQueryParsers, TChildren>(
    children: TChildren,
    path: TPath,
    pathParsers: TPathParsers,
    queryParsers: TQueryParsers
): DecoratedChildren<TChildren, TPath, TPathParsers, TQueryParsers> {
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
    ) as DecoratedChildren<TChildren, TPath, TPathParsers, TQueryParsers>;
}

function isRoute(value: unknown): value is Route<any, any, any, any> {
    return Boolean(value && typeof value === "object" && "path" in value);
}
