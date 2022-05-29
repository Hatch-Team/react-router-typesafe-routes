# React-Router-Typesafe-Routes

Comprehensive type-safe routes for react-router v6 with first-class support of nested routes.

[![npm](https://img.shields.io/npm/v/react-router-typesafe-routes)](https://www.npmjs.com/package/react-router-typesafe-routes)

> ⚠ The library is under active development to support react-router v6. For react-router v5, see [v0.3.1](https://www.npmjs.com/package/react-router-typesafe-routes/v/0.3.1).

The library provides extensible type safety for path params, search params, and hash on building and parsing URLs, including nested routes.

> ⚠ Support for state is a work-in-progress.

## Installation

> ⚠ Support for React Native is a work-in-progress.

```
yarn add react-router-typesafe-routes
```

Note that the library is using ES6, including ES6 modules. It's designed to be processed by some bundler like Webpack.

## Design principles

-   Mess with react-router API as little as possible.
-   No unsafe type casts.
-   Extensibility to allow better typing and/or validation.
-   Completeness: cover every aspect of the URL.

## How is it different from existing solutions?

-   [typesafe-routes](https://www.npmjs.com/package/typesafe-routes) (as well as seemingly based on it [react-typesafe-routes](https://www.npmjs.com/package/react-typesafe-routes)) only handles path and query params. It wasn't developed with modern react-router in mind and therefore doesn't play well with it.

-   [typesafe-react-router](https://www.npmjs.com/package/typesafe-react-router) only handles path params and has no concept of nested routes.

-   The solution described at [Type-Safe Usage of React Router](https://dev.to/0916dhkim/type-safe-usage-of-react-router-5c44) only cares about path params and also has no concept of nested routes.

-   There is also [type-route](https://www.npmjs.com/package/type-route), but it's still in beta. It's also a separate routing library.

## Quick usage example

Route definition may look like this:

```typescript
import { route, numberParser, hashValues } from "react-router-typesafe-routes";

const ROUTES = {
    PRODUCT: route("product/:id", {
        search: { age: numberParser },
        hash: hashValues("about", "more"),
        children: { DETAILS: route("details") },
    }),
};
```

Use `Route` components as usual:

```typescript jsx
import { Route } from "react-router";
import { ROUTES } from "./path/to/routes";

<Routes>
    <Route path={ROUTES.PRODUCT.path} element={<Product />}>
        <Route path={ROUTES.PRODUCT.DETAILS.path} element={<ProductDetails />} />
    </Route>
</Routes>;
```

Use `Link` components as usual:

```typescript jsx
import { Link } from "react-router-dom";
import { ROUTES } from "./path/to/routes";

// Everything is fully typed!
<Link to={ROUTES.PRODUCT.DETAILS.buildUrl({ id: "1" }, { age: 12 }, "about")}>/product/1/details?age=12#about</Link>;
```

Parse path params with `useParams()`:

```typescript jsx
import { useParams } from "react-router";
import { ROUTES } from "./path/to/routes";

// Everything is fully typed!
const { id } = ROUTES.PRODUCT.DETAILS.parsePath(useParams());
```

Parse query params with `useSearchParams()`:

```typescript jsx
import { useSearchParams } from "react-router";
import { ROUTES } from "./path/to/routes";

// Everything is fully typed!
const [{ age }, setSearchParams] = ROUTES.PRODUCT.DETAILS.parseSearch(useSearchParams());
```

Parse hash with `useLocation()`:

```typescript jsx
import { useLocation } from "react-router";
import { ROUTES } from "./path/to/routes";

// Everything is fully typed!
const hash = ROUTES.PRODUCT.DETAILS.parseHash(useLocation());
```

## Concepts

### Nesting

Any route can be a child of another route:

```typescript
const DETAILS = route("details");

const PRODUCT = route("product/:id", { children: { DETAILS } });
```

It's important to understand that `DETAILS` and `PRODUCT.DETAILS` are separate routes, which may behave differently. `DETAILS` doesn't know anything about `PRODUCT`, but `PRODUCT.DETAILS` does. In `PRODUCT.DETAILS`, `DETAILS` can be referred to as a child of `PRODUCT`.

### What `path` values are allowed

The `path` argument provided to the `route` helper is what you would put to the `path` property of a `<Route/>`, but without leading or trailing slashes (`/`). More specifically, it can:

-   be a simple segment or a group of segments (`'product'`, `'product/details'`).
-   have any number of parameters anywhere (`':id/product'`, `'product/:id/more'`).
-   **end** with a star (`'product/:id/*'`, `'*'`)
-   be an empty string (`''`).

### How params work

Params typing and validation is done via parsers.

Here is an interface of a parser:

```typescript
export interface Parser<TOriginal, TStored = string, TRetrieved = TOriginal> {
    store: (value: TOriginal) => TStored;
    retrieve: (value: unknown) => TRetrieved;
    isArray?: boolean;
}
```

-   `TOriginal` is what you want to store (in path or search string) and `TRetrieved` is what you will get back. They are different to support cases such as "number in - string out".

-   `TStored` is how your value is stored. It's typically `string`, but can also be `string[]` for arrays in search string.

-   `isArray` is a helper flag specific for `URLSearchParams`, so we know when to `.get()` and when to `.getAll()`.

If `retrieve()` fails to retrieve the value, it throws. To avoid that in case of built-in parsers, you can call the parser to get its fail-proof version. Such a parser will return the specified fallback in case of an error.

The library provides the `withFallback()` helper for custom parsers to achieve the same functionality.

#### Path params

Path params are inferred from the provided `path` and can be overridden (partially or completely) with path parsers. Inferred params won't use any parser at all.

All path params are required, except for the star (`*`) parameter. That is, if the star parameter parser throws during the retrieving, the star parameter will simply be omitted.

#### Search params

Search params are determined by the provided search parsers.

All search parameters are optional. That is, if such a parser throws during the retrieving, the corresponding value is simply omitted.

#### Hash

Hash doesn't use any parsers. Instead, you can specify the allowed values, or specify that any `string` is allowed. By default, nothing is allowed as a hash value (otherwise, nesting of hash values wouldn't work).

### How params work for nested routes

Child routes implicitly have all parameters of their ancestors. For parameters with the same name, child parsers take precedence.

Note that a parent path parser will take precedence of an implicit child path param.

Hash values are combined. If a parent allows any `string` to be a hash value, its children can't override that.

## API

### `route`

A route is defined via the `route` helper. It accepts required `path` and optional `options`.

```typescript
const ROUTE = route("my/path", {
    path: { pathParam: stringParser },
    search: { searchParam: stringParser },
    hash: hashValues("value"),
    children: { CHILD_ROUTE },
});
```

Options let you provide parsers and hash values for typing and validation, as well as child routes. Everything is optional here.
