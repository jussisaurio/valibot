import { type Issue, type Issues, ValiError } from '../../error/index.ts';
import { notOk, type BaseSchema, type Pipe, type Result } from '../../types.ts';
import {
  executePipe,
  getErrorAndPipe,
  getIssue,
  getPath,
  getPathInfo,
  getPipeInfo,
} from '../../utils/index.ts';
import type { SetInput, SetOutput } from './types.ts';

/**
 * Set schema type.
 */
export type SetSchema<
  TSetValue extends BaseSchema,
  TOutput = SetOutput<TSetValue>
> = BaseSchema<SetInput<TSetValue>, TOutput> & {
  schema: 'set';
  set: { value: TSetValue };
};

/**
 * Creates a set schema.
 *
 * @param value The value schema.
 * @param pipe A validation and transformation pipe.
 *
 * @returns A set schema.
 */
export function set<TSetValue extends BaseSchema>(
  value: TSetValue,
  pipe?: Pipe<SetOutput<TSetValue>>
): SetSchema<TSetValue>;

/**
 * Creates a set schema.
 *
 * @param value The value schema.
 * @param error The error message.
 * @param pipe A validation and transformation pipe.
 *
 * @returns A set schema.
 */
export function set<TSetValue extends BaseSchema>(
  value: TSetValue,
  error?: string,
  pipe?: Pipe<SetOutput<TSetValue>>
): SetSchema<TSetValue>;

export function set<TSetValue extends BaseSchema>(
  value: TSetValue,
  arg2?: Pipe<SetOutput<TSetValue>> | string,
  arg3?: Pipe<SetOutput<TSetValue>>
): SetSchema<TSetValue> {
  // Get error and pipe argument
  const { error, pipe } = getErrorAndPipe(arg2, arg3);

  // Create and return set schema
  return {
    /**
     * The schema type.
     */
    schema: 'set',

    /**
     * The set value schema.
     */
    set: { value },

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
    parse(input, info): Result<SetOutput<TSetValue>> {
      // Check type of input
      if (!(input instanceof Set)) {
        return notOk([
          getIssue(info, {
            reason: 'type',
            validation: 'set',
            message: error || 'Invalid type',
            input,
          }),
        ]);
      }

      // Create index, output and issues
      let index = 0;
      const output: SetOutput<TSetValue> = new Set();
      const issues: Issue[] = [];

      // Parse each value by schema
      for (const inputValue of input) {
          const result = value.parse(
            inputValue,
            getPathInfo(
              info,
              getPath(info?.path, {
                schema: 'set',
                input,
                key: index++,
                value: inputValue,
              })
            )
          );
          if (!result.success) {
            if (info?.abortEarly) {
              return result;
            }
            issues.push(...result.issues);
          } else {
            output.add(
              result.output
            );
          }
      }

      // Throw error if there are issues
      if (issues.length) {
        return notOk(issues);
      }

      // Execute pipe and return output
      return executePipe(output, pipe, getPipeInfo(info, 'set'));
    },
  };
}
