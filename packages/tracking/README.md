<p align="center">
  <img
    class="project-logo"
    src="./logos/logo-yellow-slab.svg"
    alt="WarpDrive"
    width="180px"
    title="WarpDrive"
    />
</p>

![NPM Stable Version](https://img.shields.io/npm/v/ember-data/latest?label=version&style=flat&color=fdb155)
![NPM Downloads](https://img.shields.io/npm/dm/ember-data.svg?style=flat&color=fdb155)
![License](https://img.shields.io/github/license/warp-drive-data/warp-drive.svg?style=flat&color=fdb155)
[![EmberJS Discord Community Server](https://img.shields.io/badge/EmberJS-grey?logo=discord&logoColor=fdb155)](https://discord.gg/zT3asNS)
[![WarpDrive Discord Server](https://img.shields.io/badge/WarpDrive-grey?logo=discord&logoColor=fdb155)](https://discord.gg/PHBbnWJx5S)

<p align="center">
  <br>
  <a href="https://warp-drive.io">WarpDrive</a> is the lightweight data library for web apps &mdash;
  <br>
  universal, typed, reactive, and ready to scale.
  <br/><br/>
</p>

---

# ⚠️ Decommissioned ⚠️ 

> [!WARNING]
> This package is no longer providing any code as of release version 5.5
> Posted on 4/25/2025

This package is no longer part of the EmberData/WarpDrive experience.

Previously it provided the reactivity integration for EmberData/WarpDrive to use Ember's reactivity
system. Agnostic reactivity primitives are now provided by @ember-data/store (and thus @warp-drive/core)
while ember specific configuration is provided by @warp-drive/ember.

If using the `ember-data` package, you can remove any references to this package, no other changes needed.
If using individual packages, ensure you have `@warp-drive/ember` installed and add the following line to
your `app.ts` file.

```ts
import '@warp-drive/ember/install';
```
