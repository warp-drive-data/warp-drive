---
title: Multiple Frameworks on One Page
description: Learn why using more than one framework on the same page with WarpDrive means composing each framework's signal configuration into one.
---

# Can I use multiple frameworks on one page (for instance Ember and React)?

Yes. One ***Warp*Drive** store can drive components from more than one framework on the same page,
but you need to compose the frameworks' signal configurations into one.

Each framework generally only re-renders in response to its own signals implementation: Ember
re-renders for its autotracking tags, and React components re-render for the signals that
`@warp-drive/react` subscribes them to. Each framework's `install` entry point configures
***Warp*Drive** to use that framework's signals alone, so with only one of them installed,
components in the other framework won't update when data changes.

There's no built-in helper for composing them. Instead you write one short `setupSignals` call that
builds each framework's configuration and creates a signal for each framework on every reactive
field. The same approach works for any framework that has a ***Warp*Drive** signals configuration,
or one you write yourself.

For a complete example with Ember and React, see
[Using Ember and React on the Same Page](/guides/the-manual/cookbook/multiple-frameworks-on-one-page.md).
