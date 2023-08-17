import type { _ParseResult, ValidateInfo } from '../../types.ts';
import { getLeafIssue } from '../../utils/index.ts';

/**
 * Creates a validation functions that validates the size of a map, set or blob.
 *
 * @param requirement The size.
 * @param error The error message.
 *
 * @returns A validation function.
 */
export function size<TInput extends Map<any, any> | Set<any> | Blob>(
  requirement: number,
  error?: string
) {
  return (input: TInput, info: ValidateInfo): _ParseResult<TInput> => {
    if (input.size !== requirement) {
      return {
        issues: [
          getLeafIssue(
            {
              validation: 'size',
              message: error || 'Invalid size',
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
