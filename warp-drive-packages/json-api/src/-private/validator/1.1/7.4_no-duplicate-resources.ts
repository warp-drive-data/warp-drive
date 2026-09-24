import type { ResourceDocument } from '@warp-drive/core/types/spec/document';

import type { Reporter } from '../utils';

/**
 * A common mistake, especially during development when mocking responses, is to
 * return the same resource multiple times, sometimes with differing attributes or
 * relationships.
 *
 * Version: 1.1
 * Section: 7.4
 * Link: https://jsonapi.org/format/#document-compound-documents
 */
export function validateNoDuplicateResources(reporter: Reporter, doc: ResourceDocument): void {
  const { presence } = reporter;

  // validate that all `data` members of relationships have a matching
  // resource object in the `included` or `data` section of the document.

  // for each type
  for (const type of presence.all.keys()) {
    const typeMap = presence.all.get(type);
    // for each id of the type
    for (const id of typeMap!.keys()) {
      const resources = typeMap!.get(id)!;
      if (resources.length > 1) {
        for (const resourceInfo of resources) {
          const { index, location } = resourceInfo;
          const pathLike = index !== null ? [location, index] : [location];
          const occurrences = resources
            .filter((r) => r !== resourceInfo)
            .map((r) => (r.index !== null ? `${r.location}[${r.index}]` : r.location));
          const ourPath = index !== null ? `${location}[${index}]` : location;
          const errorMsg = `Duplicate ResourceObject detected for '${type}:${id}'. Each ResourceObject MUST appear only once in a {json:api} Document.\n\nThis Occurrence:\n\t- ${ourPath}\n\nOther Occurrences:\n\t- ${occurrences.join('\n\t- ')}`;

          reporter.error(pathLike, errorMsg, 'value');
        }
      }
    }
  }
}
