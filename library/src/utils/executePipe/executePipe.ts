import { type Issue, type Issues, ValiError } from '../../error/index.ts';
import { notOk, ok, type Pipe, type Result, type ValidateInfo } from '../../types.ts';

/**
 * Executes the validation and transformation pipe.
 *
 * @param input The input value.
 * @param pipe The pipe to be executed.
 * @param info The validation info.
 *
 * @returns The output value.
 */
export function executePipe<TValue>(
  input: TValue,
  pipe: Pipe<TValue>,
  info: ValidateInfo
): Result<TValue> {
  // Create output and issues
  let output: TValue = input;
  const issues: Issue[] = [];

  // Execute any action of pipe
  for (const action of pipe) {
      const result = action(output, info);
      if (!result.success) {
        if (info.abortEarly || info.abortPipeEarly) {
          return result
        }
        issues.push(...result.issues);

      } else {
        output = result.output;
      }
  }

  // Throw error if there are issues
  if (issues.length) {
    return notOk(issues);
  }

  // Return output of pipe
  return ok(output);
}
