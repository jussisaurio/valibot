import { ValiError } from '../../error/index.ts';
import { notOk, ok, type ValidateInfo } from '../../types.ts';
import { getIssue } from '../../utils/index.ts';

/**
 * Creates a async custom validation function.
 *
 * @param requirement The async validation function.
 * @param error The error message.
 *
 * @returns A async validation function.
 */
export function customAsync<TInput>(
  requirement: (input: TInput) => Promise<boolean>,
  error?: string
) {
  return async (input: TInput, info: ValidateInfo) => {
    if (!(await requirement(input))) {
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
