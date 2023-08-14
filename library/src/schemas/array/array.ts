import { type Issue, type Issues, ValiError } from '../../error/index.ts';
import { notOk, type BaseSchema, type Input, type Output, type Pipe } from '../../types.ts';
import {
  executePipe,
  getErrorAndPipe,
  getIssue,
  getPath,
  getPathInfo,
  getPipeInfo,
} from '../../utils/index.ts';

/**
 * Array path item type.
 */
export type ArrayPathItem = {
  schema: 'array';
  input: any[];
  key: number;
  value: any;
};

/**
 * Array schema type.
 */
export type ArraySchema<
  TArrayItem extends BaseSchema,
  TOutput = Output<TArrayItem>[]
> = BaseSchema<Input<TArrayItem>[], TOutput> & {
  schema: 'array';
  array: { item: TArrayItem };
};

/**
 * Creates a array schema.
 *
 * @param item The item schema.
 * @param pipe A validation and transformation pipe.
 *
 * @returns A array schema.
 */
export function array<TArrayItem extends BaseSchema>(
  item: TArrayItem,
  pipe?: Pipe<Output<TArrayItem>[]>
): ArraySchema<TArrayItem>;

/**
 * Creates a array schema.
 *
 * @param item The item schema.
 * @param error The error message.
 * @param pipe A validation and transformation pipe.
 *
 * @returns A array schema.
 */
export function array<TArrayItem extends BaseSchema>(
  item: TArrayItem,
  error?: string,
  pipe?: Pipe<Output<TArrayItem>[]>
): ArraySchema<TArrayItem>;

export function array<TArrayItem extends BaseSchema>(
  item: TArrayItem,
  arg2?: string | Pipe<Output<TArrayItem>[]>,
  arg3?: Pipe<Output<TArrayItem>[]>
): ArraySchema<TArrayItem> {
  // Get error and pipe argument
  const { error, pipe } = getErrorAndPipe(arg2, arg3);

  // Create and return array schema
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
      // Check type of input
      if (!Array.isArray(input)) {
        return { success: false, issues:[
          getIssue(info, {
            reason: 'type',
            validation: 'array',
            message: error || 'Invalid type',
            input,
          }),
        ] };
      }

      // Create output and issues
      const output: any[] = [];
      const issues: Issue[] = [];

      // Parse schema of each array item
      for (let index = 0; index < input.length; index++) {
          const value = input[index];
          const result = item.parse(
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

          if (info?.abortEarly && !result.success) {
            return result;
          }

          if (!result.success) {
            issues.push(...result.issues);
          } else {
            output.push(
              result.output
            );
          }
      }

      if (issues.length) {
        return notOk(issues)
      }

      // Execute pipe and return output
      return executePipe(
        output as Output<TArrayItem>[],
        pipe,
        getPipeInfo(info, 'array')
      );
    },
  };
}
