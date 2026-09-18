const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const assert=require('node:assert/strict');
const test=require('node:test');
const root=path.join(__dirname,'..');
function load(file,mocks){
 const source=fs.readFileSync(path.join(root,file),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const module={exports:{}};
 new vm.Script(compiled,{filename:file}).runInNewContext({module,exports:module.exports,require:n=>{if(Object.hasOwn(mocks,n))return mocks[n];throw Error('Unexpected dependency '+n);},process:{env:{RESEND_API_KEY:'fixture',ORDER_TO:'fixture@example.invalid'}},Response,Request,URL,console:{error(){}}});
 return module.exports;
}
function route(enabled){let mail=0;return {get calls(){return mail;},handler:load('src/app/api/order/route.ts',{
 'next/server':{NextResponse:{json:Response.json,redirect:Response.redirect}},
 // A Resend success is {data:{id},error:null}; the route now requires the id.
 resend:{Resend:class{emails={send:async()=>{mail++;return {data:{id:'fixture-acceptance-id'},error:null};}};}},
 '@/data/site':{ORDERING_LIVE:enabled,locations:[{key:'marshall',name:'Marshall',street:'fixture',phone:'fixture'},{key:'battle-creek',name:'Battle Creek',street:'fixture',phone:'fixture'}]},
 '@/data/menu':{orderables:[{key:'pint',name:'Pint',price:'$5',at:['marshall','battle-creek']}]},
 }).POST};}
const fields={store:'marshall',name:'Fixture',email:'fixture@example.invalid','qty-pint':'1'};
test('disabled JSON and stale plain-form posts never send mail',async()=>{
 const r=route(false);
 for(const json of [true,false]){const req=new Request('https://fixture.invalid/api/order',{method:'POST',headers:{'content-type':json?'application/json':'application/x-www-form-urlencoded'},body:json?JSON.stringify(fields):new URLSearchParams(fields)});const response=await r.handler(req);assert.equal(response.status,503);assert.match(await response.text(),/currently closed/);}
 assert.equal(r.calls,0);
});
test('disabled route rejects unreadable payload before trying to read customer input',async()=>{
 const r=route(false);const response=await r.handler({headers:new Headers({'content-type':'application/json'}),json:()=>{throw Error('Must not parse');}});assert.equal(response.status,503);assert.equal(r.calls,0);
});
test('enabled JSON and no-JS orders still reach the selected shop',async()=>{
 const r=route(true);
 for(const store of ['marshall','battle-creek']){const response=await r.handler(new Request('https://fixture.invalid/api/order',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...fields,store})}));assert.equal(response.status,200);}
 const response=await r.handler(new Request('https://fixture.invalid/api/order',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams(fields)}));assert.equal(response.status,303);assert.equal(r.calls,3);
});
test('direct disabled page renders no order form; enabled page retains preselection',async()=>{
 for(const enabled of [false,true]){
 const jsx=(type,props)=>({type,props});const page=load('src/app/order/page.tsx',{'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'fragment'},'next/link':{default:'link'},'@/data/site':{ORDERING_LIVE:enabled},'@/components/OrderForm':{default:'ORDER_FORM'},'@/components/PageHero':{default:'hero'}}).default;
 const result=JSON.stringify(await page({searchParams:Promise.resolve({at:'battle-creek'})}));assert.equal(result.includes('ORDER_FORM'),enabled);if(enabled)assert.match(result,/battle-creek/);
 }
});
