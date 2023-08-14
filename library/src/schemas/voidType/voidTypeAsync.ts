import { ValiError } from '../../error/index.ts';
import { notOk, type BaseSchemaAsync, ok } from '../../types.ts';
import { getIssue } from '../../utils/index.ts';

/**
 * Void schema async type.
 */
export type VoidSchemaAsync<TOutput = void> = BaseSchemaAsync<void, TOutput> & {
  schema: 'void';
};

/**
 * Creates an async void schema.
 *
 * @param error The error message.
 *
 * @returns An async void schema.
 */
export function voidTypeAsync(error?: string): VoidSchemaAsync {
  return {
    /**
     * The schema type.
     */
    schema: 'void',

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
      if (typeof input !== 'undefined') {
        return notOk([
          getIssue(info, {
            reason: 'type',
            validation: 'void',
            message: error || 'Invalid type',
            input,
          }),
        ]);
      }

      // Return output
      return ok(input);
    },
  };
}
