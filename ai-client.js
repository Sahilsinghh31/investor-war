/* Browser-side AI bridge. Talks ONLY to /api/ai (server holds the key). Any failure falls back to the local engine. */
const AIC={live:false,fails:0,busy:false};
const useAI=()=>AIC.live&&S&&!S.demo;
const setNote=m=>{const e=$('#aist');if(e)e.textContent=m||''};
const setMode=()=>{const e=$('#mode');if(!e)return;const on=S?useAI():AIC.live;e.textContent=on?'REAL AI MODE':'DEMO MODE · LOCAL ENGINE'};
function snap(){return{startup:S.st,claims:S.claims.map(c=>({type:c.type,text:c.text})),answers:S.answers.map(a=>({inv:a.inv,q:a.q,a:a.a,grade:a.g})),assumptions:S.ass.map(a=>({text:a.text,risk:a.risk,ev:a.ev})),contradictions:S.con.map(c=>({id:c.id,a:c.a,b:c.b,why:c.why,resolved:!!c.res,asked:!!c.asked})),confidence:S.conf,risk:S.risk,asked:S.asked,evidence:S.ev,probability:S.prob,concerns:S.why,ambush:S.ambush&&{text:S.ambush.text,score:S.ambush.score},boss:S.boss&&{text:S.boss.text,score:S.boss.avg}}}
async function aiCall(action,extra){if(AIC.fails>=2)throw new Error('off');const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),26000);
 try{const r=await fetch('/api/ai',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,state:S?snap():{},...extra}),signal:ctl.signal});if(!r.ok)throw new Error('http');const j=await r.json();AIC.fails=0;return j}
 catch(e){AIC.fails++;if(AIC.fails>=2)AIC.live=false;setNote('AI temporarily unavailable — continuing in DEMO MODE (local engine).');setMode();throw e}finally{clearTimeout(t)}}
function think(msg){S.thinking=msg;S._t0=Date.now();render();return()=>{if(S){if(S.stage==='war'&&S.dl&&!S.frozen)S.dl+=Date.now()-S._t0;S.thinking=false}}}
const _render=render;render=function(){_render();setMode()};
const _nextQ=nextQ,_submit=submit,_toStage=toStage,_subSubmit=subSubmit,_finish=finish;
nextQ=async function(){if(!useAI()){_nextQ();return}
 const done=think('Investors are conferring on the next question…');
 try{const r=await aiCall('question',{hint:pick()});done();if(!S||S.stage!=='war')return;
  const inv=INV[r.investor]?r.investor:pick(),c=r.cid&&S.con.find(x=>x.id===r.cid);if(c)c.asked=true;
  S.cur={n:S.qs.length+1,inv,text:r.question,why:'AI: '+(r.why||'strongest unresolved risk.'),cid:c?c.id:undefined};S.qs.push(S.cur);setNote('');render()}
 catch(e){done();if(S&&S.stage==='war')_nextQ()}};
submit=async function(text){if(!useAI()||!S||S.stage!=='war'||!S.cur||AIC.busy){_submit(text);return}
 text=(text||'').trim().slice(0,1200);if(text.length<2)return;AIC.busy=true;const q=S.cur,done=think('The panel is evaluating your answer…');let ov;
 try{const r=await aiCall('evaluate',{investor:q.inv,question:q.text,answer:text});
  const claims=r.claims.map(c=>({type:MEM[c.type]?c.type:'mkt',q:c.text,text:c.text}));
  ov={grade:r.grade,reason:r.reason,claims,assumptions:r.assumptions,contradiction:r.contradiction}}catch(e){ov=undefined}
 done();AIC.busy=false;if(S&&S.stage==='war'&&S.cur===q){_submit(text,ov);if(ov)setNote('')}};
ovApply=function(ov,cl,con,q,text){con.length=0;
 if(ov.contradiction){const c=ov.contradiction;con.push({id:'ai'+S.con.length,a:c.a,b:c.b,why:c.why,inv:INV[c.investor]?c.investor:'devil',res:false,asked:false})}
 ov.claims.forEach(c=>cl.push(c));
 ov.assumptions.forEach(a=>{if(!S.ass.some(x=>x.text===a.text))S.ass.push({type:'ai',src:a.text,customer:S.st.customer||'Unspecified',pricing:'—',text:a.text,ev:ov.grade,risk:a.risk,val:a.validation||'Design a test'})})};
toStage=function(st){_toStage(st);if(st==='ambush'&&useAI()){S.sd=Infinity;aiAmbush()}};
async function aiAmbush(){const done=think('Your biggest competitor is making its move…');
 try{S.ambTxt=(await aiCall('ambush')).scenario}catch(e){S.ambTxt=''}
 done();if(S&&S.stage==='ambush'){S.sd=Date.now()+60000;S.sl=60;render()}}
subSubmit=async function(){if(!S||(S.stage!=='ambush'&&S.stage!=='boss')||AIC.busy)return;if(!useAI()){_subSubmit();return}
 AIC.busy=true;S.sd=Infinity;const kind=S.stage,t=(($('#ans')||{}).value||'').trim().slice(0,1500);setNote('The panel is judging your response…');
 try{if(t.length>=3){const r=await aiCall('judge',{kind,text:t,scenario:S.ambTxt||''});
  S.ovJ=kind==='ambush'?{kind,r:{score:r.score,rows:r.criteria.map(c=>[c.name,c.score>=60]),note:r.note||'Scored by the AI panel.'}}:{kind,r:{c:Object.fromEntries(r.criteria.map(c=>[c.name,c.score])),avg:r.score}}}}catch(e){S.ovJ=null}
 AIC.busy=false;if(S&&S.stage===kind){const a=$('#ans');if(a&&!a.value)a.value=t;_subSubmit()}if(S)S.ovJ=null;setNote('')};
finish=async function(){_finish();if(!useAI()||!S||!S.verdict)return;setNote('The panel is writing the final report…');
 try{const r=await aiCall('verdict');S.verdict.ai=r;if(r.blindSpot)S.verdict.bs=r.blindSpot;S.aiExps=r.experiments;
  const p=r.pitch;S.aiRw=[['Problem',p.problem],['Customer',p.customer],['Evidence',p.evidence],['Solution',p.solution],['Differentiation',p.differentiation],['Business model',p.businessModel],['Traction',p.traction],['Ask',p.ask]];
  const h=H();if(h.length){h[h.length-1].pv=S.aiRw;h[h.length-1].ai=true;setH(h)}setNote('');render()}catch(e){}};
aiNotes=function(){const a=S&&S.verdict&&S.verdict.ai;if(!a)return'';const L=x=>`<ul>${x.map(i=>`<li>${E(i)}</li>`).join('')}</ul>`;
 return`<div class="card"><h3>AI PANEL REPORT</h3><p><b>Strongest advantage:</b> ${E(a.strongestAdvantage)}</p><p><b>Biggest red flag:</b> ${E(a.redFlag)}</p><h3>TOP OBJECTIONS</h3>${L(a.objections)}<h3>EVIDENCE NEEDED</h3>${L(a.evidenceNeeded)}<h3>RECOMMENDED NEXT STEPS</h3>${L(a.nextSteps)}</div>`};
(async()=>{try{const r=await fetch('/api/ai',{method:'POST',headers:{'content-type':'application/json'},body:'{"action":"status"}'});AIC.live=!!(await r.json()).live}catch(e){AIC.live=false}
 render();if(S&&S.stage==='war'&&!S.cur&&!S.demo&&!S.thinking)nextQ()})();
