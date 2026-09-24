import Model, { attr, hasMany } from '@warp-drive/legacy/model';

export default Model.extend({
  parentName: attr('string'),
  children: hasMany('child', { async: true, inverse: 'parent' }),
});
