---
releases: ["5.9"]
---
`withArrayDefaults` from `@warp-drive/legacy/model-fragments` takes an optional second argument
for the item type: `withArrayDefaults('titles', 'string')` produces a field of type
`array:string`, matching `array('string')` in ember-data-model-fragments. Without it the field
type is now `array`. It used to be derived from the singularized field name (`array:title`), so
if you relied on that, pass the item type explicitly.
