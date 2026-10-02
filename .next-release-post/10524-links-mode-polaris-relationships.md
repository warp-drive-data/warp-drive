---
releases: ["5.9"]
---
`linksMode` relationships no longer require a `links.related` link when the payload is "fully
linked". A `belongsTo` is valid with `data: null` or with a related resource that's in
`included`. A `hasMany` is valid with `data: []` or when every member is in `included`. A
relationship with no `data` key still needs a related link. In PolarisMode, a sync `linksMode`
`belongsTo` can now be set on an editable (checked-out) record, and resources built with
`withDefaults` get a `$key` field that returns the record's `ResourceKey`. Also, pushing
`data: null` alongside a link no longer logs a spurious "link but no primary data" warning. See
[LinksMode](/guides/the-manual/misc/links-mode.md).
