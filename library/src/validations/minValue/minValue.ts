import type { ParseResult, ValidateInfo } from '../../types.ts';
import { getIssue } from '../../utils/index.ts';

/**
 * Creates a validation functions that validates the value of a string, number or date.
 *
 * @param requirement The minimum value.
 * @param error The error message.
 *
 * @returns A validation function.
 */
export function minValue<
  TInput extends string | number | bigint | Date,
  TRequirement extends TInput
>(requirement: TRequirement, error?: string) {
  return (input: TInput, info: ValidateInfo): ParseResult<TInput> => {
    if (input < requirement) {
      return {
        issues: [
          getIssue(info, {
            validation: 'min_value',
            message: error || 'Invalid value',
            input,
          }),
        ],
      };
    }
    return { output: input };
  };
}

/**
 * See {@link minValue}
 *
 * @deprecated Function has been renamed to `minValue`.
 */
export const minRange = minValue;
