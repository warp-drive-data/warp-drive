import type Owner from '@ember/owner';

import type { Store } from '@warp-drive/core';
import type { Value } from '@warp-drive/core/types/json/raw';
import type { SingleResourceDocument } from '@warp-drive/core/types/spec/json-api-raw';

export function simplePayloadNormalize(
  store: Store,
  owner: Owner,
  payload: SingleResourceDocument
): SingleResourceDocument {
  const fields = store.schema.fields(payload.data);
  const attrs = payload.data.attributes;

  if (!attrs) {
    return payload;
  }

  Object.keys(attrs).forEach((key) => {
    const schema = fields.get(key);

    if (schema) {
      if (schema.type) {
        const transform = owner.lookup(`transform:${schema.type}`) as {
          deserialize(v: Value): Value;
        };
        const value = attrs[key];

        attrs[key] = transform.deserialize(value);
      }
    }
  });

  return payload;
}
