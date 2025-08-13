
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Use POST'});
  try{
    const chunks=[]; for await(const c of req) chunks.push(c); const raw=Buffer.concat(chunks).toString('utf8'); const {path,line}=raw?JSON.parse(raw):{};
    const owner=process.env.IK_OWNER, repo=process.env.IK_REPO, branch=process.env.IK_BRANCH||'main', token=process.env.IK_GH_TOKEN;
    if(!owner||!repo||!token) return res.status(400).json({error:'Missing IK_OWNER/IK_REPO/IK_GH_TOKEN'});
    if(!path||!line) return res.status(400).json({error:'Missing path/line'});
    let clean=String(path).trim().replace(/^\/+/, '').replace(/\/{2,}/g,'/'); const segs=clean.split('/'); if(segs.some(s=>!s)) return res.status(400).json({error:'Invalid path'});
    segs[segs.length-1]=segs[segs.length-1].replace(/[^A-Za-z0-9._-]/g,'_'); clean=segs.join('/');
    const base=`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(clean)}`;
    let sha, existing=''; const get=await fetch(`${base}?ref=${encodeURIComponent(branch)}`,{headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28'}});
    if(get.ok){ const j=await get.json(); sha=j.sha; if(j.content&&j.encoding==='base64'){ existing=Buffer.from(j.content,'base64').toString('utf8'); } } else if(get.status!==404){ return res.status(get.status).json({error:await get.text()}); }
    const next= existing ? (existing.endsWith('\n')?existing+line+'\n':existing+'\n'+line+'\n') : (line+'\n');
    const put=await fetch(base,{method:'PUT',headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},body:JSON.stringify({message:'iknow-lite: append',content:Buffer.from(next,'utf8').toString('base64'),branch,sha})});
    if(!put.ok) return res.status(400).json({error:await put.text()});
    const out=await put.json(); res.status(200).json({ok:true,path:clean,commit:out.commit?.sha?.slice(0,7)});
  }catch(e){ res.status(500).json({error:e.message||String(e)}); }
}
