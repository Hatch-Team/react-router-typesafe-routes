type RouteDummy<TParams extends Record<string, unknown>, TChildren> = {
    (params: TParams): TChildren extends Record<string, RouteDummy<infer U, infer C>> ? TChildren : string;
};

function route<TParams extends Record<string, unknown>, TChildren>(
    path: string,
    params: TParams,
    children: TChildren
): RouteDummy<TParams, TChildren> {
    const fn = ((params: TParams) => {
        return typeof children === "object" ? children : "nope";
    }) as RouteDummy<TParams, TChildren>;

    return fn;
}

const a = new URLSearchParams();

export { route };
