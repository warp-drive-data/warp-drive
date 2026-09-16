---
url: /pr-preview/pr-11111/api/@warp-drive/utilities/type-aliases/UrlOptions.md
---

# &#x20;UrlOptions

```ts
type UrlOptions = 
  | FindRecordUrlOptions
  | QueryUrlOptions
  | FindManyUrlOptions
  | FindRelatedCollectionUrlOptions
  | FindRelatedResourceUrlOptions
  | CreateRecordUrlOptions
  | UpdateRecordUrlOptions
  | DeleteRecordUrlOptions
  | GenericUrlOptions;
```

Defined in: [index.ts:426](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/utilities/src/index.ts#L426)

The union of all `op`-specific option shapes accepted by [buildBaseURL](../functions/buildBaseURL.md), one of:

* [FindRecordUrlOptions](../interfaces/FindRecordUrlOptions.md)
* [QueryUrlOptions](../interfaces/QueryUrlOptions.md)
* [FindManyUrlOptions](../interfaces/FindManyUrlOptions.md)
* [FindRelatedCollectionUrlOptions](../interfaces/FindRelatedCollectionUrlOptions.md)
* [FindRelatedResourceUrlOptions](../interfaces/FindRelatedResourceUrlOptions.md)
* [CreateRecordUrlOptions](../interfaces/CreateRecordUrlOptions.md)
* [UpdateRecordUrlOptions](../interfaces/UpdateRecordUrlOptions.md)
* [DeleteRecordUrlOptions](../interfaces/DeleteRecordUrlOptions.md)
* [GenericUrlOptions](../interfaces/GenericUrlOptions.md)
