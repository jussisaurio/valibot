import { ValiError } from '../../error/index.ts';
import { notOk, type BaseSchema } from '../../types.ts';
import { getIssue } from '../../utils/index.ts';

/**
 * Never schema type.
 */
export type NeverSchema = BaseSchema<never> & {
  schema: 'never';
};

/**
 * Creates a never schema.
 *
 * @param error The error message.
 *
 * @returns A never schema.
 */
export function never(error?: string): NeverSchema {
  return {
    /**
     * The schema type.
     */
    schema: 'never',

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
      return notOk([
        getIssue(info, {
          reason: 'type',
          validation: 'never',
          message: error || 'Invalid type',
          input,
        }),
      ]);
    },
  };
}
