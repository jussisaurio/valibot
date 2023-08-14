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
import { type StringSchema, string } from '../string/index.ts';
import type { RecordOutput, RecordInput } from './types.ts';
import { BLOCKED_KEYS } from './values.ts';

/**
 * Record key type.
 */
export type RecordKey = StringSchema<string | number | symbol>;

/**
 * Record schema type.
 */
export type RecordSchema<
  TRecordValue extends BaseSchema,
  TRecordKey extends RecordKey = StringSchema,
  TOutput = RecordOutput<TRecordKey, TRecordValue>
> = BaseSchema<RecordInput<TRecordKey, TRecordValue>, TOutput> & {
  schema: 'record';
  record: { key: TRecordKey; value: TRecordValue };
};

/**
 * Creates a record schema.
 *
 * @param value The value schema.
 * @param pipe A validation and transformation pipe.
 *
 * @returns A record schema.
 */
export function record<TRecordValue extends BaseSchema>(
  value: TRecordValue,
  pipe?: Pipe<RecordOutput<StringSchema, TRecordValue>>
): RecordSchema<TRecordValue>;

/**
 * Creates a record schema.
 *
 * @param value The value schema.
 * @param error The error message.
 * @param pipe A validation and transformation pipe.
 *
 * @returns A record schema.
 */
export function record<TRecordValue extends BaseSchema>(
  value: TRecordValue,
  error?: string,
  pipe?: Pipe<RecordOutput<StringSchema, TRecordValue>>
): RecordSchema<TRecordValue>;

/**
 * Creates a record schema.
 *
 * @param key The key schema.
 * @param value The value schema.
 * @param pipe A validation and transformation pipe.
 *
 * @returns A record schema.
 */
export function record<
  TRecordKey extends RecordKey,
  TRecordValue extends BaseSchema
>(
  key: TRecordKey,
  value: TRecordValue,
  pipe?: Pipe<RecordOutput<TRecordKey, TRecordValue>>
): RecordSchema<TRecordValue, TRecordKey>;

/**
 * Creates a record schema.
 *
 * @param key The key schema.
 * @param value The value schema.
 * @param error The error message.
 * @param pipe A validation and transformation pipe.
 *
 * @returns A record schema.
 */
export function record<
  TRecordKey extends RecordKey,
  TRecordValue extends BaseSchema
>(
  key: TRecordKey,
  value: TRecordValue,
  error?: string,
  pipe?: Pipe<RecordOutput<TRecordKey, TRecordValue>>
): RecordSchema<TRecordValue, TRecordKey>;

export function record<
  TRecordKey extends RecordKey,
  TRecordValue extends BaseSchema
>(
  arg1: TRecordValue | TRecordKey,
  arg2?: Pipe<RecordOutput<TRecordKey, TRecordValue>> | string | TRecordValue,
  arg3?: Pipe<RecordOutput<TRecordKey, TRecordValue>> | string,
  arg4?: Pipe<RecordOutput<TRecordKey, TRecordValue>>
): RecordSchema<TRecordValue, TRecordKey> {
  // Get key, value, error and pipe argument
  const { key, value, error, pipe } = (
    typeof arg2 === 'object' && !Array.isArray(arg2)
      ? { key: arg1, value: arg2, ...getErrorAndPipe(arg3, arg4) }
      : { key: string(), value: arg1, ...getErrorAndPipe(arg2, arg3 as any) }
  ) as {
    key: TRecordKey;
    value: TRecordValue;
    error: string | undefined;
    pipe: Pipe<RecordOutput<TRecordKey, TRecordValue>>;
  };

  // Create and return record schema
  return {
    /**
     * The schema type.
     */
    schema: 'record',

    /**
     * The record key and value schema.
     */
    record: { key, value },

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
    parse(input, info): Result<RecordOutput<TRecordKey, TRecordValue>> {
      // Check type of input
      if (
        !input ||
        typeof input !== 'object' ||
        input.toString() !== '[object Object]'
      ) {
        return notOk([
          getIssue(info, {
            reason: 'type',
            validation: 'record',
            message: error || 'Invalid type',
            input,
          }),
        ]);
      }

      // Create output and issues
      const output: Record<string | number | symbol, any> = {};
      const issues: Issue[] = [];

      // Parse each key and value by schema
      // Note: `Object.entries(...)` converts each key to a string
      for (const inputEntry of Object.entries(input)) {
        // Get input key
        const inputKey = inputEntry[0];

        // Exclude blocked keys to prevent prototype pollutions
        if (!BLOCKED_KEYS.includes(inputKey)) {
          // Get input value
          const inputValue = inputEntry[1];

          // Get current path
          const path = getPath(info?.path, {
            schema: 'record',
            input,
            key: inputKey,
            value: inputValue,
          });

          // Parse key and get output
          let outputKey: string | number | symbol | undefined;
            const keyResult = key.parse(inputKey, getPathInfo(info, path, 'key'));
            if (!keyResult.success) {
              if (info?.abortEarly) {
                return keyResult;
              }
              issues.push(...keyResult.issues);
            } else {
              outputKey = keyResult.output;
            }

          // Parse value and get output
          let outputValue: [any] | undefined;
            // Note: Value is nested in array, so that also a falsy value further
            // down can be recognized as valid value
            const result = value.parse(inputValue, getPathInfo(info, path, 'value'));
            if (!result.success) {
              if (info?.abortEarly) {
                return result;
              }
              issues.push(...result.issues);
            } else {
              outputValue = [result.output];
            }

          // Set entry if output key and value is valid
          if (outputKey && outputValue) {
            output[outputKey] = outputValue[0];
          }
        }
      }

      // Throw error if there are issues
      if (issues.length) {
        return notOk(issues);
      }

      // Execute pipe and return output
      return executePipe(
        output as RecordOutput<TRecordKey, TRecordValue>,
        pipe,
        getPipeInfo(info, 'record')
      );
    },
  };
}
