---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/utilities/type-aliases/UrlOptions.md
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

Defined in: [index.ts:426](https://github.com/warp-drive-data/warp-drive/blob/b666081685917e201667ff79e86b876c0e12fb8c/warp-drive-packages/utilities/src/index.ts#L426)

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
