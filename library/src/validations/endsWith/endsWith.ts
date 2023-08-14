import { ValiError } from '../../error/index.ts';
import { notOk, ok, type ValidateInfo } from '../../types.ts';
import { getIssue } from '../../utils/index.ts';

/**
 * Creates a validation functions that validates the end of a string.
 *
 * @param requirement The end string.
 * @param error The error message.
 *
 * @returns A validation function.
 */
export function endsWith<TInput extends string>(
  requirement: string,
  error?: string
) {
  return (input: TInput, info: ValidateInfo) => {
    if (!input.endsWith(requirement as any)) {
      return notOk([
        getIssue(info, {
          validation: 'ends_with',
          message: error || 'Invalid end',
          input,
        }),
      ]);
    }
    return ok(input);
  };
}
