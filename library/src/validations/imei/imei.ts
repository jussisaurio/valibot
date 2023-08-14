import { ValiError } from '../../error/index.ts';
import { notOk, ok, type ValidateInfo } from '../../types.ts';
import { getIssue, isLuhnAlgo } from '../../utils/index.ts';

/**
 * Creates a validation functions that validates a IMEI.
 *
 * Format: AA-BBBBBB-CCCCCC-D
 *
 * @param error The error message.
 *
 * @returns A validation function.
 */
export function imei<TInput extends string>(error?: string) {
  return (input: TInput, info: ValidateInfo) => {
    if (
      !/^\d{2}[ |/|-]?\d{6}[ |/|-]?\d{6}[ |/|-]?\d$/.test(input) ||
      !isLuhnAlgo(input)
    ) {
      return notOk([
        getIssue(info, {
          validation: 'imei',
          message: error || 'Invalid IMEI',
          input,
        }),
      ]);
    }
    return ok(input);
  };
}
