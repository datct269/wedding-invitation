import {readFile} from 'node:fs/promises';

export async function linkTarget(args) {
  const options = {};
  const positionals = [];
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith('--')) { positionals.push(args[i]); continue; }
    const option = args[i].slice(2), separator = option.indexOf('=');
    const name = separator < 0 ? option : option.slice(0, separator);
    const inline = separator < 0 ? undefined : option.slice(separator + 1);
    if (!['target', 'config', 'prefix'].includes(name)) throw new Error(`Unknown option: --${name}`);
    options[name] = inline ?? args[++i];
    if (!options[name]) throw new Error(`Missing value for --${name}`);
  }
  const config = JSON.parse(await readFile(options.config || new URL('../config/link-targets.json', import.meta.url), 'utf8'));
  const targetName = options.target || config.defaultTarget;
  const target = config.targets[targetName];
  if (!target) throw new Error(`Unknown target: ${targetName}`);
  const prefix = options.prefix || positionals[2] || target.prefix;
  if (!prefix) throw new Error(`Configure the share prefix for target ${targetName} first.`);
  const url = new URL(prefix);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash) throw new Error('Invalid link prefix.');
  return {positionals, prefix: url.href, targetName};
}
