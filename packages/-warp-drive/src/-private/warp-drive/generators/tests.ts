import { dasherize, friendlyTestDescription } from './strings.ts';

export type TestKind = 'Model' | 'Adapter' | 'Serializer' | 'Transform';

const BODIES: Record<TestKind, (dasherizedName: string) => string> = {
  Model: (name) => `  test('it exists', function (assert) {
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('${name}', {});
    assert.ok(model, 'model exists');
  });`,
  Adapter: (name) => `  test('it exists', function (assert) {
    const adapter = this.owner.lookup('adapter:${name}');
    assert.ok(adapter, 'adapter exists');
  });`,
  Serializer: (name) => `  test('it exists', function (assert) {
    const store = this.owner.lookup('service:store');
    const serializer = store.serializerFor('${name}');

    assert.ok(serializer, 'serializer exists');
  });

  test('it serializes records', function (assert) {
    const store = this.owner.lookup('service:store');
    const record = store.createRecord('${name}', {});

    const serializedRecord = record.serialize();

    assert.ok(serializedRecord, 'it serializes records');
  });`,
  Transform: (name) => `  test('it exists', function (assert) {
    const transform = this.owner.lookup('transform:${name}');
    assert.ok(transform, 'transform exists');
  });`,
};

/**
 * Generates a qunit unit-test module for a model/adapter/serializer/transform.
 */
export function generateUnitTestSource(kind: TestKind, name: string, modulePrefix: string): string {
  const dasherizedName = dasherize(name);
  const description = friendlyTestDescription(name, 'Unit', kind);
  const body = BODIES[kind](dasherizedName);

  return `import { setupTest } from '${modulePrefix}/tests/helpers';
import { module, test } from 'qunit';

module('${description}', function (hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
${body}
});
`;
}
