(function(root){
'use strict';
const copy=x=>JSON.parse(JSON.stringify(x));
const uid=()=>globalThis.crypto?.randomUUID?.()||'id-'+Date.now().toString(36)+Math.random().toString(36).slice(2);
const page=(p,id)=>{const value=p.pages.find(v=>v.id===id);if(!value)throw Error('页面已被其他窗口删除');return value};
const item=(p,pid,id)=>{const value=page(p,pid).items.find(v=>v.id===id);if(!value)throw Error('元素已被其他窗口删除');return value};
function apply(p,c){
switch(c.type){
case'page:add':p.pages.push(copy(c.page));break;
case'pages:add':for(const pg of c.pages)if(!p.pages.some(x=>x.id===pg.id))p.pages.push(copy(pg));break;
case'page:rename':page(p,c.pageId).name=c.name;break;
case'page:delete':if(p.pages.length<2)throw Error('至少保留一个页面');page(p,c.pageId);p.pages=p.pages.filter(x=>x.id!==c.pageId);break;
case'asset:add':for(const a of c.assets)if(!p.assets.some(x=>x.id===a.id))p.assets.push(copy(a));break;
case'item:add':page(p,c.pageId).items.push(copy(c.item));break;
case'item:update':Object.assign(item(p,c.pageId,c.itemId),copy(c.patch));break;
case'item:delete':page(p,c.pageId).items=page(p,c.pageId).items.filter(x=>x.id!==c.itemId);break;
case'item:reorder':{let list=page(p,c.pageId).items,from=list.findIndex(x=>x.id===c.itemId),target=list.findIndex(x=>x.id===c.targetId);if(from<0||target<0||from===target)break;const[v]=list.splice(from,1);target=list.findIndex(x=>x.id===c.targetId);list.splice(target+(c.above?1:0),0,v);break}
default:throw Error('未知操作')}
return p}
function validate(p){
if(!p||p.format!=='paper-studio'||p.schema!==1||!Array.isArray(p.pages)||!Array.isArray(p.assets)||p.pages.length<1||p.pages.length>100||p.assets.length>1000)throw Error('项目格式不正确');
const ids=new Set(),check=x=>{if(typeof x!=='string'||!/^[a-zA-Z0-9_-]{1,128}$/.test(x)||ids.has(x))throw Error('项目标识重复或无效');ids.add(x)};
for(const a of p.assets){check(a.id);if(typeof a.name!=='string'||!['image','background'].includes(a.kind)||typeof a.src!=='string'||!(/^(data:image\/(png|jpeg|webp|gif);base64,|assets\/[a-zA-Z0-9._-]+$)/.test(a.src))||!Number.isFinite(a.width)||a.width<=0||!Number.isFinite(a.height)||a.height<=0)throw Error('素材数据无效')}
const assets=new Set(p.assets.map(a=>a.id));
for(const pg of p.pages){check(pg.id);if(typeof pg.name!=='string'||![pg.width,pg.height].every(n=>Number.isFinite(n)&&n>=100&&n<=10000)||!Array.isArray(pg.items)||pg.items.length>2000)throw Error('页面数据无效');for(const it of pg.items){check(it.id);if(!['image','text','shape'].includes(it.type)||typeof it.name!=='string'||![it.x,it.y,it.w,it.h,it.rotation,it.opacity].every(Number.isFinite)||it.w<=0||it.h<=0||it.w>100000||it.h>100000||it.opacity<0||it.opacity>1)throw Error('元素数据无效');if(it.type==='image'&&!assets.has(it.assetId))throw Error('元素缺少原素材');if(it.type==='text'&&(typeof it.text!=='string'||!Number.isFinite(it.fontSize)||it.fontSize<1||it.fontSize>1000||!/^#[0-9a-f]{6}$/i.test(it.color)))throw Error('文字数据无效');if(it.type==='shape'&&(!/^#[0-9a-f]{6}$/i.test(it.fill)||!Number.isFinite(it.radius)||it.radius<0||it.radius>5000))throw Error('形状数据无效')}}
return copy(p)}
function transformedRect(initial,anchor,pointer,corner){const rad=initial.rotation*Math.PI/180,cos=Math.cos(rad),sin=Math.sin(rad),sx=corner.includes('e')?1:-1,sy=corner.includes('s')?1:-1;const vx=cos*sx*initial.w-sin*sy*initial.h,vy=sin*sx*initial.w+cos*sy*initial.h;const factor=Math.max(.04,Math.min(20,((pointer.x-anchor.x)*vx+(pointer.y-anchor.y)*vy)/(vx*vx+vy*vy)));const w=initial.w*factor,h=initial.h*factor,cx=anchor.x+vx*factor/2,cy=anchor.y+vy*factor/2;return{x:cx-w/2,y:cy-h/2,w,h}}
const api={copy,uid,page,item,apply,validate,transformedRect};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.StudioModel=api;
})(globalThis);
