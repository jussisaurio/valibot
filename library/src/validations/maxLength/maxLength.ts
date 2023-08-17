import type { _ParseResult, ValidateInfo } from '../../types.ts';
import { getLeafIssue } from '../../utils/index.ts';

/**
 * Creates a validation functions that validates the length of a string or array.
 *
 * @param requirement The maximum length.
 * @param error The error message.
 *
 * @returns A validation function.
 */
export function maxLength<TInput extends string | any[]>(
  requirement: number,
  error?: string
) {
  return (input: TInput, info: ValidateInfo): _ParseResult<TInput> => {
    if (input.length > requirement) {
      return {
        issues: [
          getLeafIssue(
            {
              validation: 'max_length',
              message: error || 'Invalid length',
              input,
            },
            info
          ),
        ],
      };
    }
    return { output: input };
  };
}
