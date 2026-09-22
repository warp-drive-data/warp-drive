/*
  Creates `n` `json-record` resources whose attributes include raw JSON
  values (an object and an array) alongside primitives, so that pushing
  the payload exercises attribute change detection on non-primitive values.

  `settings` is an object with 5 string keys.
  `tags` is an array of 10 short strings.
  `items` is an array of 10 objects, each with 3 primitive keys and one
  nested object of 2 booleans, so equality checks have to recurse three
  levels deep.
*/
const SETTING_KEYS = ['theme', 'locale', 'timezone', 'density', 'layout'];
const TAG_WORDS = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa'];
const ITEM_COUNT = 10;

type JSONRecordItem = {
  id: string;
  label: string;
  qty: number;
  flags: { pinned: boolean; hidden: boolean };
};

type JSONRecordAttributes = {
  name: string;
  count: number;
  settings: Record<string, string>;
  tags: string[];
  items: JSONRecordItem[];
};

type JSONAPIResource = {
  id: string;
  type: string;
  attributes: JSONRecordAttributes;
};

type JSONAPIPayload = {
  data: JSONAPIResource[];
};

function createJsonRecordsPayload(n: number): JSONAPIPayload {
  const data = new Array<JSONAPIResource>(n);

  for (let i = 0; i < n; i++) {
    const settings: Record<string, string> = {};
    for (const key of SETTING_KEYS) {
      settings[key] = `${key}-${i}`;
    }

    const items = new Array<JSONRecordItem>(ITEM_COUNT);
    for (let j = 0; j < ITEM_COUNT; j++) {
      items[j] = {
        id: `urn:item:${i}:${j}`,
        label: `Item ${j}`,
        qty: (i + j) % 13,
        flags: { pinned: j % 2 === 0, hidden: j % 3 === 0 },
      };
    }

    data[i] = {
      id: `urn:json-record:${i}`,
      type: 'json-record',
      attributes: {
        name: `Record ${i}`,
        count: i,
        settings,
        tags: TAG_WORDS.map((word) => `${word}-${i % 7}`),
        items,
      },
    };
  }

  return { data };
}

/**
 * Returns a copy of `payload` in which every record's `count` differs
 * from the original, leaving `name`, `settings`, `tags` and `items` unchanged.
 */
function incrementCounts(payload: JSONAPIPayload): JSONAPIPayload {
  const changed = structuredClone(payload);

  for (const resource of changed.data) {
    resource.attributes.count = resource.attributes.count + 1;
  }

  return changed;
}

module.exports = { createJsonRecordsPayload, incrementCounts };
