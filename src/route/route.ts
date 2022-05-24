import { Parser } from "../parser/parser";
import { stringParser } from "../parser/stringParser";

type Route<TPath extends string, TPathParsers, TChildren> = {
    [TKey in keyof TChildren]: TChildren[TKey] extends Route<infer TChildPath, infer TChildParams, infer TChildChildren>
        ? Route<`${TPath}/${TChildPath}`, TPathParsers & TChildParams, TChildChildren>
        : never;
} & { path: TPath; build: (params: TPathParsers) => string };

type ForbidKeys<T, TKeys extends string> = T & { [key in TKeys]?: never };

type ExtractRouteParams<TPath extends string> = string extends TPath
    ? never
    : TPath extends `${infer TStart}:${infer TParam}/${infer TRest}`
    ? TParam | ExtractRouteParams<TRest>
    : TPath extends `${infer TStart}:${infer TParam}`
    ? TParam
    : TPath extends `${infer TStart}*`
    ? "*"
    : never;

export function route<
    TPath extends string,
    TPathParsers extends ForbidKeys<Record<string, Parser<any>>, "hash">,
    TQueryParsers extends ForbidKeys<Record<string, Parser<any>>, "hash" | ExtractRouteParams<TPath>>,
    TChildren
>(
    pathString: TPath,
    { path, children }: { path?: TPathParsers; query?: TQueryParsers; children?: TChildren } = {}
): Route<TPath, TPathParsers, TChildren> {
    const decoratedChildren = children
        ? Object.fromEntries(
              Object.entries(children).map(([key, child]) => [key, { ...child, path: `${pathString}/${child.path}` }])
          )
        : undefined;

    return {
        ...decoratedChildren,
        path: pathString,
        build(params: TPathParsers) {
            return "hi";
        },
    } as Route<TPath, TPathParsers, TChildren>;
}
