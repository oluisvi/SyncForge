# `@syncforge/config`

Shared primitives for validating application environment variables at startup.

Each application owns its schema and passes its environment source explicitly:

```ts
import { enumValue, loadEnvironment, urlValue, withDefault } from "@syncforge/config";

const schema = {
  NODE_ENV: withDefault(enumValue(["development", "test", "production"]), "development"),
  PUBLIC_API_URL: urlValue({ protocols: ["http:", "https:"] }),
};

export const config = loadEnvironment(schema, process.env);
```

Keep server-only variables in server application schemas. Only variables explicitly intended for browser exposure may use a public framework prefix such as `NEXT_PUBLIC_`.

Validation errors list variable names and constraints but never include supplied values, which may contain secrets.
