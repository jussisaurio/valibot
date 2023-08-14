import { type Issue, type Issues, ValiError } from '../../error/index.ts';
import { notOk, type BaseSchema, type Input, type Output, ok } from '../../types.ts';
import { getIssue } from '../../utils/index.ts';

/**
 * Union options type.
 */
export type UnionOptions = [
  BaseSchema<any>,
  BaseSchema<any>,
  ...BaseSchema<any>[]
];

/**
 * Union schema type.
 */
export type UnionSchema<
  TUnionOptions extends UnionOptions,
  TOutput = Output<TUnionOptions[number]>
> = BaseSchema<Input<TUnionOptions[number]>, TOutput> & {
  schema: 'union';
  union: TUnionOptions;
};

/**
 * Creates a union schema.
 *
 * @param union The union schema.
 * @param error The error message.
 *
 * @returns A union schema.
 */
export function union<TUnionOptions extends UnionOptions>(
  union: TUnionOptions,
  error?: string
): UnionSchema<TUnionOptions> {
  return {
    /**
     * The schema type.
     */
    schema: 'union',

    /**
     * The union schema.
     */
    union,

    /**
     * Whether it's async.
     */
    async: false,

    /**
     * Parses unknown input based on its schema.
     *
     * @param input The input to be parsed.
     * @param info The parse info.
     *
     * @returns The parsed output.
     */
    parse(input, info) {
      // Create output and issues
      let output: [Output<TUnionOptions[number]>] | undefined;
      const issues: Issue[] = [];

      // Parse schema of each option
      for (const schema of union) {
          // Note: Output is nested in array, so that also a falsy value
          // further down can be recognized as valid value
          const result = schema.parse(input, info);
          if (!result.success) {
            issues.push(...result.issues);
          } else {
            output = [schema.parse(input, info)];
            break;
          }
      }

      // Throw error if every schema failed
      if (!output) {
        return notOk([
          getIssue(info, {
            reason: 'type',
            validation: 'union',
            message: error || 'Invalid type',
            input,
            issues: issues as Issues,
          }),
        ]);
      }

      // Otherwise return parsed output
      return ok(output[0]);
    },
  };
}
