import { ValiError } from '../../error/index.ts';
import { notOk, type BaseSchema, ok } from '../../types.ts';
import { getIssue } from '../../utils/index.ts';

/**
 * NaN schema type.
 */
export type NanSchema<TOutput = number> = BaseSchema<number, TOutput> & {
  schema: 'nan';
};

/**
 * Creates a NaN schema.
 *
 * @param error The error message.
 *
 * @returns A NaN schema.
 */
export function nan(error?: string): NanSchema {
  return {
    /**
     * The schema type.
     */
    schema: 'nan',

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
      if (!Number.isNaN(input)) {
        return notOk([
          getIssue(info, {
            reason: 'type',
            validation: 'nan',
            message: error || 'Invalid type',
            input,
          }),
        ]);
      }

      // Return output
      return ok(input as number);
    },
  };
}
