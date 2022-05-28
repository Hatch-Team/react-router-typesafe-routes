import { route } from "./route";
import { numberParser, booleanParser } from "../parser/stringParser";

it("provides relative path", () => {
    const GRANDCHILD = route("grand");
    const CHILD = route("child", { children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.relativePath).toEqual("test");
    expect(TEST_ROUTE.CHILD.relativePath).toEqual("test/child");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.relativePath).toEqual("test/child/grand");
});

it("provides absolute path", () => {
    const GRANDCHILD = route("grand");
    const CHILD = route("child", { children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.path).toEqual("/test");
    expect(TEST_ROUTE.CHILD.path).toEqual("/test/child");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.path).toEqual("/test/child/grand");
});

it("allows implicit path params", () => {
    const GRANDCHILD = route("grand");
    const CHILD = route("child/:id", { children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.buildUrl({})).toEqual("/test");
    expect(TEST_ROUTE.CHILD.buildUrl({ id: "42" })).toEqual("/test/child/42");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.buildUrl({ id: "24" })).toEqual("/test/child/24/grand");
});

it("allows explicit path params", () => {
    const GRANDCHILD = route("grand");
    const CHILD = route("child/:id", { path: { id: numberParser }, children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.buildUrl({})).toEqual("/test");
    expect(TEST_ROUTE.CHILD.buildUrl({ id: 42 })).toEqual("/test/child/42");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.buildUrl({ id: 24 })).toEqual("/test/child/24/grand");
});

it("allows to mix explicit and implicit path params", () => {
    const GRANDCHILD = route("grand");
    const CHILD = route("child/:id/:value", { path: { id: numberParser }, children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.buildUrl({})).toEqual("/test");
    expect(TEST_ROUTE.CHILD.buildUrl({ id: 42, value: "foo" })).toEqual("/test/child/42/foo");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.buildUrl({ id: 24, value: "bar" })).toEqual("/test/child/24/bar/grand");
});

it("allows to mix explicit and implicit path params across multiple routes", () => {
    const GRANDCHILD = route("grand/:name");
    const CHILD = route("child/:id/:value", { path: { id: numberParser }, children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.buildUrl({})).toEqual("/test");
    expect(TEST_ROUTE.CHILD.buildUrl({ id: 42, value: "foo" })).toEqual("/test/child/42/foo");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.buildUrl({ id: 24, value: "bar", name: "baz" })).toEqual(
        "/test/child/24/bar/grand/baz"
    );
});

it("prioritizes children when mixing path params with the same name", () => {
    const GRANDCHILD = route("grand/:id", { path: { id: booleanParser } });
    const CHILD = route("child/:id/:value", { path: { id: numberParser }, children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.buildUrl({})).toEqual("/test");
    expect(TEST_ROUTE.CHILD.buildUrl({ id: 42, value: "foo" })).toEqual("/test/child/42/foo");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.buildUrl({ id: false, value: "bar" })).toEqual(
        "/test/child/false/bar/grand/false"
    );
});

it("allows implicit star path param", () => {
    const GRANDCHILD = route("grand/*");
    const CHILD = route("child", { children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.buildUrl({})).toEqual("/test");
    expect(TEST_ROUTE.CHILD.buildUrl({})).toEqual("/test/child");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.buildUrl({ "*": "star/param" })).toEqual("/test/child/grand/star/param");
});

it("allows explicit star path param", () => {
    const GRANDCHILD = route("grand/*", { path: { "*": numberParser } });
    const CHILD = route("child", { children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.buildUrl({})).toEqual("/test");
    expect(TEST_ROUTE.CHILD.buildUrl({})).toEqual("/test/child");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.buildUrl({ "*": 42 })).toEqual("/test/child/grand/42");
});

it("allows star path param to be optional", () => {
    const GRANDCHILD = route("grand/*", { path: { "*": numberParser } });
    const CHILD = route("child", { children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.buildUrl({})).toEqual("/test");
    expect(TEST_ROUTE.CHILD.buildUrl({})).toEqual("/test/child");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.buildUrl({})).toEqual("/test/child/grand");
});
