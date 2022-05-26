import { route, stringParser } from "typesafe-routes";

const accountRoute = route(
    "/account/:accountId",
    {
        accountId: stringParser, // parser implicitly defines the type (string) of 'accountId'
        accountIdd: stringParser, // parser implicitly defines the type (string) of 'accountId'
    },
    {}
);

accountRoute({ accountId: "1" });
