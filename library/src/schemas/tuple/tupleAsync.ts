import { type Issue, type Issues, ValiError } from '../../error/index.ts';
import { notOk, type BaseSchema, type BaseSchemaAsync, type PipeAsync, Result } from '../../types.ts';
import {
  executePipeAsync,
  getErrorAndPipe,
  getIssue,
  getPath,
  getPathInfo,
  getPipeInfo,
} from '../../utils/index.ts';
import type { TupleInput, TupleOutput } from './types.ts';

/**
 * Tuple shape async type.
 */
export type TupleShapeAsync = [
  BaseSchema | BaseSchemaAsync,
  ...(BaseSchema[] | BaseSchemaAsync[])
];

/**
 * Tuple schema async type.
 */
export type TupleSchemaAsync<
  TTupleItems extends TupleShapeAsync,
  TTupleRest extends BaseSchema | BaseSchemaAsync | undefined = undefined,
  TOutput = TupleOutput<TTupleItems, TTupleRest>
> = BaseSchemaAsync<TupleInput<TTupleItems, TTupleRest>, TOutput> & {
  schema: 'tuple';
  tuple: { items: TTupleItems; rest: TTupleRest };
};

/**
 * Creates an async tuple schema.
 *
 * @param items The items schema.
 * @param pipe A validation and transformation pipe.
 *
 * @returns An async tuple schema.
 */
export function tupleAsync<
  TTupleItems extends TupleShapeAsync,
  TTupleRest extends BaseSchema | BaseSchemaAsync | undefined = undefined
>(
  items: TTupleItems,
  pipe?: PipeAsync<TupleOutput<TTupleItems, TTupleRest>>
): TupleSchemaAsync<TTupleItems, TTupleRest>;

/**
 * Creates an async tuple schema.
 *
 * @param items The items schema.
 * @param error The error message.
 * @param pipe A validation and transformation pipe.
 *
 * @returns An async tuple schema.
 */
export function tupleAsync<
  TTupleItems extends TupleShapeAsync,
  TTupleRest extends BaseSchema | BaseSchemaAsync | undefined = undefined
>(
  items: TTupleItems,
  error?: string,
  pipe?: PipeAsync<TupleOutput<TTupleItems, TTupleRest>>
): TupleSchemaAsync<TTupleItems, TTupleRest>;

/**
 * Creates an async tuple schema.
 *
 * @param items The items schema.
 * @param rest The rest schema.
 * @param pipe A validation and transformation pipe.
 *
 * @returns An async tuple schema.
 */
export function tupleAsync<
  TTupleItems extends TupleShapeAsync,
  TTupleRest extends BaseSchema | BaseSchemaAsync | undefined = undefined
>(
  items: TTupleItems,
  rest: TTupleRest,
  pipe?: PipeAsync<TupleOutput<TTupleItems, TTupleRest>>
): TupleSchemaAsync<TTupleItems, TTupleRest>;

/**
 * Creates an async tuple schema.
 *
 * @param items The items schema.
 * @param rest The rest schema.
 * @param error The error message.
 * @param pipe A validation and transformation pipe.
 *
 * @returns An async tuple schema.
 */
export function tupleAsync<
  TTupleItems extends TupleShapeAsync,
  TTupleRest extends BaseSchema | BaseSchemaAsync | undefined = undefined
>(
  items: TTupleItems,
  rest: TTupleRest,
  error?: string,
  pipe?: PipeAsync<TupleOutput<TTupleItems, TTupleRest>>
): TupleSchemaAsync<TTupleItems, TTupleRest>;

export function tupleAsync<
  TTupleItems extends TupleShapeAsync,
  TTupleRest extends BaseSchema | BaseSchemaAsync | undefined = undefined
>(
  items: TTupleItems,
  arg2?: PipeAsync<TupleOutput<TTupleItems, TTupleRest>> | string | TTupleRest,
  arg3?: PipeAsync<TupleOutput<TTupleItems, TTupleRest>> | string,
  arg4?: PipeAsync<TupleOutput<TTupleItems, TTupleRest>>
): TupleSchemaAsync<TTupleItems, TTupleRest> {
  // Get rest, error and pipe argument
  const { rest, error, pipe } = (
    typeof arg2 === 'object' && !Array.isArray(arg2)
      ? { rest: arg2, ...getErrorAndPipe(arg3, arg4) }
      : getErrorAndPipe(arg2, arg3 as any)
  ) as {
    rest: TTupleRest;
    error: string | undefined;
    pipe: PipeAsync<TupleOutput<TTupleItems, TTupleRest>>;
  };

  // Create and return async tuple schema
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

      const fail = await Promise.all([
        // Parse schema of each tuple item
        Promise.all(
          items.map(async (schema, index) => {
              const value = input[index];
              const result = await schema.parse(
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
                if(info?.abortEarly) {
                  throw result;
                }
                issues.push(...result.issues);
              } else {
                output[index] = result.output;
              }
          })
        ),

        // If necessary parse schema of each rest item
        rest &&
          Promise.all(
            input.slice(items.length).map(async (value, index) => {
              try {
                const tupleIndex = items.length + index;
                output[tupleIndex] = await rest.parse(
                  value,
                  getPathInfo(
                    info,
                    getPath(info?.path, {
                      schema: 'tuple',
                      input: input as [any, ...any[]],
                      key: tupleIndex,
                      value,
                    })
                  )
                );

                // Throw or fill issues in case of an error
              } catch (error) {
                if (info?.abortEarly) {
                  throw error;
                }
                issues.push(...(error as ValiError).issues);
              }
            })
          ),
      ]).catch(result => result as Result<never>);

      if ('success' in fail) {
        return fail;
      }

      // Throw error if there are issues
      if (issues.length) {
        return notOk(issues);
      }

      // Execute pipe and return output
      return executePipeAsync(
        output as TupleOutput<TTupleItems, TTupleRest>,
        pipe,
        getPipeInfo(info, 'tuple')
      );
    },
  };
}
