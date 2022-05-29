import { route } from "./route";
import { numberParser, booleanParser, arrayOfParser } from "../parser/stringParser";
import { hashValues } from "./hashValues";

it("provides absolute path", () => {
    const GRANDCHILD = route("grand");
    const CHILD = route("child", { children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.path).toEqual("/test");
    expect(TEST_ROUTE.CHILD.path).toEqual("/test/child");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.path).toEqual("/test/child/grand");
});

it("preserves intermediate stars in absolute path", () => {
    const GRANDCHILD = route("grand");
    const CHILD = route("child/*", { children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.path).toEqual("/test");
    expect(TEST_ROUTE.CHILD.path).toEqual("/test/child/*");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.path).toEqual("/test/child/*/grand");
});

it("provides relative path", () => {
    const GRANDCHILD = route("grand");
    const CHILD = route("child", { children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.relativePath).toEqual("test");
    expect(TEST_ROUTE.CHILD.relativePath).toEqual("test/child");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.relativePath).toEqual("test/child/grand");
});

it("removes intermediate stars from relative path", () => {
    const GRANDCHILD = route("grand");
    const CHILD = route("child/*", { children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.relativePath).toEqual("test");
    expect(TEST_ROUTE.CHILD.relativePath).toEqual("test/child/*");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.relativePath).toEqual("test/child/grand");
});

it("allows empty segment at the beginning of the route", () => {
    const GRANDCHILD = route("grand");
    const CHILD = route("child", { children: { GRANDCHILD } });
    const TEST_ROUTE = route("", { children: { CHILD } });

    expect(TEST_ROUTE.path).toEqual("/");
    expect(TEST_ROUTE.CHILD.path).toEqual("/child");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.path).toEqual("/child/grand");

    expect(TEST_ROUTE.relativePath).toEqual("");
    expect(TEST_ROUTE.CHILD.relativePath).toEqual("child");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.relativePath).toEqual("child/grand");
});

it("allows empty segment in the middle of the route", () => {
    const GRANDCHILD = route("grand");
    const CHILD = route("", { children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.path).toEqual("/test");
    expect(TEST_ROUTE.CHILD.path).toEqual("/test");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.path).toEqual("/test/grand");

    expect(TEST_ROUTE.relativePath).toEqual("test");
    expect(TEST_ROUTE.CHILD.relativePath).toEqual("test");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.relativePath).toEqual("test/grand");
});

