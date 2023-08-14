import { type Issue, type Issues, ValiError } from '../../error/index.ts';
import {
  notOk,
  type BaseSchema,
  type BaseSchemaAsync,
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
import type { MapInput, MapOutput } from './types.ts';

/**
 * Map schema async type.
 */
export type MapSchemaAsync<
  TMapKey extends BaseSchema | BaseSchemaAsync,
  TMapValue extends BaseSchema | BaseSchemaAsync,
  TOutput = MapOutput<TMapKey, TMapValue>
> = BaseSchemaAsync<MapInput<TMapKey, TMapValue>, TOutput> & {
  schema: 'map';
  map: { key: TMapKey; value: TMapValue };
};

/**
 * Creates an async map schema.
 *
 * @param key The key schema.
 * @param value The value schema.
 * @param pipe A validation and transformation pipe.
 *
 * @returns An async map schema.
 */
export function mapAsync<
  TMapKey extends BaseSchema | BaseSchemaAsync,
  TMapValue extends BaseSchema | BaseSchemaAsync
>(
  key: TMapKey,
  value: TMapValue,
  pipe?: PipeAsync<MapOutput<TMapKey, TMapValue>>
): MapSchemaAsync<TMapKey, TMapValue>;

/**
 * Creates an async map schema.
 *
 * @param key The key schema.
 * @param value The value schema.
 * @param error The error message.
 * @param pipe A validation and transformation pipe.
 *
 * @returns An async map schema.
 */
export function mapAsync<
  TMapKey extends BaseSchema | BaseSchemaAsync,
  TMapValue extends BaseSchema | BaseSchemaAsync
>(
  key: TMapKey,
  value: TMapValue,
  error?: string,
  pipe?: PipeAsync<MapOutput<TMapKey, TMapValue>>
): MapSchemaAsync<TMapKey, TMapValue>;

export function mapAsync<
  TMapKey extends BaseSchema | BaseSchemaAsync,
  TMapValue extends BaseSchema | BaseSchemaAsync
>(
  key: TMapKey,
  value: TMapValue,
  arg3?: PipeAsync<MapOutput<TMapKey, TMapValue>> | string,
  arg4?: PipeAsync<MapOutput<TMapKey, TMapValue>>
): MapSchemaAsync<TMapKey, TMapValue> {
  // Get error and pipe argument
  const { error, pipe } = getErrorAndPipe(arg3, arg4);

  // Create and return async map schema
  return {
    /**
     * The schema type.
     */
    schema: 'map',

    /**
     * The map key and value schema.
     */
    map: { key, value },

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
      if (!(input instanceof Map)) {
        return notOk([
          getIssue(info, {
            reason: 'type',
            validation: 'map',
            message: error || 'Invalid type',
            input,
          }),
        ]);
      }

      // Create output and issues
      const output: Map<Output<TMapKey>, Output<TMapValue>> = new Map();
      const issues: Issue[] = [];

      // Parse each key and value by schema
      const fail = await Promise.all(
        Array.from(input.entries()).map(async (inputEntry) => {
          // Get input key and value
          const inputKey = inputEntry[0];
          const inputValue = inputEntry[1];

          // Get current path
          const path = getPath(info?.path, {
            schema: 'map',
            input,
            key: inputKey,
            value: inputValue,
          });

          const [outputKey, outputValue] = await Promise.all([
            // Parse key and get output
            (async () => {
                // Note: Output key is nested in array, so that also a falsy value
                // further down can be recognized as valid value
                const keyResult = await key.parse(inputKey, getPathInfo(info, path, 'key'));
                if (!keyResult.success) {
                  if (info?.abortEarly) {
                    throw keyResult
                  }
                  issues.push(...keyResult.issues);
                } else {
                  return [keyResult.output] as const;
                }
            })(),

            // Parse value and get output
            (async () => {
                // Note: Output value is nested in array, so that also a falsy value
                // further down can be recognized as valid value
                const valueResult = await value.parse(inputValue, getPathInfo(info, path, 'value'));
                if (!valueResult.success) {
                  if (info?.abortEarly) {
                    throw valueResult
                  }
                  issues.push(...valueResult.issues);
                } else {
                  return [valueResult.output] as const;
                }
            })(),
          ]);

          // Set entry if output key and value is valid
          if (outputKey && outputValue) {
            output.set(outputKey[0], outputValue[0]);
          }
        })
      ).catch((e) => e as Result<never>);

      if ('success' in fail) {
        return fail as Result<never>;
      }

      // Throw error if there are issues
      if (issues.length) {
        return notOk(issues);
      }

      // Execute pipe and return output
      return executePipeAsync(output, pipe, getPipeInfo(info, 'map'));
    },
  };
}
