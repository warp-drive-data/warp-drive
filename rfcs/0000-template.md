---
# draft: true hides this template from the RFCs sidebar nav (see getRfcsStructure in
# docs-viewer/src/site-utils.ts) without removing its page -- it's still directly linkable from
# rfcs/index.md. Do not set this on an actual RFC copied from this template.
draft: true
title: # Replace with your RFC's title -- do not start it with "WarpDrive" (the sync bot adds a
  # "WarpDrive: " prefix automatically for the emberjs/rfcs copy and PR title; a local title
  # that already starts with "WarpDrive" would end up doubled there)
warp-drive-rfc: # Fill in with the next available number in this repo (also use it as the file's 000N- prefix)
emberjs-rfc: # Leave blank -- filled in by the sync bot once this RFC is first mirrored to emberjs/rfcs
emberjs-pr: # Leave blank -- filled in by the sync bot
emberjs-branch: # Leave blank -- filled in by the sync bot
sync-hash: # Leave blank -- maintained by the sync bot
stage: proposed
start-date: # In format YYYY-MM-DDT00:00:00.000Z
release-date: # In format YYYY-MM-DDT00:00:00.000Z
release-versions:
teams: # delete teams that aren't relevant -- see https://github.com/emberjs/rfcs#relevant-teams
  - cli
  - data
  - framework
  - learning
  - steering
  - typescript
prs:
  accepted: # Leave blank -- filled in by the sync bot once the emberjs/rfcs PR is opened
project-link:
suite:
---

<!---
Directions for above:

title: The title of your RFC (used for the docs-site sidebar; keep the H1 below in sync)
warp-drive-rfc: This repo's RFC number -- match the file's 000N- prefix
emberjs-rfc, emberjs-pr, emberjs-branch, sync-hash: Leave all four blank. The sync bot
  (see scripts/rfc-sync/README.md) fills these in once this RFC is first opened against
  emberjs/rfcs, and keeps sync-hash current afterward. Never hand-edit sync-hash.
stage: Leave as "proposed" -- this repo mirrors Ember's RFC stages
  (https://github.com/emberjs/rfcs#stages) as the RFC progresses
start-date: Fill in with today's date, e.g. 2032-12-01T00:00:00.000Z
release-date: Leave as is
release-versions: Leave as is
teams: Include only the team(s) for which this RFC applies
prs:
  accepted: Leave blank -- filled in by the sync bot
project-link: Leave as is
suite: Leave as is
-->

<!-- Replace "RFC title" with the title of your RFC -->

# RFC title

## Summary

> One paragraph explanation of the feature.

## Motivation

> Why are we doing this? What use cases does it support? What is the expected
outcome?

## Detailed design

> This is the bulk of the RFC.

> Explain the design in enough detail for somebody
familiar with the framework to understand, and for somebody familiar with the
implementation to implement. This should get into specifics and corner-cases,
and include examples of how the feature is used. Any new terminology should be
defined here.

> Please keep in mind any implications within the Ember ecosystem, such as:
> - Lint rules (ember-template-lint, eslint-plugin-ember, eslint-plugin-ember-data / eslint-plugin-warp-drive) that should be added, modified or removed
> - Features that are replaced or made obsolete by this feature and should eventually be deprecated
> - Ember Inspector and debuggability
> - Server-side Rendering
> - Ember Engines
> - The Addon Ecosystem
> - IDE Support
> - Blueprints that should be added or modified

## How we teach this

> What names and terminology work best for these concepts and why? How is this
idea best presented? As a continuation of existing patterns, or as a
wholly new one?

> Would the acceptance of this proposal mean the WarpDrive guides must be
re-organized or altered? Does it change how WarpDrive is taught to new users
at any level?

> How should this feature be introduced and taught to existing WarpDrive
users?

> Keep in mind the variety of learning materials: API docs, guides, blog posts, tutorials, etc.

## Drawbacks

> Why should we *not* do this? Please consider the impact on teaching WarpDrive,
on the integration of this feature with other existing and planned features,
on the impact of the API churn on existing apps, etc.

> There are tradeoffs to choosing any path, please attempt to identify them here.

## Alternatives

> What other designs have been considered? What is the impact of not doing this?

> This section could also include prior art, that is, how other frameworks or libraries in the same domain have solved this problem.

## Unresolved questions

> Optional, but suggested for first drafts. What parts of the design are still
TBD?
