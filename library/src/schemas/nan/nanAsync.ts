import { ValiError } from '../../error/index.ts';
import { notOk, type BaseSchemaAsync, ok } from '../../types.ts';
import { getIssue } from '../../utils/index.ts';

/**
 * NaN schema async type.
 */
export type NanSchemaAsync<TOutput = number> = BaseSchemaAsync<
  number,
  TOutput
> & {
  schema: 'nan';
};

/**
 * Creates an async NaN schema.
 *
 * @param error The error message.
 *
 * @returns An async NaN schema.
 */
export function nanAsync(error?: string): NanSchemaAsync {
  return {
    /**
     * The schema type.
     */
    schema: 'nan',

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
