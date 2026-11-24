import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Read-only source profiling. Pass old-book dir, new-book dir, and report path.
const [oldRoot, newRoot, output] = process.argv.slice(2);
if (!oldRoot || !newRoot || !output) throw Error('Usage: node profile-corpus.mjs <old-dir> <new-dir> <report.json>');
for (const root of [oldRoot,newRoot]) {
  const relative=path.relative(path.resolve(root),path.resolve(output));
  if (!relative || (!relative.startsWith('..'+path.sep) && relative!=='..' && !path.isAbsolute(relative))) throw Error('Report must be outside source book directories');
}
const walk = d => fs.readdirSync(d, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(d,e.name)) : [path.join(d,e.name)]);
const han = s => (s.match(/\p{Script=Han}/gu) || []).length;
const words = ['只见','说罢','随后','随即','顿时','一边','原来','没想到','莫非','老朽','弟子','小爷','诶呦'];
const entries = [];
for (const [edition,root] of [['旧',oldRoot],['新',newRoot]]) {
  for (const file of walk(root).filter(f=>f.endsWith('.txt'))) {
    const bytes=fs.readFileSync(file), text=bytes.toString('utf8').replace(/\r\n/g,'\n');
    const title=path.basename(file).replace(/_[0-9a-f-]+\.txt$/i,'').replace(/\.txt$/,'');
    const size=han(text);
    const kind=!text.trim()?'空文件':title==='简介'||title==='index'?'简介或索引':size<100?'片段':'正文篇章';
    const paragraphs=text.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);
    const quoteHan=han([...text.matchAll(/“([^”]*)”/g)].map(m=>m[1]).join(''));
    entries.push({edition,title,relative_file:path.relative(root,file).replaceAll('\\','/'),source:file,kind,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),han:size,paragraphs:paragraphs.length,paragraph_han:paragraphs.map(han),quoted_han:quoteHan,phrases:Object.fromEntries(words.map(w=>[w,text.split(w).length-1]))});
  }
}
const summarize=edition=>{
  const files=entries.filter(e=>e.edition===edition&&e.kind==='正文篇章');
  const total=files.reduce((n,e)=>n+e.han,0), sizes=files.flatMap(e=>e.paragraph_han).sort((a,b)=>a-b);
  return {edition,substantive_chapters:files.length,body_han:total,paragraphs:sizes.length,paragraph_han_min:sizes[0],paragraph_han_median:sizes[Math.floor(sizes.length/2)],paragraph_han_max:sizes.at(-1),quoted_han_share:Math.round(files.reduce((n,e)=>n+e.quoted_han,0)/total*10000)/10000,phrases:Object.fromEntries(words.map(w=>[w,files.reduce((n,e)=>n+e.phrases[w],0)]))};
};
const report={date:'2026-11-09',source_roots:{旧:oldRoot,新:newRoot},method:'UTF-8只读；汉字按Unicode Script=Han计数；正文排除简介、索引、空文件及不足100汉字片段。段落按空行划分；引号内汉字比例仅为描述性统计，非质量评分。',summaries:[summarize('旧'),summarize('新')],entries};
fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});
fs.writeFileSync(output,JSON.stringify(report,null,2));
console.log(JSON.stringify(report.summaries,null,2));
