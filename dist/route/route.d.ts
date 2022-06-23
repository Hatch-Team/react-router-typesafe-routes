import { Parser, OriginalParams, RetrievedParams, PickParsersWithFallback, OmitParsersWithFallback } from "../parser";
import { NavigateOptions, Location } from "react-router";
declare type RouteWithChildren<TChildren, TPath extends string, TPathParsers, TSearchParsers, THash extends string[]> = DecoratedChildren<TChildren, TPath, TPathParsers, TSearchParsers, THash> & Route<TPath, TPathParsers, TSearchParsers, THash>;
declare type DecoratedChildren<TChildren, TPath extends string, TPathParsers, TSearchParsers, THash extends string[]> = {
    [TKey in keyof TChildren]: TChildren[TKey] extends RouteWithChildren<infer TChildChildren, infer TChildPath, infer TChildPathParsers, infer TChildQueryParsers, infer TChildHash> ? RouteWithChildren<TChildChildren, TPath extends "" ? TChildPath : TChildPath extends "" ? TPath : `${TPath}/${TChildPath}`, TPathParsers & TChildPathParsers, TSearchParsers & TChildQueryParsers, THash | TChildHash> : TChildren[TKey];
};
declare type InSearchParams<TSearchParsers> = Partial<OriginalParams<TSearchParsers>>;
declare type OutSearchParams<TSearchParsers> = Partial<RetrievedParams<TSearchParsers>> & RetrievedParams<PickParsersWithFallback<TSearchParsers>>;
declare type InParams<TKey extends string, TPathParsers> = PartialByKey<PickWithFallback<OriginalParams<TPathParsers>, TKey, string>, "*">;
declare type OutParams<TKey extends string, TPathParsers> = PartialByKey<PickWithFallback<RetrievedParams<TPathParsers>, TKey, string>, "*" extends keyof OmitParsersWithFallback<TPathParsers> ? "*" : "">;
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
    buildUrl: (params: InParams<ExtractRouteParams<TPath>, TPathParsers>, searchParams?: InSearchParams<TSearchParsers>, hash?: THash[number]) => string;
    buildRelativeUrl: (params: InParams<ExtractRouteParams<TPath>, TPathParsers>, searchParams?: InSearchParams<TSearchParsers>, hash?: THash[number]) => string;
    retrieveParams: (params: Record<string, string | undefined>) => OutParams<ExtractRouteParams<SanitizedPath<TPath>>, TPathParsers>;
    retrieveSearchParams: (searchParams: URLSearchParams) => OutSearchParams<TSearchParsers>;
    retrieveHash: (location: Location) => THash[number] | undefined;
    useParams: (params: Record<string, string | undefined>) => OutParams<ExtractRouteParams<SanitizedPath<TPath>>, TPathParsers>;
    useSearchParams: (hookResult: readonly [URLSearchParams, (params: URLSearchParams, options?: NavigateOptions) => void]) => readonly [
        OutSearchParams<TSearchParsers>,
        (params: InSearchParams<TSearchParsers>, navigateOptions?: NavigateOptions) => void
    ];
    useHash: (location: Location) => THash[number] | undefined;
    _originalOptions: RouteOptions<TPathParsers, TSearchParsers, THash>;
    _originalPath: TPath;
}
declare type PickWithFallback<T, K extends string, F> = {
    [P in K]: P extends keyof T ? T[P] : F;
};
declare type PartialByKey<T, K> = K extends keyof T ? Omit<T, K> & Partial<Pick<T, K>> : T;
declare type SanitizedPath<T> = T extends `/${string}` ? never : T extends `${string}/` ? never : T;
declare type PathWithoutIntermediateStars<T extends string> = T extends `${infer TStart}*/${infer TEnd}` ? PathWithoutIntermediateStars<`${TStart}${TEnd}`> : T;
declare type SanitizedChildren<T> = T extends Record<infer TKey, unknown> ? TKey extends string ? TKey extends Capitalize<TKey> ? T : never : T : T;
declare type ExtractRouteParams<TPath extends string> = string extends TPath ? never : TPath extends `${infer TStart}:${infer TParam}/${infer TRest}` ? TParam | ExtractRouteParams<TRest> : TPath extends `${infer TStart}:${infer TParam}` ? TParam : TPath extends `${infer TBefore}*${infer TAfter}` ? "*" : never;
interface RouteOptions<TPathParsers, TSearchParsers, THash> {
    params?: TPathParsers;
    searchParams?: TSearchParsers;
    hash?: THash;
}
declare function route<TChildren, TPath extends string = string, TPathParsers extends Partial<Record<ExtractRouteParams<SanitizedPath<TPath>>, Parser<any>>> = Record<never, never>, TSearchParsers extends Partial<Record<string, Parser<any, string | string[]>>> = Record<never, never>, THash extends string[] = never[]>(path: SanitizedPath<TPath>, options?: RouteOptions<TPathParsers, TSearchParsers, THash>, children?: SanitizedChildren<TChildren>): RouteWithChildren<TChildren, TPath, TPathParsers, TSearchParsers, THash>;
export { Route, RouteWithChildren, route };
