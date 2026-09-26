---
url: https://canary.warp-drive.io/api/@ember-data/request/fetch.md
description: >-
  Legacy entry re-exporting `Fetch`, a request handler that sends each request
  with `fetch` and parses the response as JSON.
---

A basic Fetch Handler which converts a request into a
`fetch` call presuming the response to be `json`.

```ts
import Fetch from '@ember-data/request/fetch';

manager.use([Fetch]);
```
