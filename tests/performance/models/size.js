import Model, { attr, hasMany } from '@warp-drive/legacy/model';

export default Model.extend({
  name: attr('string'),
  cars: hasMany('car', { async: false, inverse: 'size' }),
});
