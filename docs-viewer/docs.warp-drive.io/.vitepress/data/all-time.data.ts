import { Contributor, getFromCache, githubHeaders, default as loadAll, saveToCache } from './contributors.data.ts';
import { CoreTeamMember, default as loadCore } from './core.data.ts';

// https://api.github.com/users/

export default {
  async load() {
    const members = await loadAll.load();
    const core = await loadCore.load();

    const coreTeamProfiles = new Set(
      core.map((t) => {
        return t.links!.find((l) => l.icon === 'github')!.link;
      })
    );

    const top12 = [];
    for (const member of members) {
      if (!coreTeamProfiles.has(member.githubLink)) top12.push(member);

      if (top12.length === 12) {
        break;
      }
    }

    const profiles: Record<string, any> = {};

    // get the profiles of the top12 and core team members
    for (const person of core) {
      profiles[person.username] = await fetchPerson(person.username);
    }
    for (const person of top12) {
      profiles[person.username] = await fetchPerson(person.username);
    }

    const decoratedTop12 = top12.map((p) => {
      return decoratePerson(p, profiles[p.username]);
    });

    return {
      top12,
      decoratedTop12,
      profiles,
    };
  },
};

export interface TopContributor {
  name: string;
  username: string;
  title: string;
  desc?: string;
  avatar: string;
  // sponsor?: string;
  // org?: string;
  // orgLink?: string;
  links: { icon: string; link: string }[];
}

function decoratePerson(local: Contributor, github: any): TopContributor {
  return {
    name: github.name || local.name,
    username: local.username || github.login,
    title: `@${github.login}${github.company ? ' | ' + github.company : ''}`,
    desc: github.bio,
    avatar: local.avatar || github.avatar_url,
    links: [{ icon: 'github', link: local.githubLink ?? github.html_url }],
  };
}

async function fetchPerson(username: string) {
  const cacheKey = `github-user-${username.toLowerCase()}`;
  const cached = await getFromCache(cacheKey);
  if (cached) return cached;

  const res = await fetch(`https://api.github.com/users/${username}`, { headers: githubHeaders() });
  if (res.ok) {
    const profile = await res.json();
    await saveToCache(cacheKey, profile);
    return profile;
  }

  const err = await res.text();
  console.log(err);
  throw new Error(`Failed to fetch GitHub profile for ${username}: ${res.status} ${res.statusText}`);
}
