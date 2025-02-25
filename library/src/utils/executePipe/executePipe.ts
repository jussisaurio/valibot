import type { IssueReason, Issues } from '../../error/index.ts';
import type { ParseInfo, ParseResult, Pipe } from '../../types.ts';
import { getPipeInfo } from '../getPipeInfo/getPipeInfo.ts';

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
  parseInfo: ParseInfo | undefined,
  reason: IssueReason
): ParseResult<TValue> {
  // Create issues and output
  let issues: Issues | undefined;
  let output: TValue = input;

  if (!pipe.length) {
    return { output };
  }

  const info = getPipeInfo(parseInfo, reason);

  // Execute any action of pipe
  for (const action of pipe) {
    const result = action(output, info);

    // If there are issues, capture them
    if (result.issues) {
      if (issues) {
        for (const issue of result.issues) {
          issues.push(issue);
        }
      } else {
        issues = result.issues;
      }

      // If necessary, abort early
      if (info.abortEarly || info.abortPipeEarly) {
        break;
      }

      // Otherwise, overwrite output
    } else {
      output = result.output;
    }
  }

  // Return pipe result
  return issues ? { issues } : { output };
}
