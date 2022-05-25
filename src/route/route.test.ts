import { route } from "./route";
import { generatePath } from "react-router";
import { stringParser } from "../parser/stringParser";

it("works", () => {
    const testRoute = route("test/:id", { path: { id: stringParser }, query: { idi: stringParser } });
    const fooRoute = route("foo", { children: { testRoute } });
    const barRoute = route("bar", { children: { fooRoute } });

    expect(barRoute.fooRoute.testRoute.path).toEqual("bar/foo/test/:id");
    expect(barRoute.fooRoute.testRoute.build({ id: "1" })).toEqual("bar/foo/test/1");
});

it("generates", () => {
    const test = generatePath("foo/:bar", { bar: "1/2" });

    expect(test).toEqual("foo/1/2");
});
