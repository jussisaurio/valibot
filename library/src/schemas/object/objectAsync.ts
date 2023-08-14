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
import type { ObjectInput, ObjectOutput } from './types.ts';

/**
 * Object shape async type.
 */
export type ObjectShapeAsync = Record<
  string,
  BaseSchema<any> | BaseSchemaAsync<any>
>;

/**
 * Object schema async type.
 */
export type ObjectSchemaAsync<
  TObjectShape extends ObjectShapeAsync,
  TOutput = ObjectOutput<TObjectShape>
> = BaseSchemaAsync<ObjectInput<TObjectShape>, TOutput> & {
  schema: 'object';
  object: TObjectShape;
};

/**
 * Creates an async object schema.
 *
 * @param object The object schema.
 * @param pipe A validation and transformation pipe.
 *
 * @returns An async object schema.
 */
export function objectAsync<TObjectShape extends ObjectShapeAsync>(
  object: TObjectShape,
  pipe?: PipeAsync<ObjectOutput<TObjectShape>>
): ObjectSchemaAsync<TObjectShape>;

/**
 * Creates an async object schema.
 *
 * @param object The object schema.
 * @param error The error message.
 * @param pipe A validation and transformation pipe.
 *
 * @returns An async object schema.
 */
export function objectAsync<TObjectShape extends ObjectShapeAsync>(
  object: TObjectShape,
  error?: string,
  pipe?: PipeAsync<ObjectOutput<TObjectShape>>
): ObjectSchemaAsync<TObjectShape>;

export function objectAsync<TObjectShape extends ObjectShapeAsync>(
  object: TObjectShape,
  arg2?: PipeAsync<ObjectOutput<TObjectShape>> | string,
  arg3?: PipeAsync<ObjectOutput<TObjectShape>>
): ObjectSchemaAsync<TObjectShape> {
  // Get error and pipe argument
  const { error, pipe } = getErrorAndPipe(arg2, arg3);

  // Create cached entries
  let cachedEntries: [string, BaseSchema<any>][];

  // Create and return async object schema
  return {
    /**
     * The schema type.
     */
    schema: 'object',

    /**
     * The object schema.
     */
    object,

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
        !input ||
        typeof input !== 'object' ||
        input.toString() !== '[object Object]'
      ) {
        return notOk([
          getIssue(info, {
            reason: 'type',
            validation: 'object',
            message: error || 'Invalid type',
            input,
          }),
        ]);
      }

      // Cache object entries lazy
      cachedEntries = cachedEntries || Object.entries(object);

      // Create output and issues
      const output: Record<string, any> = {};
      const issues: Issue[] = [];

      // Parse schema of each key
      const fail = await Promise.all(
        cachedEntries.map(async (objectEntry) => {
            const key = objectEntry[0];
            const value = (input as Record<string, unknown>)[key];
            const result = await objectEntry[1].parse(
              value,
              getPathInfo(
                info,
                getPath(info?.path, {
                  schema: 'object',
                  input,
                  key,
                  value,
                })
              )
            );

            if (!result.success) {
              if (info?.abortEarly) {
                throw result;
              }
              issues.push(...result.issues);
            } else {
              output[key] = result.output;
            }
        })
      ).catch((result) => result as Result<never>);

      if ('success' in fail) {
        return fail;
      }

      // Throw error if there are issues
      if (issues.length) {
        return notOk(issues);
      }

      // Execute pipe and return output
      return executePipeAsync(
        output as ObjectOutput<TObjectShape>,
        pipe,
        getPipeInfo(info, 'object')
      );
    },
  };
}
