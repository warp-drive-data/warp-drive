---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "The Manual"
  text: Boldly Read What No Dev Has Read Before
  tagline: "Comprehensive Documentation for Engineers Aiming for the Stars 💫"
  image:
    light: /logos/warp-drive/logo-chrome-slab@2x.png
    dark: /logos/warp-drive/logo-yellow-slab.svg
    alt: WarpDrive
  actions:
    - theme: brand
      text: Guides
      link: /guides
    - theme: alt
      text: API Docs
      link: /api
    - theme: alt
      text: Skills
      link: /skills
    - theme: alt
      text: LLM Docs
      link: /llm-docs
    # - theme: alt
    #   text: Contributing
    #   link: /guide/contributing/become-a-contributor

features:
  - title: Connect With Any API
    icon: 🧩
    details: Or All Of Them. No Architectural Lock-in 🔓
  - title: Universal
    icon: 🌌
    details: Fine Grained Reactivity That Works Natively With Any Framework Or Library
  - title: Typed
    icon: ts
    details: Fully Typed, Ready To Rock 💚 
  - title: For Every Scale
    icon: 🚀
    details: From Weekend Hobby To Enterprise - WarpDrive Delivers
---

<script setup>
import { VPTeamPage, VPTeamPageTitle, VPTeamMembers } from 'vitepress/theme'
import { data as members } from './.vitepress/data/contributors.data.ts'
import { data as coreTeam } from './.vitepress/data/core.data.ts'
import { data as top12 } from './.vitepress/data/all-time.data.ts'
import ContributorList from './.vitepress/theme/ContributorList.vue';

console.log(top12);
</script>

<VPTeamPage>
  <VPTeamPageTitle>
    <template #title>The Core Team</template>
    <template #lead>Some People You Should Really Buy a Coffee For.</template>
  </VPTeamPageTitle>
  <VPTeamMembers size="small" :members="coreTeam" />
</VPTeamPage>

<VPTeamPage>
  <VPTeamPageTitle>
    <template #title>The Hall Of Fame</template>
    <template #lead>The Top 12 All Time Contributors / Excluding The Core Team</template>
  </VPTeamPageTitle>
  <VPTeamMembers size="small" :members="top12.decoratedTop12" />
</VPTeamPage>

<VPTeamPage>
  <VPTeamPageTitle>
    <template #title>Our Contributors</template>
    <template #lead>A big thank you to all the amazing people who have helped improve this project.</template>
  </VPTeamPageTitle>
</VPTeamPage>
<ContributorList :contributors="members" />
