# Write Documentation

Use this skill whenever you're writing or changing documentation in this repo: a doc comment
(TSDoc), a guide, an `upgrading/` or `blog/` page, a package README or `src/index.md`, or one of
these agent skills. The human contributor guides under
[Writing Documentation](/guides/contributing/writing-documentation/index.md) are the source of
truth for *what* good documentation looks like here; this skill is only about *how* to produce it
with the person you're working with. It links to those guides rather than restating them, because
a copied rule goes stale silently and gets followed confidently, while a link that goes stale
fails the link checker and gets fixed.

## Steps

For a one-line fix (a typo, a dead link, a wrong version number), skip to step 6 and run only its
last two bullets: the checks and the label.

1. Pick the type of doc first. A request like "document X" rarely means one file. Use
   [Which Type of Doc Should I Write?](/guides/contributing/writing-documentation/index.md#which-type-of-doc-should-i-write)
   to decide whether X needs TSDoc, a guide, a permanent-URL page, a README, or several of those,
   and confirm that split with the user before drafting anything. If the answer is an RFC, this
   isn't the skill for it: switch to [Writing and Implementing RFCs](./writing-and-implementing-rfcs.md).
2. Read the guide for that type of doc before you write a word, and treat it as binding:

   | Type of doc | Read |
   | --- | --- |
   | TSDoc comments | [Documenting APIs](/guides/contributing/writing-documentation/writing-api-docs.md) |
   | A package `README.md` or its `src/index.md` landing page | [Writing READMEs](/guides/contributing/writing-documentation/writing-readmes.md) |
   | Pages under `guides/`, including tutorials in `guides/tutorials/` | [Writing Guides](/guides/contributing/writing-documentation/writing-guides.md) |
   | Pages under `upgrading/` or `blog/` | [Writing Permanent Content](/guides/contributing/writing-documentation/writing-permanent-content.md) |
   | Files under `warp-drive-packages/memory-alpha/skills/` | [Writing Agent Skills](/guides/contributing/writing-documentation/writing-agent-skills.md) |

   Those pages own the rules on tags, links and examples, audiences, nav metadata, and permanent
   URLs. Don't paraphrase them from memory; if a rule matters to your task, go read the sentence.
3. Gather context before drafting. The person asking knows things the source can't tell you.
   Ask, in a few short rounds rather than one wall of questions, and skip anything the type of
   doc makes moot. Steps 1 and 3, and agreeing the headings in step 4, can be a single round.
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
5. Reader-test before you call it done. Hand the finished text, and only the text (for TSDoc, the
   comment together with the signature it documents), to a fresh agent instance that has none of
   your conversation, along with three to five questions a real
   reader would bring to it, and fix whatever it gets wrong or has to guess at. If you can't spawn
   one, ask the user to paste the text into a fresh session and relay the answers. For API docs
   the question is always some form of "how do I use this?"; if the answer requires opening the
   source, the doc is missing an example or a link. For a guide, ask what prior knowledge it
   assumes and whether that matches the audience you chose in step 3. For an `upgrading/` or
   `blog/` page, ask which version the page is written for and whether a reader on a different
   version can tell.
6. Check, preview, then hand off:
   - For API docs, every item in
     [Content Standards](/guides/contributing/writing-documentation/writing-api-docs.md#content-standards),
     and nothing private left in the published docs per
     [Ignored Doc Comments](/guides/contributing/writing-documentation/writing-api-docs.md#ignored-doc-comments).
   - Every other type of doc a change touches is updated too: see the
     [Cross-Documentation Checklist](/guides/contributing/writing-documentation/index.md#cross-documentation-checklist).
   - Run `pnpm lint:docs` from the repo root, then build and open the affected pages as described
     in [Previewing Your Changes](/guides/contributing/writing-documentation/index.md#previewing-your-changes).
   - Label the pull request `:label: doc` (the label's name literally contains `:label:`);
     Previewing Your Changes says what that deploys.

## Gotchas

- The docs dev server builds the sidebar once, when VitePress loads its config. A page you add
  while `pnpm start` is running won't appear in the sidebar until you restart it, even though the
  page itself is served.
- `pnpm lint:docs` checks links in `guides/`, `upgrading/`, `blog/`, `rfcs/`, and the agent
  skills. It does not check package READMEs; open those on GitHub to verify their links.
- VitePress compiles markdown to Vue, so a bare `<thing>` in prose is parsed as an element and
  fails the build. Put angle brackets in code spans. `pnpm lint:docs` does not catch this; only
  the build does.
