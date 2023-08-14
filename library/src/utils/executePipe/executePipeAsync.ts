import { type Issue, type Issues, ValiError } from '../../error/index.ts';
import { notOk, ok, type PipeAsync, type Result, type ValidateInfo } from '../../types.ts';

/**
 * Executes the async validation and transformation pipe.
 *
 * @param input The input value.
 * @param pipe The pipe to be executed.
 * @param info The validation info.
 *
 * @returns The output value.
 */
export async function executePipeAsync<TValue>(
  input: TValue,
  pipe: PipeAsync<TValue>,
  info: ValidateInfo
): Promise<Result<TValue>> {
  // Create output and issues
  let output: TValue = input;
  const issues: Issue[] = [];

  // Execute any action of pipe
  for (const action of pipe) {
      const result = await action(output, info);
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
