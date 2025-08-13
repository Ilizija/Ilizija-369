
export default async function handler(req, res) {
  try {
    const gh = await checkGitHub();
    const ai = await checkOpenAI();
    res.status(200).json({ ok:true, time:new Date().toISOString(), vercel:'ok', github:gh, openai:ai });
  } catch(e){ res.status(500).json({ ok:false, error:e.message }); }
}
async function checkGitHub(){ const owner=process.env.IK_OWNER, repo=process.env.IK_REPO, branch=process.env.IK_BRANCH||'main'; const token=process.env.IK_GH_TOKEN;
  if(!owner||!repo||!token) return { ok:false, error:'Missing IK_* envs' };
  const r=await fetch(`https://api.github.com/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json'}});
  if(!r.ok) return { ok:false, status:r.status }; const j=await r.json(); return { ok:true, lastCommit: j.commit?.sha?.slice(0,7) }; }
async function checkOpenAI(){ const key=process.env.OPENAI_API_KEY; if(!key) return { ok:false, error:'Missing OPENAI_API_KEY' };
  const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify({model:'gpt-4o-mini',input:'ping'})});
  return { ok:r.ok }; }
