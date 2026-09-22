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
[![EmberJS Discord Community Server](https://img.shields.io/badge/EmberJS-grey?logo=discord&logoColor=fdb155)](https://discord.gg/zT3asNS
)
[![WarpDrive Discord Server](https://img.shields.io/badge/WarpDrive-grey?logo=discord&logoColor=fdb155)](https://discord.gg/PHBbnWJx5S
)

<p align="center">
  <br>
  <a href="https://warp-drive.io">WarpDrive</a> is the lightweight data library for web apps &mdash;
  <br>
  universal, typed, reactive, and ready to scale.
  <br/><br/>
</p>

---

# @warp-drive/holodeck

<h3 align="center">⚡️ Simple, Fast HTTP Mocking</h3>
<p align="center">Ideal for Test Suites</p>

<p align="center">
    <img
      src="./pnpm-install-logo.png"
      alt="WarpDrive Holodeck"
      width="320px"
      title="WarpDrive Holodeck" />
</p>


- ⚡️ Real network requests
  - brotli compression
  - http/2
  - no CORS preflight requests
- 💜 Unparalleled DX
  - debug real network requests
  - every request is scoped to a test
  - run as many tests as desired simultaneously
- 🔥 Blazing Fast Tests
  - record your tests when you change them
  - replays from cache until you change them again
  - the cache is managed by git, so switching branches works seamlessly, and CI and
    rebases skip work that is already recorded
  - zero-work: setup work is skipped when in replay mode

## Installation

```sh
pnpm add -E @warp-drive/holodeck@canary
```

**Tagged Releases**

- ![NPM Canary Version](https://img.shields.io/npm/v/%40warp-drive/holodeck/canary?label=%40canary&color=FFBF00)
- ![NPM Beta Version](https://img.shields.io/npm/v/%40warp-drive/holodeck/beta?label=%40beta&color=ff00ff)
- ![NPM Stable Version](https://img.shields.io/npm/v/%40warp-drive/holodeck/latest?label=%40latest&color=90EE90)
- ![NPM LTS Version](https://img.shields.io/npm/v/%40warp-drive/holodeck/lts?label=%40lts&color=0096FF)
- ![NPM LTS 4.12 Version](https://img.shields.io/npm/v/%40warp-drive/holodeck/lts-4-12?label=%40lts-4-12&color=bbbbbb)



## Documentation

- [Testing Overview](https://warp-drive.io/guides/the-manual/testing/) why a real server, and how record and replay works
- [Server Setup](https://warp-drive.io/guides/the-manual/testing/server-setup) certificates, and launching with Diagnostic or Testem
- [Client Setup](https://warp-drive.io/guides/the-manual/testing/client-setup) adding `MockServerHandler` to the request chain
- [Test Framework Integration](https://warp-drive.io/guides/the-manual/testing/test-framework-integration) test ids and the mock host
- [Writing Mocks](https://warp-drive.io/guides/the-manual/testing/writing-mocks) the mock helpers and the matching rules
- [Recording and Replaying](https://warp-drive.io/guides/the-manual/testing/record-and-replay) modes, fixtures, and CI
- [Troubleshooting](https://warp-drive.io/guides/the-manual/testing/troubleshooting) indexed by the errors holodeck prints
- [HoloPrograms](https://warp-drive.io/guides/the-manual/testing/holo-programs) the design this package is being built toward

### ♥️ Credits

 <details>
   <summary>Brought to you with ♥️ love by <a href="https://emberjs.com" title="EmberJS">🐹 Ember</a></summary>

  <style type="text/css">
    img.project-logo {
       padding: 0 5em 1em 5em;
       width: 100px;
       border-bottom: 2px solid #bbb;
       margin: 0 auto;
       display: block;
     }
    details > summary {
      font-size: 1.1rem;
      line-height: 1rem;
      margin-bottom: 1rem;
    }
    details {
      font-size: 1rem;
    }
    details > summary strong {
      display: inline-block;
      padding: .2rem 0;
      color: #000;
      border-bottom: 3px solid #bbb;
    }

    details > details {
      margin-left: 2rem;
    }
    details > details > summary {
      font-size: 1rem;
      line-height: 1rem;
      margin-bottom: 1rem;
    }
    details > details > summary strong {
      display: inline-block;
      padding: .2rem 0;
      color: #555;
      border-bottom: 2px solid #555;
    }
    details > details {
      font-size: .85rem;
    }

    @media (prefers-color-scheme: dark) {
      details > summary strong {
        color: #fff;
      }
    }
    @media (prefers-color-scheme: dark) {
      details > details > summary strong {
        color: #afaba0;
      border-bottom: 2px solid #afaba0;
      }
    }
  </style>
</details>
