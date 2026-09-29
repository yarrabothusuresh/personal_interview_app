import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root=new URL('../docs/',import.meta.url);
const files=['FINAL-PROJECT-DOCUMENT.md','ARCHITECTURE.md','USER-GUIDE.md','API.md','OPERATIONS.md','TESTING.md','CHANGELOG.md'];
const escape=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const id=name=>name.replace('.md','').toLowerCase();
function inline(value){
  return escape(value)
    .replace(/!\[([^\]]*)\]\((diagrams\/[^)]+\.svg)\)/g,(_,alt,path)=>`<figure aria-label="${alt}">${readFileSync(new URL(path,root),'utf8')}</figure>`)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_,label,path)=>`<a href="${files.includes(path)?'#'+id(path):path}">${label}</a>`)
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
}
function render(source){
  const lines=source.split(/\r?\n/);let html='';
  for(let i=0;i<lines.length;i++){
    const line=lines[i];
    if(!line.trim())continue;
    if(line.startsWith('```')){
      const code=[];while(++i<lines.length&&!lines[i].startsWith('```'))code.push(lines[i]);
      html+=`<pre><code>${escape(code.join('\n'))}</code></pre>`;continue;
    }
    const heading=line.match(/^(#{1,6}) (.*)$/);
    if(heading){const level=Math.min(heading[1].length+1,6);html+=`<h${level}>${inline(heading[2])}</h${level}>`;continue;}
    if(line.startsWith('|')){
      const rows=[];while(i<lines.length&&lines[i].startsWith('|'))rows.push(lines[i++]);i--;
      html+='<div class="table-wrap"><table>';
      rows.filter(row=>!/^\|[\s:|-]+\|$/.test(row)).forEach((row,index)=>{const tag=index===0?'th':'td';html+='<tr>'+row.split('|').slice(1,-1).map(cell=>`<${tag}>${inline(cell.trim())}</${tag}>`).join('')+'</tr>';});
      html+='</table></div>';continue;
    }
    if(/^(- |\d+\. )/.test(line)){
      const ordered=/^\d/.test(line);const pattern=ordered?/^\d+\. /:/^- /;const tag=ordered?'ol':'ul';html+=`<${tag}>`;
      while(i<lines.length&&pattern.test(lines[i]))html+=`<li>${inline(lines[i++].replace(pattern,''))}</li>`;
      i--;html+=`</${tag}>`;continue;
    }
    html+=`<p>${inline(line)}</p>`;
  }
  return html;
}
const sections=files.map(name=>`<section id="${id(name)}">${render(readFileSync(new URL(name,root),'utf8'))}</section>`).join('\n');
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>InterviewPrep AI — Project Handover</title><style>
*{box-sizing:border-box}body{margin:0;background:#f1f5f9;color:#1e293b;font:16px/1.65 system-ui,Arial,sans-serif}main{max-width:1120px;margin:32px auto;background:white;padding:48px;border-radius:16px}h1{font-size:40px;line-height:1.15;color:#312e81}h2{font-size:28px;color:#312e81;margin-top:32px}h3{font-size:21px;color:#334155}a{color:#4338ca}nav{display:flex;flex-wrap:wrap;gap:12px;margin:28px 0}nav a{background:#eef2ff;padding:8px 12px;border-radius:8px;text-decoration:none}section{border-top:1px solid #cbd5e1;margin-top:48px;padding-top:12px}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;vertical-align:top;border:1px solid #cbd5e1;padding:10px}th{background:#eef2ff}code{overflow-wrap:anywhere;background:#f1f5f9;padding:2px 4px;font-size:13px}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f1f5f9;padding:18px;border-radius:8px;font-size:12px}figure{margin:24px 0}svg{max-width:100%;height:auto}li{margin:6px 0}.table-wrap{overflow:auto}.sub{color:#64748b}@media(max-width:650px){main{padding:20px;margin:0;border-radius:0}h1{font-size:30px}}@media print{body{background:white;font-size:10pt}main{padding:0;margin:0;max-width:none}nav{display:none}section{break-before:page;border:0}h2,h3{break-after:avoid}tr,figure{break-inside:avoid}pre{font-size:8pt}a{color:inherit}svg{max-height:230mm}th,td{padding:6px}}
</style></head><body><main><p class="sub">PROJECT HANDOVER · 29 SEPTEMBER 2026</p><h1>InterviewPrep AI</h1><p>Implemented flows, architecture, operating instructions, and release acceptance.</p><p class="sub">Self-contained document. Use your browser’s Print → Save as PDF to export.</p><nav>${files.map(name=>`<a href="#${id(name)}">${name.replace('.md','').replaceAll('-',' ')}</a>`).join('')}</nav>${sections}</main></body></html>`;
writeFileSync(new URL('PROJECT-HANDOVER.html',root),html);
console.log(`Created ${fileURLToPath(new URL('PROJECT-HANDOVER.html',root))}`);
