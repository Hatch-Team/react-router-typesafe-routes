import { route } from "./route";
import { generatePath } from "react-router";
import { stringParser } from "../parser/stringParser";

it("works", () => {
    const testRoute = route("test/:id", { path: { param: stringParser }, query: { idd: stringParser } });
    const fooRoute = route("foo", { path: { param2: stringParser }, children: { testRoute } });
    const barRoute = route("bar", { path: { param3: stringParser }, children: { fooRoute } });

    expect(barRoute.fooRoute.path).toEqual("bar/foo/test/:id");
});

it("generates", () => {
    const test = generatePath("foo/:bar", { bar: "1/2" });

    expect(test).toEqual("foo/1/2");
});
