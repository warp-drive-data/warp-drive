<!-- If you are proposing a new RFC, please fill out the below template. 
If not, please remove the below contents
-->

# Propose {{RFC_NAME}}

<!-- Update the below to link to the rendered version of your RFC. 
The URL can be interpolated below or can be found by going to the files tab
and choosing `View file' from the `...' menu in the right hand corner of the file. -->

## [Rendered](https://github.com/{{username}}/rfcs/blob/{{branch}}/text/{{rfc_number}}-{{rfc_slug}}.md)

## Summary

This pull request is proposing a new RFC.

To succeed, it will need to pass into the [Exploring Stage](https://github.com/emberjs/rfcs#exploring), followed by the [Accepted Stage](https://github.com/emberjs/rfcs#accepted).

A Proposed or Exploring RFC may also move to the [Closed Stage](https://github.com/emberjs/rfcs#closed) if it is withdrawn by the author or if it is rejected by the Ember team. This requires an "FCP to Close" period.

**An FCP is required before merging this PR to advance to Accepted.**

Upon merging this PR, automation will open a draft PR for this RFC to move to the [Ready for Released Stage](https://github.com/emberjs/rfcs#ready-for-release).

<details>
  <summary>Exploring Stage Description</summary>

This stage is entered when the Ember team believes the concept described in the RFC should be pursued, but the RFC may still need some more work, discussion, answers to open questions, and/or a champion before it can move to the next stage.

An RFC is moved into Exploring with consensus of the relevant teams. The relevant team expects to spend time helping to refine the proposal. The RFC remains a PR and will have an `Exploring` label applied.

An Exploring RFC that is successfully completed can move to [Accepted](https://github.com/emberjs/rfcs#accepted) with an FCP is required as in the existing process. It may also be moved to [Closed](https://github.com/emberjs/rfcs#closed) with an FCP.
</details>

<details>
  <summary>Accepted Stage Description</summary>

To move into the "accepted stage" the RFC must have complete prose and have successfully passed through an "FCP to Accept" period in which the community has weighed in and consensus has been achieved on the direction. The relevant teams believe that the proposal is well-specified and ready for implementation. The RFC has a champion within one of the relevant teams.

If there are unanswered questions, we have outlined them and expect that they will be answered before [Ready for Release](https://github.com/emberjs/rfcs#ready-for-release). 

When the RFC is accepted, the PR will be merged, and automation will open a new PR to move the RFC to the [Ready for Release](https://github.com/emberjs/rfcs#ready-for-release) stage. That PR should be used to track implementation progress and gain consensus to move to the next stage.

</details>

## Checklist to move to Exploring

- [ ] The team believes the concepts described in the RFC should be pursued.
- [ ] The label `S-Proposed` is removed from the PR and the label `S-Exploring` is added. 
- [ ] The Ember team is willing to work on the proposal to get it to Accepted

## Checklist to move to Accepted

- [ ] This PR has had the `Final Comment Period` label has been added to start the FCP
- [ ] The RFC is announced in #news-and-announcements in the Ember Discord.
- [ ] The RFC has complete prose, is well-specified and ready for implementation.
  - [ ] All sections of the RFC are filled out.
  - [ ] Any unanswered questions are outlined and expected to be answered before Ready for Release.
  - [ ] "How we teach this?" is sufficiently filled out.
- [ ] The RFC has a champion within one of the relevant teams.
- [ ] The RFC has consensus after the FCP period.
