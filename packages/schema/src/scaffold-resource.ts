#!/usr/bin/env node
// Entry point for the `resource` bin: `resource <name>` is `scaffold resource <name>`.
import { main } from './scaffold.ts';

await main(['resource', ...process.argv.slice(2)]);
