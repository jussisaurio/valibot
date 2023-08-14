import { ValiError } from '../../error/index.ts';
import { notOk, ok, type ValidateInfo } from '../../types.ts';
import { getIssue } from '../../utils/index.ts';

/**
 * Creates a custom validation function.
 *
 * @param requirement The validation function.
 * @param error The error message.
 *
 * @returns A validation function.
 */
export function custom<TInput>(
  requirement: (input: TInput) => boolean,
  error?: string
) {
  return (input: TInput, info: ValidateInfo) => {
    if (!requirement(input)) {
      return notOk([
        getIssue(info, {
          validation: 'custom',
          message: error || 'Invalid input',
          input,
        }),
      ]);
    }
    return ok(input);
  };
}
