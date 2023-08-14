import { ValiError } from '../../error/index.ts';
import { notOk, type BaseSchemaAsync, ok } from '../../types.ts';
import { getIssue } from '../../utils/index.ts';

/**
 * Literal schema async type.
 */
export type LiteralSchemaAsync<
  TLiteralValue extends string | number,
  TOutput = TLiteralValue
> = BaseSchemaAsync<TLiteralValue, TOutput> & {
  schema: 'literal';
  literal: TLiteralValue;
};

/**
 * Creates an async literal schema.
 *
 * @param literal The literal value.
 * @param error The error message.
 *
 * @returns An async literal schema.
 */
export function literalAsync<TLiteral extends string | number>(
  literal: TLiteral,
  error?: string
): LiteralSchemaAsync<TLiteral> {
  return {
    /**
     * The schema type.
     */
    schema: 'literal',

    /**
     * The literal value.
     */
    literal,

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
      if (input !== literal) {
        return notOk([
          getIssue(info, {
            reason: 'type',
            validation: 'literal',
            message: error || 'Invalid type',
            input,
          }),
        ]);
      }

      // Return output
      return ok(input as TLiteral);
    },
  };
}
