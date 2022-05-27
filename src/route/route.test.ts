import { route } from "./route";
import { generatePath } from "react-router";
import { stringParser, numberParser, arrayOfParser } from "../parser/stringParser";
import { hashValues } from "./hashValues";

it("works", () => {
    const testRoute = route("test/:id", {
        path: { id: numberParser },
        hash: hashValues(),
        query: { idi: arrayOfParser(numberParser) },
    });
    const fooRoute = route("foo", { children: { testRoute } });
    const barRoute = route("bar", { children: { fooRoute } });

    expect(barRoute.fooRoute.testRoute.path).toEqual("bar/foo/test/:id");
    expect(barRoute.fooRoute.testRoute.build({ id: 1 }, { idi: [1] }, "123")).toEqual("bar/foo/test/1");
});

it("generates", () => {
    const test = generatePath("foo/:bar", { bar: "1/2" });

    expect(test).toEqual("foo/1/2");
});
