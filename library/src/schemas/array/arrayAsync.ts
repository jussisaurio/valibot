import { type Issue, type Issues, ValiError } from '../../error/index.ts';
import {
  notOk,
  type BaseSchema,
  type BaseSchemaAsync,
  type Input,
  type Output,
  type PipeAsync,
  Result,
} from '../../types.ts';
import {
  executePipeAsync,
  getErrorAndPipe,
  getIssue,
  getPath,
  getPathInfo,
  getPipeInfo,
} from '../../utils/index.ts';

/**
 * Array schema async type.
 */
export type ArraySchemaAsync<
  TArrayItem extends BaseSchema | BaseSchemaAsync,
  TOutput = Output<TArrayItem>[]
> = BaseSchemaAsync<Input<TArrayItem>[], TOutput> & {
  schema: 'array';
  array: { item: TArrayItem };
};

/**
 * Creates an async array schema.
 *
 * @param item The item schema.
 * @param pipe A validation and transformation pipe.
 *
 * @returns An async array schema.
 */
export function arrayAsync<TArrayItem extends BaseSchema | BaseSchemaAsync>(
  item: TArrayItem,
  pipe?: PipeAsync<Output<TArrayItem>[]>
): ArraySchemaAsync<TArrayItem>;

/**
 * Creates an async array schema.
 *
 * @param item The item schema.
 * @param error The error message.
 * @param pipe A validation and transformation pipe.
 *
 * @returns An async array schema.
 */
export function arrayAsync<TArrayItem extends BaseSchema | BaseSchemaAsync>(
  item: TArrayItem,
  error?: string,
  pipe?: PipeAsync<Output<TArrayItem>[]>
): ArraySchemaAsync<TArrayItem>;

export function arrayAsync<TArrayItem extends BaseSchema | BaseSchemaAsync>(
  item: TArrayItem,
  arg2?: string | PipeAsync<Output<TArrayItem>[]>,
  arg3?: PipeAsync<Output<TArrayItem>[]>
): ArraySchemaAsync<TArrayItem> {
  // Get error and pipe argument
  const { error, pipe } = getErrorAndPipe(arg2, arg3);

  // Create and return async array schema
  return {
    /**
     * The schema type.
     */
    schema: 'array',

    /**
     * The array item schema.
     */
    array: { item },

    /**
     * Whether it's async.
     */
    async: true,

    /**
     * Parses unknown input based on its schema.
     *
     * @param input The input to be parsed.
     * @param info The parse info.
     *
     * @returns The parsed output.
     */
    async parse(input, info) {
      // Check type of input
      if (!Array.isArray(input)) {
        return notOk([
          getIssue(info, {
            reason: 'type',
            validation: 'array',
            message: error || 'Invalid type',
            input,
          }),
        ]);
      }

      // Create output and issues
      const output: any[] = [];
      const issues: Issue[] = [];

      // Parse schema of each array item
      const fail = await Promise.all(
        input.map(async (value, index) => {
            const result = await item.parse(
              value,
              getPathInfo(
                info,
                getPath(info?.path, {
                  schema: 'array',
                  input: input,
                  key: index,
                  value,
                })
              )
            );

            if (!result.success) {
              if (info?.abortEarly) {
                throw result;
              } else {
                issues.push(...result.issues);
              }
            } else {
              output[index] = result.output;
            }
        })
      ).catch(abortEarlyFailure => abortEarlyFailure as Extract<Result<never>, { success: false} >);

      if (fail) {
        return fail as Result<never>;
      }

      // Throw error if there are issues
      if (issues.length) {
        return notOk(issues);
      }

      // Execute pipe and return output
      return executePipeAsync(
        output as Output<TArrayItem>[],
        pipe,
        getPipeInfo(info, 'array')
      );
    },
  };
}
