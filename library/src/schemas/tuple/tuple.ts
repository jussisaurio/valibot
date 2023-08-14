import { type Issue, type Issues, ValiError } from '../../error/index.ts';
import { notOk, type BaseSchema, type Pipe } from '../../types.ts';
import {
  executePipe,
  getErrorAndPipe,
  getIssue,
  getPath,
  getPathInfo,
  getPipeInfo,
} from '../../utils/index.ts';
import type { TupleOutput, TupleInput } from './types.ts';

/**
 * Tuple shape type.
 */
export type TupleShape = [BaseSchema, ...BaseSchema[]];

/**
 * Tuple schema type.
 */
export type TupleSchema<
  TTupleItems extends TupleShape,
  TTupleRest extends BaseSchema | undefined = undefined,
  TOutput = TupleOutput<TTupleItems, TTupleRest>
> = BaseSchema<TupleInput<TTupleItems, TTupleRest>, TOutput> & {
  schema: 'tuple';
  tuple: { items: TTupleItems; rest: TTupleRest };
};

/**
 * Creates a tuple schema.
 *
 * @param items The items schema.
 * @param pipe A validation and transformation pipe.
 *
 * @returns A tuple schema.
 */
export function tuple<
  TTupleItems extends TupleShape,
  TTupleRest extends BaseSchema | undefined = undefined
>(
  items: TTupleItems,
  pipe?: Pipe<TupleOutput<TTupleItems, TTupleRest>>
): TupleSchema<TTupleItems, TTupleRest>;

/**
 * Creates a tuple schema.
 *
 * @param items The items schema.
 * @param error The error message.
 * @param pipe A validation and transformation pipe.
 *
 * @returns A tuple schema.
 */
export function tuple<
  TTupleItems extends TupleShape,
  TTupleRest extends BaseSchema | undefined = undefined
>(
  items: TTupleItems,
  error?: string,
  pipe?: Pipe<TupleOutput<TTupleItems, TTupleRest>>
): TupleSchema<TTupleItems, TTupleRest>;

/**
 * Creates a tuple schema.
 *
 * @param items The items schema.
 * @param rest The rest schema.
 * @param pipe A validation and transformation pipe.
 *
 * @returns A tuple schema.
 */
export function tuple<
  TTupleItems extends TupleShape,
  TTupleRest extends BaseSchema | undefined = undefined
>(
  items: TTupleItems,
  rest: TTupleRest,
  pipe?: Pipe<TupleOutput<TTupleItems, TTupleRest>>
): TupleSchema<TTupleItems, TTupleRest>;

/**
 * Creates a tuple schema.
 *
 * @param items The items schema.
 * @param rest The rest schema.
 * @param error The error message.
 * @param pipe A validation and transformation pipe.
 *
 * @returns A tuple schema.
 */
export function tuple<
  TTupleItems extends TupleShape,
  TTupleRest extends BaseSchema | undefined = undefined
>(
  items: TTupleItems,
  rest: TTupleRest,
  error?: string,
  pipe?: Pipe<TupleOutput<TTupleItems, TTupleRest>>
): TupleSchema<TTupleItems, TTupleRest>;

export function tuple<
  TTupleItems extends TupleShape,
  TTupleRest extends BaseSchema | undefined = undefined
>(
  items: TTupleItems,
  arg2?: Pipe<TupleOutput<TTupleItems, TTupleRest>> | string | TTupleRest,
  arg3?: Pipe<TupleOutput<TTupleItems, TTupleRest>> | string,
  arg4?: Pipe<TupleOutput<TTupleItems, TTupleRest>>
): TupleSchema<TTupleItems, TTupleRest> {
  // Get rest, error and pipe argument
  const { rest, error, pipe } = (
    typeof arg2 === 'object' && !Array.isArray(arg2)
      ? { rest: arg2, ...getErrorAndPipe(arg3, arg4) }
      : getErrorAndPipe(arg2, arg3 as any)
  ) as {
    rest: TTupleRest;
    error: string | undefined;
    pipe: Pipe<TupleOutput<TTupleItems, TTupleRest>>;
  };

  // Create and return tuple schema
  return {
    /**
     * The schema type.
     */
    schema: 'tuple',

    /**
     * The tuple items and rest schema.
     */
    tuple: { items, rest },

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
      if (
        !Array.isArray(input) ||
        (!rest && items.length !== input.length) ||
        (rest && items.length > input.length)
      ) {
        return notOk([
          getIssue(info, {
            reason: 'type',
            validation: 'tuple',
            message: error || 'Invalid type',
            input,
          }),
        ]);
      }

      // Create output and issues
      const output: any[] = [];
      const issues: Issue[] = [];

      // Parse schema of each tuple item
      for (let index = 0; index < items.length; index++) {
          const value = input[index];
          const result = items[index].parse(
            value,
            getPathInfo(
              info,
              getPath(info?.path, {
                schema: 'tuple',
                input: input as [any, ...any[]],
                key: index,
                value,
              })
            )
          );

          if (!result.success) {
            if (info?.abortEarly) {
              return result;
            }
            issues.push(...result.issues);
          } else {
            output[index] = result.output
          }
      }

      // If necessary parse schema of each rest item
      if (rest) {
        for (let index = items.length; index < input.length; index++) {
            const value = input[index];
            const result = rest.parse(
              value,
              getPathInfo(
                info,
                getPath(info?.path, {
                  schema: 'tuple',
                  input: input as [any, ...any[]],
                  key: index,
                  value,
                })
              )
            );

            if (!result.success) {
              if (info?.abortEarly) {
                return result;
              }
              issues.push(...result.issues);
            } else {
              output[index] = result.output
            }
        }
      }

      // Throw error if there are issues
      if (issues.length) {
        return notOk(issues);
      }

      // Execute pipe and return output
      return executePipe(
        output as TupleOutput<TTupleItems, TTupleRest>,
        pipe,
        getPipeInfo(info, 'tuple')
      );
    },
  };
}
