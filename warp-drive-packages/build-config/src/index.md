# @warp-drive/build-config

This package is the implementation home of the `setConfig` build plugin that configures
deprecations, optional features, development/testing support and debug logging. Apps import it
as {@link @warp-drive/core!build-config @warp-drive/core/build-config}, which re-exports every
entry point below; the documentation for each lives on the `@warp-drive/core` page it maps to.

| `@warp-drive/build-config` entry | re-exported as                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------- |
| `.` (root)                       | {@link @warp-drive/core!build-config @warp-drive/core/build-config}                                 |
| `/babel-macros`                  | {@link @warp-drive/core!build-config/babel-macros @warp-drive/core/build-config/babel-macros}       |
| `/canary-features`               | {@link @warp-drive/core!build-config/canary-features @warp-drive/core/build-config/canary-features} |
| `/debugging`                     | {@link @warp-drive/core!build-config/debugging @warp-drive/core/build-config/debugging}             |
| `/deprecations`                  | {@link @warp-drive/core!build-config/deprecations @warp-drive/core/build-config/deprecations}       |
| `/env`                           | `@warp-drive/core/build-config/env` (internal, no API page)                                         |
| `/macros`                        | `@warp-drive/core/build-config/macros` (internal, no API page)                                      |
