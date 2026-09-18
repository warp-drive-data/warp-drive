---
url: /api/@warp-drive/utilities/types/UrlOptions.md
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

Defined in: [index.ts:426](https://github.com/warp-drive-data/warp-drive/blob/315931ffedd7d94eeba0879ee531991fe4ca5179/warp-drive-packages/utilities/src/index.ts#L426)

The union of all `op`-specific option shapes accepted by [buildBaseURL](../functions/buildBaseURL.md), one of:

* [FindRecordUrlOptions](FindRecordUrlOptions.md)
* [QueryUrlOptions](QueryUrlOptions.md)
* [FindManyUrlOptions](FindManyUrlOptions.md)
* [FindRelatedCollectionUrlOptions](FindRelatedCollectionUrlOptions.md)
* [FindRelatedResourceUrlOptions](FindRelatedResourceUrlOptions.md)
* [CreateRecordUrlOptions](CreateRecordUrlOptions.md)
* [UpdateRecordUrlOptions](UpdateRecordUrlOptions.md)
* [DeleteRecordUrlOptions](DeleteRecordUrlOptions.md)
* [GenericUrlOptions](GenericUrlOptions.md)
