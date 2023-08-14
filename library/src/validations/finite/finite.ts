import { ValiError } from '../../error/index.ts';
import { notOk, ok, type ValidateInfo } from '../../types.ts';
import { getIssue } from '../../utils/index.ts';

/**
 * Creates a validation function that validates whether a number is finite.
 *
 * @param error The error message.
 *
 * @returns A validation function.
 */
export function finite<TInput extends number>(error?: string) {
  return (input: TInput, info: ValidateInfo) => {
    if (!Number.isFinite(input)) {
      return notOk([
        getIssue(info, {
          validation: 'finite',
          message: error || 'Invalid finite number',
          input,
        }),
      ]);
    }
    return ok(input);
  };
}
