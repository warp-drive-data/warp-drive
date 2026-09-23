# Write Documentation

Use this skill whenever you're writing or changing documentation in this repo: a TSDoc comment,
a guide, an `upgrading/` or `blog/` page, a package README or `src/index.md`, or one of these
agent skills. The human contributor guides under
[Writing Documentation](/guides/contributing/writing-documentation/index.md) are the source of
truth for *what* good documentation looks like here; this skill is only about *how* to produce it
with the person you're working with, and it links to those guides rather than restating them.

## Steps

1. Pick the type of doc first. A request like "document X" rarely means one file. Use
   [Which Type of Doc Should I Write?](/guides/contributing/writing-documentation/index.md#which-type-of-doc-should-i-write)
   to decide whether X needs TSDoc, a guide, a permanent-URL page, a README, or several of those,
   and confirm that split with the user before drafting anything.
2. Read the guide for that type of doc before you write a word, and treat it as binding:

   | Type of doc | Read |
   | --- | --- |
   | TSDoc comments, `src/index.md` package pages | [Documenting APIs](/guides/contributing/writing-documentation/writing-api-docs.md) |
   | Pages under `guides/`, including tutorials in `guides/tutorials/` | [Writing Guides](/guides/contributing/writing-documentation/writing-guides.md) |
   | Pages under `upgrading/` or `blog/` | [Writing Permanent Content](/guides/contributing/writing-documentation/writing-permanent-content.md) |
   | Files under `warp-drive-packages/memory-alpha/skills/` | the package [README](https://github.com/warp-drive-data/warp-drive/blob/main/warp-drive-packages/memory-alpha/README.md), plus the existing files in the same directory as a model |

   Those pages own the rules on tags (`@since`, `@internal`, `@deprecated`, `@group`), link and
   example requirements, audiences, nav metadata, and permanent-URL constraints. Don't paraphrase
   them from memory; if a rule matters to your task, go read the sentence.
3. Gather context before drafting. The person asking knows things the source can't tell you.
   Ask, in a few short rounds rather than one wall of questions, and skip anything the type of
   doc makes moot:
   - Who is this for? Use
     [Know Your Audience](/guides/contributing/writing-documentation/index.md#know-your-audience)
     as the menu; the guide for this type of doc narrows it further.
   - What should the reader be able to do after reading it that they couldn't before?
   - Which version does it apply to? The guide for this type of doc says where that goes.
   - Is this the recommended way, a legacy way, or a deprecated way? The guide for this type of
     doc says how to mark each.
   - What already exists? Search `guides/`, `upgrading/`, and the relevant `src/` for the concept
     before writing a competing explanation; extend or link the existing one instead.
4. Draft one section at a time, not the whole thing at once. Agree on the headings first (for
   TSDoc, on which symbols get a summary, an example, and links), scaffold them with placeholders,
   then fill each section and stop for feedback before moving to the next. Make edits surgically
   in place rather than reprinting the document. Ask the user to describe what to change instead
   of editing the draft themselves, so their preferences carry into the sections you haven't
   written yet. Link the guide or symbol that owns a concept instead of re-explaining it.
5. Reader-test before you call it done. Hand the finished text, and only the text, to a fresh
   agent instance that has none of your conversation, along with three to five questions a real
   reader would bring to it, and fix whatever it gets wrong or has to guess at. For API docs the
   question is always some form of "how do I use this?"; if the answer requires opening the source,
   the doc is missing an example or a link. For a guide, ask what prior knowledge it assumes and
   whether that matches the audience you chose in step 3. For an `upgrading/` or `blog/` page, ask
   which version the page is written for and whether a reader on a different version can tell.
6. Check, preview, then hand off:
   - For API docs, every item in
     [Content Standards](/guides/contributing/writing-documentation/writing-api-docs.md#content-standards),
     plus the `@internal` check from the same page's infra overview.
   - Every other type of doc a change touches is updated too: see the
     [Cross-Documentation Checklist](/guides/contributing/writing-documentation/index.md#cross-documentation-checklist).
   - Run `pnpm lint:docs` from the repo root, then build and open the affected pages as described
     in [Previewing Your Changes](/guides/contributing/writing-documentation/index.md#previewing-your-changes).
     Leaked private symbols and markdown that VitePress can't compile (a bare `<angle-bracket>` in
     prose, for one) show up here and nowhere earlier.
   - Label the pull request as that same section describes so reviewers get a deployed preview.

## Why the link-don't-restate rule matters

Rules move. A copy of a rule inside a skill goes stale silently and then gets followed
confidently. A link goes stale loudly, when the link checker or the docs build fails, which is the
failure mode we want — and it lets whoever's reading lazily gather full context from the guide
itself rather than a partial restatement.
