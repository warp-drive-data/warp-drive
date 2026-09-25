import { pageTitle } from 'ember-page-title';

import { Layout } from '#app/components/layout.gts';

<template>
  {{pageTitle "TodoMVC"}}

  <Layout>
    {{outlet}}
  </Layout>
</template>