it("allows empty segment at the end of the route", () => {
    const GRANDCHILD = route("");
    const CHILD = route("child", { children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.path).toEqual("/test");
    expect(TEST_ROUTE.CHILD.path).toEqual("/test/child");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.path).toEqual("/test/child");

    expect(TEST_ROUTE.relativePath).toEqual("test");
    expect(TEST_ROUTE.CHILD.relativePath).toEqual("test/child");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.relativePath).toEqual("test/child");
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

it("allows star path param in the middle of combined path", () => {
    const GRANDCHILD = route("grand", {});
    const CHILD = route("child/*", { children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.buildUrl({ "*": "foo" })).toEqual("/test");
    expect(TEST_ROUTE.CHILD.buildUrl({ "*": "foo" })).toEqual("/test/child/foo");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.buildUrl({ "*": "foo" })).toEqual("/test/child/grand");
});

it("allows search params", () => {
    const GRANDCHILD = route("grand", { search: { foo: numberParser } });
    const CHILD = route("child", { children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.buildUrl({}, {})).toEqual("/test");
    expect(TEST_ROUTE.CHILD.buildUrl({}, {})).toEqual("/test/child");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.buildUrl({}, { foo: 1 })).toEqual("/test/child/grand?foo=1");
});

it("allows to mix search params across multiple routes", () => {
    const GRANDCHILD = route("grand", { search: { foo: numberParser } });
    const CHILD = route("child", { search: { bar: arrayOfParser(numberParser) }, children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.buildUrl({}, {})).toEqual("/test");
    expect(TEST_ROUTE.CHILD.buildUrl({}, { bar: [1, 2] })).toEqual("/test/child?bar=1&bar=2");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.buildUrl({}, { foo: 1, bar: [1, 2] })).toEqual(
        "/test/child/grand?foo=1&bar=1&bar=2"
    );
});

it("prioritizes children when mixing search params with the same name", () => {
    const GRANDCHILD = route("grand", { search: { foo: numberParser } });
    const CHILD = route("child", { search: { foo: arrayOfParser(numberParser) }, children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.buildUrl({}, {})).toEqual("/test");
    expect(TEST_ROUTE.CHILD.buildUrl({}, { foo: [1, 2] })).toEqual("/test/child?foo=1&foo=2");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.buildUrl({}, { foo: 1 })).toEqual("/test/child/grand?foo=1");
});

it("allows implicit hash params", () => {
    const GRANDCHILD = route("grand", { hash: hashValues() });
    const CHILD = route("child", { children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.buildUrl({}, {})).toEqual("/test");
    expect(TEST_ROUTE.CHILD.buildUrl({}, {})).toEqual("/test/child");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.buildUrl({}, {}, "my-id")).toEqual("/test/child/grand#my-id");
});

it("allows explicit hash params", () => {
    const GRANDCHILD = route("grand", { hash: hashValues("foo", "bar") });
    const CHILD = route("child", { children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.buildUrl({}, {})).toEqual("/test");
    expect(TEST_ROUTE.CHILD.buildUrl({}, {})).toEqual("/test/child");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.buildUrl({}, {}, "foo")).toEqual("/test/child/grand#foo");
});

it("allows mixing explicit hash params across multiple routes", () => {
    const GRANDCHILD = route("grand", { hash: hashValues("foo", "bar") });
    const CHILD = route("child", { hash: hashValues("baz"), children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.buildUrl({}, {})).toEqual("/test");
    expect(TEST_ROUTE.CHILD.buildUrl({}, {}, "baz")).toEqual("/test/child#baz");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.buildUrl({}, {}, "baz")).toEqual("/test/child/grand#baz");
});

it("allows mixing explicit and implicit hash params across multiple routes", () => {
    const GRANDCHILD = route("grand", { hash: hashValues() });
    const CHILD = route("child", { hash: hashValues("baz"), children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.buildUrl({}, {})).toEqual("/test");
    expect(TEST_ROUTE.CHILD.buildUrl({}, {}, "baz")).toEqual("/test/child#baz");
    expect(TEST_ROUTE.CHILD.GRANDCHILD.buildUrl({}, {}, "anything")).toEqual("/test/child/grand#anything");
});

it("allows implicit path params parsing", () => {
    const GRANDCHILD = route("grand/:id", {});
    const CHILD = route("child", { children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.parsePath({})).toEqual({});
    expect(TEST_ROUTE.CHILD.parsePath({})).toEqual({});
    expect(TEST_ROUTE.CHILD.GRANDCHILD.parsePath({ id: "1" })).toEqual({ id: "1" });
});

it("allows explicit path params parsing", () => {
    const GRANDCHILD = route("grand/:id", { path: { id: numberParser } });
    const CHILD = route("child", { children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.parsePath({ id: "1" })).toEqual({});
    expect(TEST_ROUTE.CHILD.parsePath({ id: "1" })).toEqual({});
    expect(TEST_ROUTE.CHILD.GRANDCHILD.parsePath({ id: "1" })).toEqual({ id: 1 });
});

it("allows to mix path params parsing across multiple routes", () => {
    const GRANDCHILD = route("grand/:id", { path: { id: numberParser } });
    const CHILD = route("child/:childId", { path: { childId: numberParser }, children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.parsePath({ id: "1", childId: "2" })).toEqual({});
    expect(TEST_ROUTE.CHILD.parsePath({ id: "1", childId: "2" })).toEqual({ childId: 2 });
    expect(TEST_ROUTE.CHILD.GRANDCHILD.parsePath({ id: "1", childId: "2" })).toEqual({ id: 1, childId: 2 });
});

it("throws if required path params are invalid", () => {
    const GRANDCHILD = route("grand/:id", { path: { id: numberParser } });
    const CHILD = route("child/:childId", { path: { childId: numberParser }, children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.parsePath({ id: "foo", childId: "2" })).toEqual({});
    expect(TEST_ROUTE.CHILD.parsePath({ id: "foo", childId: "2" })).toEqual({ childId: 2 });
    expect(() => TEST_ROUTE.CHILD.GRANDCHILD.parsePath({ id: "foo", childId: "2" })).toThrow();
});

it("allows implicit star path param parsing", () => {
    const GRANDCHILD = route("grand/*", {});
    const CHILD = route("child", { children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.parsePath({ "*": "foo/bar" })).toEqual({});
    expect(TEST_ROUTE.CHILD.parsePath({ "*": "foo/bar" })).toEqual({});
    expect(TEST_ROUTE.CHILD.GRANDCHILD.parsePath({ "*": "foo/bar" })).toEqual({ "*": "foo/bar" });
});

it("allows explicit star path param parsing", () => {
    const GRANDCHILD = route("grand/*", { path: { "*": numberParser } });
    const CHILD = route("child", { children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.parsePath({ "*": "1" })).toEqual({});
    expect(TEST_ROUTE.CHILD.parsePath({ "*": "1" })).toEqual({});
    expect(TEST_ROUTE.CHILD.GRANDCHILD.parsePath({ "*": "1" })).toEqual({ "*": 1 });
});

it("silently omits invalid star path param", () => {
    const GRANDCHILD = route("grand/*", { path: { "*": numberParser } });
    const CHILD = route("child", { children: { GRANDCHILD } });
    const TEST_ROUTE = route("test", { children: { CHILD } });

    expect(TEST_ROUTE.parsePath({ "*": "foo" })).toEqual({});
    expect(TEST_ROUTE.CHILD.parsePath({ "*": "foo" })).toEqual({});
    expect(TEST_ROUTE.CHILD.GRANDCHILD.parsePath({ "*": "foo" })).toEqual({});
});
