'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('mocha');

const { generateModelSource } = require('warp-drive/generators/model');
const { generateUnitTestSource } = require('warp-drive/generators/tests');

const fixture = require('./helpers/fixture.js');

describe('generate: model', function () {
  it('model', function () {
    const source = generateModelSource('foo', []);
    assert.match(source, /import Model from '@ember-data\/model';/);
    assert.match(source, /export default class FooModel extends Model \{/);
  });

  it('model with attrs', function () {
    const source = generateModelSource('foo', [
      'misc',
      'skills:array',
      'isActive:boolean',
      'birthday:date',
      'someObject:object',
      'age:number',
      'name:string',
      'customAttr:custom-transform',
    ]);

    assert.match(source, /import Model, \{ attr \} from '@ember-data\/model';/);
    assert.match(source, /export default class FooModel extends Model \{/);
    assert.match(source, /^ {2}@attr misc;$/m);
    assert.match(source, /^ {2}@attr\('array'\) skills;$/m);
    assert.match(source, /^ {2}@attr\('boolean'\) isActive;$/m);
    assert.match(source, /^ {2}@attr\('date'\) birthday;$/m);
    assert.match(source, /^ {2}@attr\('object'\) someObject;$/m);
    assert.match(source, /^ {2}@attr\('number'\) age;$/m);
    assert.match(source, /^ {2}@attr\('string'\) name;$/m);
    assert.match(source, /^ {2}@attr\('custom-transform'\) customAttr;$/m);
  });

  it('model with belongsTo', function () {
    const source = generateModelSource('comment', ['post:belongs-to', 'author:belongs-to:user']);

    assert.match(source, /import Model, \{ belongsTo \} from '@ember-data\/model';/);
    assert.match(source, /export default class CommentModel extends Model \{/);
    assert.match(source, /^ {2}@belongsTo\('post', \{ async: false, inverse: null \}\) post;$/m);
    assert.match(source, /^ {2}@belongsTo\('user', \{ async: false, inverse: null \}\) author;$/m);
  });

  it('model with hasMany', function () {
    const source = generateModelSource('post', ['comments:has-many', 'otherComments:has-many:comment']);

    assert.match(source, /import Model, \{ hasMany \} from '@ember-data\/model';/);
    assert.match(source, /export default class PostModel extends Model \{/);
    assert.match(source, /^ {2}@hasMany\('comment', \{ async: false, inverse: null \}\) comments;$/m);
    assert.match(source, /^ {2}@hasMany\('comment', \{ async: false, inverse: null \}\) otherComments;$/m);
  });

  it('model-test', function () {
    const source = generateUnitTestSource('Model', 'foo', 'my-app');
    assert.equal(source, fixture('model-test/foo-default.js'));
  });

  it('model-test in addon', function () {
    const source = generateUnitTestSource('Model', 'foo', 'dummy');
    assert.equal(source, fixture('model-test/addon-default.js'));
  });
});
