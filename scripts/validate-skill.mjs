import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const content=fs.readFileSync(path.join(root,'SKILL.md'),'utf8');
const match=content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
assert(match,'Missing frontmatter');
// This skill deliberately uses two plain scalar frontmatter fields only.
const lines=match[1].split(/\r?\n/);
assert(lines.length===2 && lines[0].startsWith('name: ') && lines[1].startsWith('description: '));
const name=lines[0].slice(6),description=lines[1].slice(13);
assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)&&name.length<=64);
assert(name===path.basename(root));
assert(description.length>0&&description.length<=1024&&!/[<>]/.test(description));
assert(!/^\s*\[TODO:.*\]\s*$/m.test(content));
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
let links=0;
for(const file of walk(root).filter(f=>f.endsWith('.md'))) {
  const text=fs.readFileSync(file,'utf8');
  for(const m of text.matchAll(/\]\(([^)]+)\)/g)){
    if(/^https?:/.test(m[1]))continue;
    assert(fs.existsSync(path.resolve(path.dirname(file),m[1].split('#')[0])),`Broken reference: ${m[1]}`);links++;
  }
}
const yaml=fs.readFileSync(path.join(root,'agents/openai.yaml'),'utf8');
for(const key of ['display_name','short_description','default_prompt']){
  const line=yaml.split(/\r?\n/).find(x=>x.trim().startsWith(key+': '));
  assert(line,`Missing UI ${key}`);
  const value=JSON.parse(line.trim().slice(key.length+2));
  assert(typeof value==='string'&&value.length>0);
  if(key==='default_prompt')assert(value.includes('$'+name));
  if(key==='short_description')assert(value.length>=25&&value.length<=64);
}
const profile=JSON.parse(fs.readFileSync(path.join(root,'references/corpus-profile.json'),'utf8'));
assert(profile.entries.filter(e=>e.kind==='正文篇章').length===8);
assert(profile.summaries.reduce((n,e)=>n+e.body_han,0)===17078);
let verified=0;
if(process.argv.includes('--check-sources')){
  for(const e of profile.entries){
    assert(crypto.createHash('sha256').update(fs.readFileSync(e.source)).digest('hex')===e.sha256,`Source changed: ${e.source}`);verified++;
  }
  const evidence=fs.readFileSync(path.join(root,'references/evidence.md'),'utf8');
  for(const section of evidence.split(/^## E\d+ /m).slice(1)){
    const source=section.match(/源文件：`([^`]+)`/)[1];
    const raw=fs.readFileSync(source,'utf8').replace(/\r\n/g,'\n');
    for(const m of section.matchAll(/^> (.+)$/gm))assert(raw.includes(m[1]),'Evidence text mismatch');
  }
}
console.log(JSON.stringify({skill:name,metadata_valid:true,local_links_verified:links,body_chapters:8,body_han:17078,source_files_unchanged:verified||'not checked'},null,2));
