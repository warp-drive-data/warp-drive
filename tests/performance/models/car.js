import Model, { belongsTo, hasMany } from '@warp-drive/legacy/model';

export default Model.extend({
  make: belongsTo('make', { async: false, inverse: 'cars' }),
  size: belongsTo('size', { async: false, inverse: 'cars' }),
  colors: hasMany('color', { async: false, inverse: 'cars' }),
});
