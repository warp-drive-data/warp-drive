export interface CoreTeamMember {
  name: string;
  username: string;
  title: string;
  avatar: string;
  sponsor?: string;
  links: { icon: string; link: string }[];
}

export default {
  load() {
    return [
      {
        name: 'Chris Thoburn',
        username: 'runspired',
        title: 'Project Lead | Senior Staff Engineer @auditboard',
        avatar: 'https://avatars.githubusercontent.com/u/650309?v=4',
        sponsor: 'https://github.com/sponsors/runspired',
        links: [
          { icon: 'github', link: 'https://github.com/runspired' },
          { icon: 'bluesky', link: 'https://bsky.app/profile/runspired.com' },
          { icon: 'linkedin', link: 'https://www.linkedin.com/in/runspired/' },
          { icon: 'twitter', link: 'https://twitter.com/still_runspired' },
        ],
      },
      {
        name: 'Krystan HuffMenne',
        username: 'gitKrystan',
        title: 'Core Team | Staff Software Engineer @auditboard',
        sponsor: 'https://github.com/sponsors/gitKrystan',
        avatar: 'https://avatars.githubusercontent.com/u/14152574?v=4',
        links: [{ icon: 'github', link: 'https://github.com/gitKrystan' }],
      },
      {
        name: 'Rich Glazerman',
        username: 'richgt',
        title: 'Core Team | Software Engineer @square',
        sponsor: 'https://github.com/sponsors/richgt',
        avatar: 'https://avatars.githubusercontent.com/u/1250681?v=4',
        links: [{ icon: 'github', link: 'https://github.com/richgt' }],
      },
      {
        name: 'Kirill Shaplyko',
        username: 'Baltazore',
        title: 'Core Team | Lead Developer @galar',
        sponsor: 'https://github.com/sponsors/Baltazore',
        avatar: 'https://avatars.githubusercontent.com/u/1690675?v=4',
        links: [{ icon: 'github', link: 'https://github.com/Baltazore' }],
      },
      {
        name: 'Leo Euclides',
        username: 'leoeuclids',
        title: 'Core Team | Senior Frontend Engineer @Userlist',
        avatar: 'https://avatars.githubusercontent.com/u/9011117?v=4',
        links: [{ icon: 'github', link: 'https://github.com/leoeuclids' }],
      },
    ];
  },
};
