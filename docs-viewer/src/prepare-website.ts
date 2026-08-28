/*
  Copies content directories into docs.warp-drive.io so the site can render them:
  - the repo-root guides/ folder -> docs.warp-drive.io/guides
  - the @warp-drive/memory-alpha package's skills/ -> docs.warp-drive.io/skills
*/
import { join } from 'path';
import { existsSync, rmSync } from 'fs';
import { spawnSync } from 'child_process';
import { finalizeSyncedContent } from './site-utils';

function sync(sourcePath: string, destPath: string) {
  if (existsSync(destPath)) {
    rmSync(destPath, { recursive: true, force: true });
  }

  try {
    spawnSync('cp', ['-r', sourcePath, destPath], {
      stdio: 'inherit',
      cwd: __dirname,
    });
    console.log(`Copied: ${sourcePath} -> ${destPath}`);
  } catch (error) {
    console.error('Error copying directory:', error);
  }
}

export async function main() {
  sync(join(__dirname, '../../guides'), join(__dirname, '../docs.warp-drive.io/guides'));

  const skillsDestPath = join(__dirname, '../docs.warp-drive.io/skills');
  sync(join(__dirname, '../../warp-drive-packages/memory-alpha/skills'), skillsDestPath);
  finalizeSyncedContent(skillsDestPath);
}

main();
