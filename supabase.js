const SUPABASE_URL = 'https://oklgbpgzpmgrbjqzokkl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NOo-9cDJG31m4NQjLkfJIg_MeOvpcIr';
const SESSION_KEY = 'clube_pao_supabase_session';

function authHeaders(token, extra={}) {
  const h = { apikey: SUPABASE_KEY, ...extra };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function sbFetch(path, options={}, token=null) {
  const headers = authHeaders(token, {'Content-Type':'application/json', ...(options.headers||{})});
  const res = await fetch(`${SUPABASE_URL}${path}`, {...options, headers});
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = data?.msg || data?.message || data?.error_description || data?.error || text || `Erro HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function saveSession(session){
  if(session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}
function readSession(){
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)||'null'); } catch { return null; }
}

async function refreshSessionIfNeeded(session){
  if(!session?.refresh_token) return session;
  const expiresAt = Number(session.expires_at || 0) * 1000;
  if(expiresAt && expiresAt > Date.now() + 60000) return session;
  try {
    const data = await sbFetch('/auth/v1/token?grant_type=refresh_token', {
      method:'POST', body:JSON.stringify({refresh_token:session.refresh_token})
    });
    const next = {...data, expires_at: Math.floor(Date.now()/1000) + Number(data.expires_in||3600)};
    saveSession(next); return next;
  } catch { saveSession(null); return null; }
}

async function getSession(){ return refreshSessionIfNeeded(readSession()); }
async function signUp(email,password,nome=''){
  const data = await sbFetch('/auth/v1/signup',{method:'POST',body:JSON.stringify({email,password,data:{nome}})});
  if(data?.session){
    const session={...data.session, user:data.user, expires_at:Math.floor(Date.now()/1000)+Number(data.session.expires_in||3600)};
    saveSession(session); return session;
  }
  return null;
}
async function signIn(email,password){
  const data=await sbFetch('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});
  const session={...data,expires_at:Math.floor(Date.now()/1000)+Number(data.expires_in||3600)};
  saveSession(session); return session;
}
async function signOut(){
  const s=await getSession();
  if(s?.access_token){try{await sbFetch('/auth/v1/logout',{method:'POST'},s.access_token)}catch{}}
  saveSession(null);
}
async function currentUser(){
  const s=await getSession();
  if(!s?.access_token) return null;
  try { return await sbFetch('/auth/v1/user',{},s.access_token); } catch { saveSession(null); return null; }
}
async function dbSelect(table, query='', token=null){ return sbFetch(`/rest/v1/${table}${query}`,{},token); }
async function dbInsert(table, rows, token, prefer='return=representation'){ return sbFetch(`/rest/v1/${table}`,{method:'POST',headers:{Prefer:prefer},body:JSON.stringify(rows)},token); }
async function dbUpsert(table, rows, token, onConflict='id'){ return sbFetch(`/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`,{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'} ,body:JSON.stringify(rows)},token); }
async function dbUpdate(table, query, values, token){ return sbFetch(`/rest/v1/${table}${query}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(values)},token); }
async function dbDelete(table, query, token){ return sbFetch(`/rest/v1/${table}${query}`,{method:'DELETE'},token); }
function moneyBR(v){ return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function escapeHtml(s){ return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
