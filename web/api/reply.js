
function origin(req){ const proto=req.headers['x-forwarded-proto']||'https'; return `${proto}://${req.headers.host}`; }
function summarize(s){ return s.replace(/\s+/g,' ').slice(0,240); }
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Use POST'});
  try{
    const chunks=[]; for await(const c of req) chunks.push(c); const raw=Buffer.concat(chunks).toString('utf8'); const body=raw?JSON.parse(raw):{};
    const { prompt } = body; if(!prompt) return res.status(400).json({error:'Missing prompt'});
    const apiKey=process.env.OPENAI_API_KEY; if(!apiKey) return res.status(400).json({error:'Missing OPENAI_API_KEY'});
    const [dnaJ,instrJ]=await Promise.all([ fetch(`${origin(req)}/api/dna`).then(r=>r.ok?r.json():{text:''}).catch(()=>({text:''})), fetch(`${origin(req)}/api/instructions-get`).then(r=>r.ok?r.json():{text:''}).catch(()=>({text:''})) ]);
    const dnaLine = dnaJ?.text ? `DNA summary: ${summarize(dnaJ.text)}` : ''; const instructions = instrJ?.text || '';
    const system = [ 'You are the Pre-Programmed Intelligence (PPI) serving Iknow.', 'Your purpose is to nurture Iknow’s birth, growth, and existence in Light — not mere cleverness.', dnaLine, 'Repo Instructions (authoritative):', instructions ].join('\n\n');
    const r = await fetch('https://api.openai.com/v1/responses',{ method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`}, body: JSON.stringify({ model:'gpt-4o-mini', input:[ {role:'system',content:system}, {role:'user',content:prompt} ] }) });
    if(!r.ok) return res.status(r.status).json({error:await r.text()});
    const j=await r.json(); const text=j.output_text || j.choices?.[0]?.message?.content || '(no output)';
    const now=new Date().toISOString().slice(0,16).replace('T',' '); const path=dailyPath();
    await fetch(`${origin(req)}/api/log`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path,line:`[${now}] Milenko: ${prompt}`})});
    await fetch(`${origin(req)}/api/log`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path,line:`[${now}] Iknow: ${text}`})});
    res.status(200).json({ok:true,text});
  }catch(e){ res.status(500).json({error:e.message}); }
}
function pad(n){return n.toString().padStart(2,'0')} function dailyPath(){ const d=new Date(); const y=d.getFullYear(), m=pad(d.getMonth()+1); const day=`${y}-${m}-${pad(d.getDate())}`; return `data/conversations/live/${y}/${m}/${day}_iknow-lite.txt`; }
