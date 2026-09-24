import type { ResourceDocument } from '@warp-drive/core/types/spec/document';

import { checkResourcePresent, type Reporter, type ResourceInfo, type ResourcePresence } from '../utils';

/**
 * Validates that all `data` members of relationships have a matching
 * resource object in the `included` or `data` section of the document.
 *
 * Optionally: validates that all resource objects in `included` are reachable
 * from at least one relationship `data` member in the primary data. This is a
 * spec requirement but has allowed caveats such as for sparse-fields wherein
 * related resources may be present with the linkage property omitted.
 * This setting is on by default but can be disabled by setting `strict.enforceReachable`
 * to false.
 *
 * Version: 1.1
 * Section: 7.4
 * Link: https://jsonapi.org/format/#document-compound-documents
 */
export function validateFullLinkage(reporter: Reporter, doc: ResourceDocument): void {
  const { presence } = reporter;

  // validate that all `data` members of relationships have a matching
  // resource object in the `included` or `data` section of the document.

  // for each type
  for (const type of presence.all.keys()) {
    const typeMap = presence.all.get(type);
    // for each id of the type
    for (const id of typeMap!.keys()) {
      const resources = typeMap!.get(id)!;
      // for each occurrence of the resource
      for (const resourceInfo of resources) {
        const relationships = resourceInfo.data.relationships;
        if (relationships) {
          // for each relationship the occurrence has
          for (const relName of Object.keys(relationships)) {
            const rel = relationships[relName];
            if (rel && 'data' in rel && rel.data !== null) {
              // for each linkage in the relationship
              if (Array.isArray(rel.data)) {
                for (const linkage of rel.data) {
                  if (!checkResourcePresent(presence, linkage as { type: string; id: string })) {
                    // report missing linkage
                    const pathLike =
                      resourceInfo.index === null
                        ? [resourceInfo.location, 'relationships', relName, 'data']
                        : [resourceInfo.location, resourceInfo.index, 'relationships', relName, 'data'];
                    const index = rel.data.indexOf(linkage as { type: string; id: string });
                    pathLike.push(index);
                    reporter.error(
                      pathLike,
                      `No ResourceObject matching the ResourceIdentifier linkage '${linkage.type}:${linkage.id}' was found in this payload. Exclude the relationship data, include the related ResourceObject, or consider using a link to reference this relationship instead.`,
                      'value'
                    );
                  }
                }
              } else {
                if (!checkResourcePresent(presence, rel.data as { type: string; id: string })) {
                  const pathLike =
                    resourceInfo.index === null
                      ? [resourceInfo.location, 'relationships', relName, 'data']
                      : [resourceInfo.location, resourceInfo.index, 'relationships', relName, 'data'];
                  reporter.error(
                    pathLike,
                    `No ResourceObject matching the ResourceIdentifier linkage '${rel.data!.type}:${rel.data!.id}' was found in this payload. Exclude the relationship data, include the related ResourceObject, or consider using a link to reference this relationship instead.`,
                    'value'
                  );
                }
              }
            }
          }
        }
      }
    }
  }

  // Optionally: validate that all resources in `included` are reachable
  // from at least one relationship `data` member in the primary data.
  const seen = walkResourceGraph(presence);

  // iterate all included resources
  for (const type of presence.included.keys()) {
    const typeMap = presence.included.get(type);
    for (const id of typeMap!.keys()) {
      const seenId = `${type}:${id}`;
      if (!seen.has(seenId)) {
        // report unreachable included resource
        const resources = typeMap!.get(id)!;
        for (const resourceInfo of resources) {
          const { index, location } = resourceInfo;
          const pathLike = index !== null ? [location, index] : [location];
          // TODO if fields were present, attempt to use them to determine if this resource was intentionally excluded from relationships
          // as part of sparseFields.
          if (reporter.strict.enforceReachable !== false) {
            reporter.error(
              pathLike,
              `The included ResourceObject '${type}:${id} is unreachable by any path originating from a primary ResourceObject. Exclude this ResourceObject or add the appropriate relationship linkages.`,
              'value'
            );
          } else {
            reporter.warn(
              pathLike,
              `The included ResourceObject '${type}:${id} is unreachable by any path originating from a primary ResourceObject. Exclude this ResourceObject or add the appropriate relationship linkages.`,
              'value'
            );
          }
        }
      }
    }
  }
}

/**
 * builds a set of all reachable resources by walking the resource graph
 * starting from the primary data resources.
 */
function walkResourceGraph(presence: ResourcePresence): Set<string> {
  const seen: Set<string> = new Set<string>();
  for (const resourceType of presence.data.keys()) {
    for (const resourceId of presence.data.get(resourceType)!.keys()) {
      walkResource(presence, seen, presence.data.get(resourceType)!.get(resourceId)!);
    }
  }
  return seen;
}

function walkResource(presence: ResourcePresence, seen: Set<string>, resource: ResourceInfo[]) {
  const resourceType = resource[0].data.type;
  const resourceId = resource[0].data.id!;
  const seenId = `${resourceType}:${resourceId}`;

  if (seen.has(seenId)) {
    return;
  }

  seen.add(`${resourceType}:${resourceId}`);
  for (const resourceInfo of presence.all.get(resourceType)!.get(resourceId)!) {
    const relationships = resourceInfo.data.relationships;
    if (relationships) {
      for (const relName of Object.keys(relationships)) {
        const rel = relationships[relName];
        if (rel && 'data' in rel && rel.data !== null) {
          // for each linkage in the relationship
          if (Array.isArray(rel.data)) {
            for (const linkage of rel.data) {
              if (checkResourcePresent(presence, linkage as { type: string; id: string })) {
                walkResource(presence, seen, presence.all.get(linkage.type)!.get(linkage.id!)!);
              }
            }
          } else {
            if (checkResourcePresent(presence, rel.data as { type: string; id: string })) {
              walkResource(presence, seen, presence.all.get(rel.data!.type)!.get(rel.data!.id!)!);
            }
          }
        }
      }
    }
  }
}
