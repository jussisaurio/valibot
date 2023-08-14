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
import type { SetInput, SetOutput } from './types.ts';

/**
 * Set schema async type.
 */
export type SetSchemaAsync<
  TSetValue extends BaseSchema | BaseSchemaAsync,
  TOutput = SetOutput<TSetValue>
> = BaseSchemaAsync<SetInput<TSetValue>, TOutput> & {
  schema: 'set';
  set: { value: TSetValue };
};

/**
 * Creates an async set schema.
 *
 * @param value The value schema.
 * @param pipe A validation and transformation pipe.
 *
 * @returns An async set schema.
 */
export function setAsync<TSetValue extends BaseSchema | BaseSchemaAsync>(
  value: TSetValue,
  pipe?: PipeAsync<SetOutput<TSetValue>>
): SetSchemaAsync<TSetValue>;

/**
 * Creates an async set schema.
 *
 * @param value The value schema.
 * @param error The error message.
 * @param pipe A validation and transformation pipe.
 *
 * @returns An async set schema.
 */
export function setAsync<TSetValue extends BaseSchema | BaseSchemaAsync>(
  value: TSetValue,
  error?: string,
  pipe?: PipeAsync<SetOutput<TSetValue>>
): SetSchemaAsync<TSetValue>;

export function setAsync<TSetValue extends BaseSchema | BaseSchemaAsync>(
  value: TSetValue,
  arg2?: PipeAsync<SetOutput<TSetValue>> | string,
  arg3?: PipeAsync<SetOutput<TSetValue>>
): SetSchemaAsync<TSetValue> {
  // Get error and pipe argument
  const { error, pipe } = getErrorAndPipe(arg2, arg3);

  // Create and return async set schema
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
      const output: SetOutput<TSetValue> = new Set();
      const issues: Issue[] = [];

      // Parse each value by schema
      const fail = await Promise.all(
        Array.from(input.values()).map(async (inputValue, index) => {
              const result = await value.parse(
                inputValue,
                getPathInfo(
                  info,
                  getPath(info?.path, {
                    schema: 'set',
                    input,
                    key: index,
                    value: inputValue,
                  })
                )
              )
            
            if (!result.success) {
              if (info?.abortEarly) {
                throw result;
              }
              issues.push(...result.issues);
            } else {
              output.add(result.output);
            }
        })
      ).catch(result => result as Result<never>);
      
      if ('success' in fail) {
        return fail;
      }
      // Throw error if there are issues
      if (issues.length) {
        return notOk(issues);
      }

      // Execute pipe and return output
      return executePipeAsync(output, pipe, getPipeInfo(info, 'set'));
    },
  };
}
