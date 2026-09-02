export type EnvironmentSource = Readonly<Record<string, string | undefined>>;

export interface EnvironmentRule<T> {
  readonly parse: (value: string | undefined, key: string) => T;
}

export type EnvironmentSchema = Readonly<Record<string, EnvironmentRule<unknown>>>;

export type InferEnvironment<TSchema extends EnvironmentSchema> = {
  readonly [TKey in keyof TSchema]: TSchema[TKey] extends EnvironmentRule<infer TValue>
    ? TValue
    : never;
};

export class EnvironmentValidationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Invalid environment configuration:\n- ${issues.join("\n- ")}`);
    this.name = "EnvironmentValidationError";
    this.issues = issues;
  }
}

function requiredValue(value: string | undefined, key: string): string {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(`${key} is required`);
  }

  return normalized;
}

export function stringValue(): EnvironmentRule<string> {
  return {
    parse: requiredValue,
  };
}

export function urlValue(options: { readonly protocols?: readonly string[] } = {}): EnvironmentRule<URL> {
  return {
    parse(value, key) {
      const normalized = requiredValue(value, key);
      let parsed: URL;

      try {
        parsed = new URL(normalized);
      } catch {
        throw new Error(`${key} must be a valid absolute URL`);
      }

      if (options.protocols && !options.protocols.includes(parsed.protocol)) {
        throw new Error(`${key} must use one of: ${options.protocols.join(", ")}`);
      }

      return parsed;
    },
  };
}

export function integerValue(
  options: { readonly min?: number; readonly max?: number } = {},
): EnvironmentRule<number> {
  return {
    parse(value, key) {
      const normalized = requiredValue(value, key);
      const parsed = Number(normalized);

      if (!Number.isSafeInteger(parsed)) {
        throw new Error(`${key} must be a safe integer`);
      }

      if (options.min !== undefined && parsed < options.min) {
        throw new Error(`${key} must be at least ${options.min}`);
      }

      if (options.max !== undefined && parsed > options.max) {
        throw new Error(`${key} must be at most ${options.max}`);
      }

      return parsed;
    },
  };
}

export function enumValue<const TValues extends readonly [string, ...string[]]>(
  values: TValues,
): EnvironmentRule<TValues[number]> {
  return {
    parse(value, key) {
      const normalized = requiredValue(value, key);

      if (!values.includes(normalized)) {
        throw new Error(`${key} must be one of: ${values.join(", ")}`);
      }

      return normalized;
    },
  };
}

export function optional<TValue>(rule: EnvironmentRule<TValue>): EnvironmentRule<TValue | undefined> {
  return {
    parse(value, key) {
      return value === undefined || value.trim() === "" ? undefined : rule.parse(value, key);
    },
  };
}

export function withDefault<TValue>(
  rule: EnvironmentRule<TValue>,
  fallback: TValue,
): EnvironmentRule<TValue> {
  return {
    parse(value, key) {
      return value === undefined || value.trim() === "" ? fallback : rule.parse(value, key);
    },
  };
}

export function loadEnvironment<const TSchema extends EnvironmentSchema>(
  schema: TSchema,
  source: EnvironmentSource,
): Readonly<InferEnvironment<TSchema>> {
  const result: Record<string, unknown> = {};
  const issues: string[] = [];

  for (const key of Object.keys(schema)) {
    const rule = schema[key];

    if (!rule) {
      continue;
    }

    try {
      result[key] = rule.parse(source[key], key);
    } catch (error) {
      issues.push(error instanceof Error ? error.message : `${key} is invalid`);
    }
  }

  if (issues.length > 0) {
    throw new EnvironmentValidationError(issues);
  }

  return Object.freeze(result) as Readonly<InferEnvironment<TSchema>>;
}
