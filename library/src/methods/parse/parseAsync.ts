import { Issues, ValiError } from '../../error/index.ts';
import type {
  BaseSchema,
  BaseSchemaAsync,
  Output,
  ParseInfo,
} from '../../types.ts';

/**
 * Parses unknown input based on a schema.
 *
 * @param schema The schema to be used.
 * @param input The input to be parsed.
 * @param info The optional parse info.
 *
 * @returns The parsed output.
 */
export async function parseAsync<TSchema extends BaseSchema | BaseSchemaAsync>(
  schema: TSchema,
  input: unknown,
  info?: Pick<ParseInfo, 'abortEarly' | 'abortPipeEarly'>
): Promise<Output<TSchema>> {
  const result = await schema.parse(input, info);

  if (!result.success) {
    throw new ValiError(result.issues as Issues);
  }

  return result.output as Output<TSchema>;
}
