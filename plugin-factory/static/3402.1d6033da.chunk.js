(()=>{(self.webpackChunkapp=self.webpackChunkapp||[]).push([[1472,3402],{5877:(kt,_,o)=>{"use strict";o.d(_,{A:()=>u});var a=o(14041);function u(w){var y=(0,a.useRef)();return(0,a.useEffect)(function(){y.current=w}),y.current}},33402:(kt,_,o)=>{"use strict";o.d(_,{b:()=>Ne,W:()=>Ze});var a=o(31085),u=o(14041),w=o(18690),y=o(82326),N=o(11618),W=o(83380),j=o(58850),K=o(93285),k=o(42899),yt=o(4387),T=o(13660),x=o(15246),$=o(91072),G=o(699),Ct=o(37281),rt=o(14158),Y=o(97214),mt=o(78560),st=o(64398),et=o(79182),b=o(18139),S=o(54195),H=o(72814),g=o(56005),it=o.n(g),X=o(17749);const Ut=(0,a.jsx)(yt.A,{animation:"wave",variant:"text",height:40}),ht=Rt=>{const{children:pt}=Rt,It=(0,N.YR)(),Jt=(0,b.gf)(S.U),Pt=(0,b.gf)($.n),{"*":R=""}=(0,w.g)(),{title:_t,setTitle:Dt,subtitle:Ht,setSubtitle:ft,entityRef:gt,metadata:{value:F,loading:vt},entityMetadata:{value:Vt,loading:nt}}=(0,W.V)();(0,u.useEffect)(()=>{F&&(Dt(F.site_name),ft(()=>{let{site_description:M}=F;return(!M||M==="None")&&(M=""),M}))},[F,Dt,ft]);const Tt=Jt.getOptional("app.title")||"Backstage",{locationMetadata:ae,spec:Ce}=Vt||{},ue=Ce?.lifecycle,re=Vt?(0,G.t)(Vt,Y.vv):[],Qe=(0,H.S)(X.rQ)(),ke=(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(st.S,{label:it()(Vt?.kind||"entity"),value:(0,a.jsx)(Ct.z,{color:"inherit",entityRef:gt,title:Vt?.metadata.title,defaultKind:"Component"})}),re.length>0&&(0,a.jsx)(st.S,{label:"Owner",value:(0,a.jsx)(rt.i,{color:"inherit",entityRefs:re,defaultKind:"group"})}),ue?(0,a.jsx)(st.S,{label:"Lifecycle",value:String(ue)}):null,ae&&ae.type!=="dir"&&ae.type!=="file"?(0,a.jsx)(st.S,{label:"",value:(0,a.jsxs)(k.A,{container:!0,direction:"column",alignItems:"center",children:[(0,a.jsx)(k.A,{style:{padding:0},item:!0,children:(0,a.jsx)(T.A,{style:{marginTop:"-25px"}})}),(0,a.jsx)(k.A,{style:{padding:0},item:!0,children:"Source"})]}),url:ae.target}):null]});if(!nt&&Vt===void 0||!vt&&F===void 0)return null;const he=(0,mt.U2)(gt),Le=Pt.forEntity(he).snapshot.primaryTitle,Ue=M=>M.replace(/\/$/,""),se=M=>M.replace(/-/g," ").split(" ").map(it()).join(" ");let Be=[];R!==""&&(Be=Ue(R).split("/").slice(0,3).map(se));const Ot=[Tt,Le,...Be].join(" | ");return(0,a.jsxs)(et.Y,{type:"Documentation",typeLink:Qe,title:_t||Ut,subtitle:Ht===""?void 0:Ht||Ut,children:[(0,a.jsx)(K.A,{titleTemplate:"%s",children:(0,a.jsx)("title",{children:Ot})}),ke,pt,It.renderComponentsByLocation(x.e.Header)]})};var Bt=o(84893),Lt=o(76888),oe=o(85408),Yt=o(12554),At=o(95208),Xt=o(64947),Mt=o(95159),z=o(61617),jt=o(91042),Wt=o(76842),$t=o(71834);const wt="/.backstage/auth/v1/cookie",Zt=365*24*36e5;function Qt(Rt){const{pluginId:pt}=Rt??{},It=(0,b.gf)(Mt.a),Jt=(0,b.gf)(z.I),Pt=(0,u.useMemo)(()=>"BroadcastChannel"in window?new BroadcastChannel(`${pt}-auth-cookie-expires-at`):null,[pt]),[R,_t]=(0,jt.Y)(async()=>{const gt=`${await Jt.getBaseUrl(pt)}${wt}`,F=await It.fetch(`${gt}`,{credentials:"include"});if(!F.ok){if(F.status===404)return{expiresAt:new Date(Date.now()+Zt)};throw await $t.o.fromResponse(F)}const vt=await F.json();if(!vt.expiresAt)throw new Error("No expiration date found in response");return vt});(0,Wt.u)(_t.execute);const Dt=(0,u.useCallback)(()=>{_t.execute()},[_t]),Ht=(0,u.useCallback)(ft=>{const gt=(1+3*Math.random())*6e4,F=Date.parse(ft.expiresAt)-Date.now()-gt,vt=setTimeout(Dt,F);return()=>clearTimeout(vt)},[Dt]);return(0,u.useEffect)(()=>{if(R.status!=="success"||!R.result)return()=>{};Pt?.postMessage({action:"COOKIE_REFRESH_SUCCESS",payload:R.result});let ft=Ht(R.result);const gt=F=>{const{action:vt,payload:Vt}=F.data;vt==="COOKIE_REFRESH_SUCCESS"&&(ft(),ft=Ht(Vt))};return Pt?.addEventListener("message",gt),()=>{ft(),Pt?.removeEventListener("message",gt)}},[R,Ht,Pt]),R.status==="not-executed"?{status:"loading"}:R.status==="loading"&&!R.result?{status:"loading"}:R.status==="loading"&&R.error?{status:"loading"}:R.status==="error"&&R.error?{status:"error",error:R.error,retry:Dt}:{status:"success",data:R.result}}function de(Rt){const{children:pt,...It}=Rt,Jt=(0,At.n)(),{Progress:Pt}=Jt.getComponents(),R=Qt(It);return R.status==="loading"?(0,a.jsx)(Pt,{}):R.status==="error"?(0,a.jsx)(Yt.b,{error:R.error,children:(0,a.jsx)(Xt.A,{variant:"outlined",onClick:R.retry,children:"Retry"})}):(0,a.jsx)(a.Fragment,{children:pt})}var xe=o(60882),be=o(54917),Se=o(98392),lt=o(50868);const Ne=Rt=>{const{withSearch:pt,withHeader:It=!0}=Rt;return(0,a.jsxs)(y.Y,{themeId:"documentation",children:[It&&(0,a.jsx)(ht,{}),(0,a.jsx)(Bt.Z,{}),(0,a.jsx)(j.p,{withSearch:pt})]})},Xe=(0,xe.A)(y.Y)({height:"inherit",overflowY:"visible"}),Ze=Rt=>{const pt=(0,be.A)(),It=(0,Se.A)({...pt,...Rt.overrideThemeOptions||{}}),{kind:Jt,name:Pt,namespace:R}=(0,Lt.K)(X.Oc),{children:_t,entityRef:Dt={kind:Jt,name:Pt,namespace:R}}=Rt,Ht=(0,w.P1)();if(!_t){const F=(Ht?u.Children.toArray(Ht.props.children):[]).flatMap(vt=>vt?.props?.children??[]).find(vt=>!(0,oe.E)(vt,N.AF)&&!(0,oe.E)(vt,N.Wm));return(0,a.jsx)(lt.A,{theme:It,children:(0,a.jsx)(de,{pluginId:"techdocs",children:(0,a.jsx)(W.R,{entityRef:Dt,children:F||(0,a.jsx)(Ne,{})})})})}return(0,a.jsx)(lt.A,{theme:It,children:(0,a.jsx)(de,{pluginId:"techdocs",children:(0,a.jsx)(W.R,{entityRef:Dt,children:({metadata:ft,entityMetadata:gt,onReady:F})=>(0,a.jsx)(Xe,{themeId:"documentation",className:"techdocs-reader-page",children:_t instanceof Function?_t({entityRef:Dt,techdocsMetadataValue:ft.value,entityMetadataValue:gt.value,onReady:F}):_t})})})})}},33986:(kt,_,o)=>{"use strict";o.d(_,{I:()=>Y,Z:()=>rt});var a=o(31085),u=o(19224),w=o(18139),y=o(54195),N=o(95208),W=o(29365),j=o(34839),K=o(16249),k=o(64947),yt=o(45917),T=o(14041),x=o(22771),$=o(87437),G=o(10265),Ct=o(92469);const rt=(0,T.forwardRef)((mt,st)=>{const{onChange:et,onKeyDown:b=()=>{},onClear:S=()=>{},onSubmit:H=()=>{},debounceTime:g=200,clearButton:it=!0,fullWidth:X=!0,value:Ut,label:ht,placeholder:Bt,inputProps:Lt={},InputProps:oe={},endAdornment:Yt,...At}=mt,Xt=(0,w.gf)(y.U),[Mt,z]=(0,T.useState)(""),jt=(0,T.useRef)(""),{t:Wt}=(0,G.i)(Ct._);(0,T.useEffect)(()=>{z(lt=>lt===jt.current?String(Ut):lt)},[Ut,jt]),(0,x.A)(()=>{jt.current=Mt,et(Mt)},g,[Mt]);const $t=(0,T.useCallback)(lt=>{z(lt.target.value)},[z]),wt=(0,T.useCallback)(lt=>{b&&b(lt),H&&lt.key==="Enter"&&H()},[b,H]),Zt=(0,T.useCallback)(()=>{jt.current="",et(""),z(""),S&&S()},[et,S]),Qt=ht?void 0:Wt("searchBar.title"),de=Bt??Wt("searchBar.placeholder",{org:Xt.getOptionalString("app.title")||"Backstage"}),xe=(0,N.n)().getSystemIcon("search")||yt.A,be=(0,a.jsx)(j.A,{position:"start",children:(0,a.jsx)(W.A,{"aria-label":"Query",size:"small",disabled:!0,children:(0,a.jsx)(xe,{})})}),Se=(0,a.jsx)(j.A,{position:"end",children:(0,a.jsx)(k.A,{"aria-label":Wt("searchBar.clearButtonTitle"),size:"small",onClick:Zt,onKeyDown:lt=>{lt.key==="Enter"&&lt.stopPropagation()},children:Wt("searchBar.clearButtonTitle")})});return(0,a.jsx)($.Lt,{inheritParentContextIfAvailable:!0,children:(0,a.jsx)(K.A,{id:"search-bar-text-field","data-testid":"search-bar-next",variant:"outlined",margin:"normal",inputRef:st,value:Mt,label:ht,placeholder:de,InputProps:{startAdornment:be,endAdornment:it?Se:Yt,...oe},inputProps:{"aria-label":Qt,...Lt},fullWidth:X,onChange:$t,onKeyDown:wt,...At})})}),Y=(0,T.forwardRef)((mt,st)=>{const{value:et="",onChange:b,...S}=mt,{term:H,setTerm:g}=(0,$.SQ)();(0,T.useEffect)(()=>{et&&g(String(et))},[et,g]);const it=(0,T.useCallback)(X=>{b?b(X):g(X)},[b,g]);return(0,a.jsx)($.Lt,{inheritParentContextIfAvailable:!0,children:(0,a.jsx)(u.I,{attributes:{pluginId:"search",extension:"SearchBar"},children:(0,a.jsx)(rt,{...S,ref:st,value:H,onChange:it})})})})},41472:(kt,_,o)=>{"use strict";o.r(_),o.d(_,{TechDocsSearchResultListItem:()=>k});var a=o(31085),u=o(46423),w=o(5951),y=o(58837),N=o(72501),W=o(75202),j=o(51470);const K=(0,y.A)({flexContainer:{flexWrap:"wrap"},itemText:{width:"100%",marginBottom:"1rem"}}),k=yt=>{const{result:T,highlight:x,lineClamp:$=5,asListItem:G=!0,asLink:Ct=!0,title:rt,icon:Y}=yt,mt=K(),st=({children:S})=>Ct?(0,a.jsx)(W.N_,{noTrack:!0,to:T.location,children:S}):(0,a.jsx)(a.Fragment,{children:S}),et=()=>{const S=x?.fields.title?(0,a.jsx)(j.e,{text:x.fields.title,preTag:x.preTag,postTag:x.postTag}):T.title,H=x?.fields.entityTitle?(0,a.jsx)(j.e,{text:x.fields.entityTitle,preTag:x.preTag,postTag:x.postTag}):T.entityTitle,g=x?.fields.name?(0,a.jsx)(j.e,{text:x.fields.name,preTag:x.preTag,postTag:x.postTag}):T.name;return T?(0,a.jsx)(w.A,{className:mt.itemText,primaryTypographyProps:{variant:"h6"},primary:(0,a.jsx)(st,{children:rt||(0,a.jsxs)(a.Fragment,{children:[S," | ",H??g," docs"]})}),secondary:(0,a.jsx)(N.A,{component:"span",style:{display:"-webkit-box",WebkitBoxOrient:"vertical",WebkitLineClamp:$,overflow:"hidden"},color:"textSecondary",variant:"body2",children:x?.fields.text?(0,a.jsx)(j.e,{text:x.fields.text,preTag:x.preTag,postTag:x.postTag}):T.text})}):null},b=({children:S})=>G?(0,a.jsxs)(a.Fragment,{children:[Y&&(0,a.jsx)(u.A,{children:typeof Y=="function"?Y(T):Y}),(0,a.jsx)("div",{className:mt.flexContainer,children:S})]}):(0,a.jsx)(a.Fragment,{children:S});return(0,a.jsx)(b,{children:(0,a.jsx)(et,{})})}},56005:(kt,_,o)=>{var a=o(95243),u=o(5485);function w(y){return u(a(y).toLowerCase())}kt.exports=w},58850:(kt,_,o)=>{"use strict";o.d(_,{p:()=>Da});var a=o(31085),u=o(14041),w=o(42899),y=o(58837),N=o(83380),W=o(9394),j=o(91360),K=o(22856);const k="TECH_DOCS_SHADOW_DOM_STYLE_LOAD",yt=t=>{(0,u.useEffect)(()=>{if(!t)return()=>{};const e=t.querySelectorAll('head > link[rel="stylesheet"]');let r=e?.length??0;const s=new CustomEvent(k);if(!r)return t.dispatchEvent(s),()=>{};const i=()=>{--r===0&&t.dispatchEvent(s)};return e?.forEach(l=>{l.addEventListener("load",i)}),()=>{e?.forEach(l=>{l.removeEventListener("load",i)})}},[t])},T=t=>{const[e,r]=(0,u.useState)(!1);return(0,u.useEffect)(()=>{if(!t)return()=>{};r(!0);const s=t.style;s.setProperty("opacity","0");const i=()=>{r(!1),s.setProperty("opacity","1")};return t.addEventListener(k,i),()=>{t.removeEventListener(k,i)}},[t]),e},x=t=>{const{element:e,onAppend:r,children:s}=t,[i,l]=(0,u.useState)((0,W.vt)({...(0,K.A)(),insertionPoint:void 0}));yt(e);const d=(0,u.useCallback)(p=>{if(!e||!p)return;l((0,W.vt)({...(0,K.A)(),insertionPoint:e.querySelector("head")||void 0}));let f=p.shadowRoot;f||(f=p.attachShadow({mode:"open"})),f.replaceChildren(e),typeof r=="function"&&r(f)},[e,r]);return(0,a.jsx)(a.Fragment,{children:(0,a.jsxs)(j.Ay,{jss:i,sheetsManager:new Map,children:[(0,a.jsx)("div",{ref:d,"data-testid":"techdocs-native-shadowroot"}),s]})})};var $=o(85639),G=o(16454),Ct=o(96872),rt=o(87437),Y=o(78467),mt=o(61783),st=o(33986);const et=(0,y.A)(t=>({loading:{right:t.spacing(1),position:"absolute"}})),b=t=>e=>(0,a.jsx)(rt.Lt,{inheritParentContextIfAvailable:!0,children:(0,a.jsx)(t,{...e})}),S=()=>{const t=et();return(0,a.jsx)(Y.A,{className:t.loading,"data-testid":"search-autocomplete-progressbar",color:"inherit",size:20})},H=b(function(e){const{loading:r,value:s,onChange:i=()=>{},options:l=[],getOptionLabel:d=L=>String(L),inputPlaceholder:p,inputDebounceTime:f,freeSolo:A=!0,fullWidth:E=!0,clearOnBlur:C=!1,"data-testid":ot="search-autocomplete",...ct}=e,{setTerm:Z}=(0,rt.SQ)(),D=(0,u.useCallback)(L=>L?typeof L=="string"?L:d(L):"",[d]),zt=(0,u.useMemo)(()=>D(s),[s,D]),Kt=(0,u.useCallback)((L,O,Nt,U)=>{Z(D(O)),i(L,O,Nt,U)},[D,Z,i]),I=(0,u.useCallback)(({InputProps:{ref:L,className:O,endAdornment:Nt},InputLabelProps:U,...Q})=>(0,a.jsx)(st.I,{...Q,ref:L,clearButton:!1,value:zt,placeholder:p,debounceTime:f,endAdornment:r?(0,a.jsx)(S,{}):Nt,InputProps:{className:O}}),[r,zt,p,f]);return(0,a.jsx)(mt.Ay,{...ct,"data-testid":ot,value:s,onChange:Kt,options:l,getOptionLabel:d,renderInput:I,freeSolo:A,fullWidth:E,clearOnBlur:C})});var g=o(18690),it=o(41472);const X=t=>t?.document,Ut=t=>{const{entityId:e,entityTitle:r,debounceTime:s=150,searchResultUrlMapper:i}=t,[l,d]=(0,u.useState)(!1),p=(0,g.Zp)(),{setFilters:f,term:A,result:{loading:E,value:C}}=(0,rt.SQ)(),[ot,ct]=(0,u.useState)([]);(0,u.useEffect)(()=>{let I=!0;if(I&&C){const L=C.results.slice(0,10);ct(L)}return()=>{I=!1}},[E,C]);const{kind:Z,name:D,namespace:zt}=e;(0,u.useEffect)(()=>{f(I=>({...I,kind:Z,namespace:zt,name:D}))},[Z,zt,D,f]);const Kt=(I,L)=>{if(X(L)){const{location:O}=L.document;p(i?i(O):O)}};return(0,a.jsx)(H,{"data-testid":"techdocs-search-bar",size:"small",open:l&&!!A,getOptionLabel:()=>"",filterOptions:I=>I,onClose:()=>{d(!1)},onOpen:()=>{d(!0)},onChange:Kt,blurOnSelect:!0,noOptionsText:"No results found",value:null,options:ot,renderOption:({document:I,highlight:L})=>(0,a.jsx)(it.TechDocsSearchResultListItem,{result:I,lineClamp:3,asListItem:!1,asLink:!1,title:I.title,highlight:L}),loading:E,inputDebounceTime:s,inputPlaceholder:`Search ${r||e.name} docs`,freeSolo:!1})},ht=t=>{const e={term:"",types:["techdocs"],pageCursor:"",filters:t.entityId};return(0,a.jsx)(rt.Lt,{initialState:e,children:(0,a.jsx)(Ut,{...t})})};var Bt=o(64947),Lt=o(74219),oe=o(67296),Yt=o(73845),At=o(29365),Xt=o(72501),Mt=o(99703),z=o(32881);const jt=(0,y.A)(t=>(0,Mt.A)({paper:{width:"100%",[t.breakpoints.up("sm")]:{width:"75%"},[t.breakpoints.up("md")]:{width:"50%"},padding:t.spacing(2.5)},root:{height:"100%",overflow:"hidden"},logs:{background:t.palette.background.default}})),Wt=({buildLog:t,onClose:e})=>{const r=jt(),s=t.length===0?"Waiting for logs...":t.join(`
`);return(0,a.jsxs)(w.A,{container:!0,direction:"column",className:r.root,spacing:0,wrap:"nowrap",children:[(0,a.jsxs)(w.A,{item:!0,container:!0,justifyContent:"space-between",alignItems:"center",spacing:0,wrap:"nowrap",children:[(0,a.jsx)(Xt.A,{variant:"h5",children:"Build Details"}),(0,a.jsx)(At.A,{title:"Close the drawer",onClick:e,color:"inherit",children:(0,a.jsx)(z.A,{})},"dismiss")]}),(0,a.jsx)(w.A,{item:!0,xs:!0,children:(0,a.jsx)(oe.r,{text:s,classes:{root:r.logs}})})]})},$t=({buildLog:t})=>{const e=jt(),[r,s]=(0,u.useState)(!1);return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(Bt.A,{color:"inherit",onClick:()=>s(!0),children:"Show Build Logs"}),(0,a.jsx)(Yt.Ay,{classes:{paper:e.paper},anchor:"right",open:r,onClose:()=>s(!1),children:(0,a.jsx)(Wt,{buildLog:t,onClose:()=>s(!1)})})]})};var wt=o(18139),Zt=o(54195),Qt=o(52262),de=o(41544);const xe=({errorMessage:t})=>{const e=(0,wt.gf)(Zt.U).getOptionalString("techdocs.builder"),r=(0,Qt.s)(),{entityRef:s}=(0,N.V)(),i=(0,g.zy)();(0,u.useEffect)(()=>{const{pathname:d,search:p,hash:f}=i;r.captureEvent("not-found",`${d}${p}${f}`,{attributes:s})},[r,s,i]);let l="";return[void 0,"local"].includes(e)||(l="Note that techdocs.builder is not set to 'local' in your config, which means this Backstage app will not generate docs if they are not found. Make sure the project's docs are generated and published by some external process (e.g. CI/CD pipeline). Or change techdocs.builder to 'local' to generate docs from this Backstage instance."),(0,a.jsx)(de.M,{status:"404",statusMessage:t||"Documentation not found",additionalInfo:l})};var be=o(73466),Se=o(28966),lt=o(49707);function Ne({contentLoading:t,content:e,activeSyncState:r}){return t||r==="BUILD_READY_RELOAD"||!e&&r==="CHECKING"?"CHECKING":!e&&r==="BUILDING"?"INITIAL_BUILD":e?r==="BUILDING"?"CONTENT_STALE_REFRESHING":r==="BUILD_READY"?"CONTENT_STALE_READY":r==="ERROR"?"CONTENT_STALE_ERROR":"CONTENT_FRESH":"CONTENT_NOT_FOUND"}function Xe(t,e){const r={...t};switch(e.type){case"sync":e.state==="CHECKING"&&(r.buildLog=[]),r.activeSyncState=e.state,r.syncError=e.syncError;break;case"contentLoading":r.contentLoading=!0,r.contentError=void 0;break;case"content":typeof e.path=="string"&&(r.path=e.path),r.contentLoading=!1,r.content=e.content,r.contentError=e.contentError;break;case"buildLog":r.buildLog=r.buildLog.concat(e.log);break;default:throw new Error}return["BUILD_READY","BUILD_READY_RELOAD"].includes(r.activeSyncState)&&["contentLoading","content"].includes(e.type)&&(r.activeSyncState="UP_TO_DATE",r.buildLog=[]),r}function Ze(t,e,r,s){const[i,l]=(0,u.useReducer)(Xe,{activeSyncState:"CHECKING",path:s,contentLoading:!0,buildLog:[]}),d=(0,wt.gf)(lt.s),{retry:p}=(0,Se.A)(async()=>{l({type:"contentLoading"});try{const E=await d.getEntityDocs({kind:t,namespace:e,name:r},s);return l({type:"content",content:E,path:s}),E}catch(E){l({type:"content",contentError:E,path:s})}},[d,t,e,r,s]),f=(0,u.useRef)({content:void 0,reload:()=>{}});f.current={content:i.content,reload:p},(0,be.A)(async()=>{l({type:"sync",state:"CHECKING"});const E=setTimeout(()=>{l({type:"sync",state:"BUILDING"})},1e3);try{switch(await d.syncEntityDocs({kind:t,namespace:e,name:r},ot=>{l({type:"buildLog",log:ot})})){case"updated":f.current.content?l({type:"sync",state:"BUILD_READY"}):(f.current.reload(),l({type:"sync",state:"BUILD_READY_RELOAD"}));break;case"cached":l({type:"sync",state:"UP_TO_DATE"});break;default:l({type:"sync",state:"ERROR",syncError:new Error("Unexpected return state")});break}}catch(C){l({type:"sync",state:"ERROR",syncError:C})}finally{clearTimeout(E)}},[t,r,e,d,l,f]);const A=(0,u.useMemo)(()=>Ne({activeSyncState:i.activeSyncState,contentLoading:i.contentLoading,content:i.content}),[i.activeSyncState,i.content,i.contentLoading]);return(0,u.useMemo)(()=>({state:A,contentReload:p,path:i.path,content:i.content,contentErrorMessage:i.contentError?.toString(),syncErrorMessage:i.syncError?.toString(),buildLog:i.buildLog}),[A,p,i.path,i.content,i.contentError,i.syncError,i.buildLog])}const Rt=(0,u.createContext)({}),pt=()=>(0,u.useContext)(Rt),It=t=>{const{children:e}=t,{"*":r=""}=(0,g.g)(),{entityRef:s}=(0,N.V)(),{kind:i,namespace:l,name:d}=s,p=Ze(i,l,d,r);return(0,a.jsx)(Rt.Provider,{value:p,children:e instanceof Function?e(p):e})},Jt=t=>e=>(0,a.jsx)(It,{children:(0,a.jsx)(t,{...e})}),Pt=(0,y.A)(t=>({root:{marginBottom:t.spacing(2)},message:{wordBreak:"break-word",overflowWrap:"anywhere"}})),R=()=>{let t=null;const e=Pt(),{state:r,contentReload:s,contentErrorMessage:i,syncErrorMessage:l,buildLog:d}=pt();return r==="INITIAL_BUILD"&&(t=(0,a.jsx)(Lt.A,{classes:{root:e.root},variant:"outlined",severity:"info",icon:(0,a.jsx)(Y.A,{size:"24px"}),action:(0,a.jsx)($t,{buildLog:d}),children:"Documentation is accessed for the first time and is being prepared. The subsequent loads are much faster."})),r==="CONTENT_STALE_REFRESHING"&&(t=(0,a.jsx)(Lt.A,{variant:"outlined",severity:"info",icon:(0,a.jsx)(Y.A,{size:"24px"}),action:(0,a.jsx)($t,{buildLog:d}),classes:{root:e.root},children:"A newer version of this documentation is being prepared and will be available shortly."})),r==="CONTENT_STALE_READY"&&(t=(0,a.jsx)(Lt.A,{variant:"outlined",severity:"success",action:(0,a.jsx)(Bt.A,{color:"inherit",onClick:()=>s(),children:"Refresh"}),classes:{root:e.root},children:"A newer version of this documentation is now available, please refresh to view."})),r==="CONTENT_STALE_ERROR"&&(t=(0,a.jsxs)(Lt.A,{variant:"outlined",severity:"error",action:(0,a.jsx)($t,{buildLog:d}),classes:{root:e.root,message:e.message},children:["Building a newer version of this documentation failed."," ",l]})),r==="CONTENT_NOT_FOUND"&&(t=(0,a.jsxs)(a.Fragment,{children:[l&&(0,a.jsxs)(Lt.A,{variant:"outlined",severity:"error",action:(0,a.jsx)($t,{buildLog:d}),classes:{root:e.root,message:e.message},children:["Building a newer version of this documentation failed."," ",l]}),(0,a.jsx)(xe,{errorMessage:i})]})),t};var _t=o(5893),Dt=o(54917),Ht=o(56004);/*! @license DOMPurify 3.2.6 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.2.6/LICENSE */const{entries:ft,setPrototypeOf:gt,isFrozen:F,getPrototypeOf:vt,getOwnPropertyDescriptor:Vt}=Object;let{freeze:nt,seal:Tt,create:ae}=Object,{apply:Ce,construct:ue}=typeof Reflect<"u"&&Reflect;nt||(nt=function(e){return e}),Tt||(Tt=function(e){return e}),Ce||(Ce=function(e,r,s){return e.apply(r,s)}),ue||(ue=function(e,r){return new e(...r)});const re=Et(Array.prototype.forEach),Qe=Et(Array.prototype.lastIndexOf),ke=Et(Array.prototype.pop),me=Et(Array.prototype.push),vn=Et(Array.prototype.splice),he=Et(String.prototype.toLowerCase),Le=Et(String.prototype.toString),Ue=Et(String.prototype.match),se=Et(String.prototype.replace),Be=Et(String.prototype.indexOf),En=Et(String.prototype.trim),Ot=Et(Object.prototype.hasOwnProperty),M=Et(RegExp.prototype.test),we=ro(TypeError);function Et(t){return function(e){e instanceof RegExp&&(e.lastIndex=0);for(var r=arguments.length,s=new Array(r>1?r-1:0),i=1;i<r;i++)s[i-1]=arguments[i];return Ce(t,e,s)}}function ro(t){return function(){for(var e=arguments.length,r=new Array(e),s=0;s<e;s++)r[s]=arguments[s];return ue(t,r)}}function v(t,e){let r=arguments.length>2&&arguments[2]!==void 0?arguments[2]:he;gt&&gt(t,null);let s=e.length;for(;s--;){let i=e[s];if(typeof i=="string"){const l=r(i);l!==i&&(F(e)||(e[s]=l),i=l)}t[i]=!0}return t}function so(t){for(let e=0;e<t.length;e++)Ot(t,e)||(t[e]=null);return t}function qt(t){const e=ae(null);for(const[r,s]of ft(t))Ot(t,r)&&(Array.isArray(s)?e[r]=so(s):s&&typeof s=="object"&&s.constructor===Object?e[r]=qt(s):e[r]=s);return e}function Re(t,e){for(;t!==null;){const s=Vt(t,e);if(s){if(s.get)return Et(s.get);if(typeof s.value=="function")return Et(s.value)}t=vt(t)}function r(){return null}return r}const yn=nt(["a","abbr","acronym","address","area","article","aside","audio","b","bdi","bdo","big","blink","blockquote","body","br","button","canvas","caption","center","cite","code","col","colgroup","content","data","datalist","dd","decorator","del","details","dfn","dialog","dir","div","dl","dt","element","em","fieldset","figcaption","figure","font","footer","form","h1","h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","img","input","ins","kbd","label","legend","li","main","map","mark","marquee","menu","menuitem","meter","nav","nobr","ol","optgroup","option","output","p","picture","pre","progress","q","rp","rt","ruby","s","samp","section","select","shadow","small","source","spacer","span","strike","strong","style","sub","summary","sup","table","tbody","td","template","textarea","tfoot","th","thead","time","tr","track","tt","u","ul","var","video","wbr"]),Je=nt(["svg","a","altglyph","altglyphdef","altglyphitem","animatecolor","animatemotion","animatetransform","circle","clippath","defs","desc","ellipse","filter","font","g","glyph","glyphref","hkern","image","line","lineargradient","marker","mask","metadata","mpath","path","pattern","polygon","polyline","radialgradient","rect","stop","style","switch","symbol","text","textpath","title","tref","tspan","view","vkern"]),qe=nt(["feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feDropShadow","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence"]),io=nt(["animate","color-profile","cursor","discard","font-face","font-face-format","font-face-name","font-face-src","font-face-uri","foreignobject","hatch","hatchpath","mesh","meshgradient","meshpatch","meshrow","missing-glyph","script","set","solidcolor","unknown","use"]),tn=nt(["math","menclose","merror","mfenced","mfrac","mglyph","mi","mlabeledtr","mmultiscripts","mn","mo","mover","mpadded","mphantom","mroot","mrow","ms","mspace","msqrt","mstyle","msub","msup","msubsup","mtable","mtd","mtext","mtr","munder","munderover","mprescripts"]),lo=nt(["maction","maligngroup","malignmark","mlongdiv","mscarries","mscarry","msgroup","mstack","msline","msrow","semantics","annotation","annotation-xml","mprescripts","none"]),An=nt(["#text"]),Tn=nt(["accept","action","align","alt","autocapitalize","autocomplete","autopictureinpicture","autoplay","background","bgcolor","border","capture","cellpadding","cellspacing","checked","cite","class","clear","color","cols","colspan","controls","controlslist","coords","crossorigin","datetime","decoding","default","dir","disabled","disablepictureinpicture","disableremoteplayback","download","draggable","enctype","enterkeyhint","face","for","headers","height","hidden","high","href","hreflang","id","inputmode","integrity","ismap","kind","label","lang","list","loading","loop","low","max","maxlength","media","method","min","minlength","multiple","muted","name","nonce","noshade","novalidate","nowrap","open","optimum","pattern","placeholder","playsinline","popover","popovertarget","popovertargetaction","poster","preload","pubdate","radiogroup","readonly","rel","required","rev","reversed","role","rows","rowspan","spellcheck","scope","selected","shape","size","sizes","span","srclang","start","src","srcset","step","style","summary","tabindex","title","translate","type","usemap","valign","value","width","wrap","xmlns","slot"]),en=nt(["accent-height","accumulate","additive","alignment-baseline","amplitude","ascent","attributename","attributetype","azimuth","basefrequency","baseline-shift","begin","bias","by","class","clip","clippathunits","clip-path","clip-rule","color","color-interpolation","color-interpolation-filters","color-profile","color-rendering","cx","cy","d","dx","dy","diffuseconstant","direction","display","divisor","dur","edgemode","elevation","end","exponent","fill","fill-opacity","fill-rule","filter","filterunits","flood-color","flood-opacity","font-family","font-size","font-size-adjust","font-stretch","font-style","font-variant","font-weight","fx","fy","g1","g2","glyph-name","glyphref","gradientunits","gradienttransform","height","href","id","image-rendering","in","in2","intercept","k","k1","k2","k3","k4","kerning","keypoints","keysplines","keytimes","lang","lengthadjust","letter-spacing","kernelmatrix","kernelunitlength","lighting-color","local","marker-end","marker-mid","marker-start","markerheight","markerunits","markerwidth","maskcontentunits","maskunits","max","mask","media","method","mode","min","name","numoctaves","offset","operator","opacity","order","orient","orientation","origin","overflow","paint-order","path","pathlength","patterncontentunits","patterntransform","patternunits","points","preservealpha","preserveaspectratio","primitiveunits","r","rx","ry","radius","refx","refy","repeatcount","repeatdur","restart","result","rotate","scale","seed","shape-rendering","slope","specularconstant","specularexponent","spreadmethod","startoffset","stddeviation","stitchtiles","stop-color","stop-opacity","stroke-dasharray","stroke-dashoffset","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","stroke","stroke-width","style","surfacescale","systemlanguage","tabindex","tablevalues","targetx","targety","transform","transform-origin","text-anchor","text-decoration","text-rendering","textlength","type","u1","u2","unicode","values","viewbox","visibility","version","vert-adv-y","vert-origin-x","vert-origin-y","width","word-spacing","wrap","writing-mode","xchannelselector","ychannelselector","x","x1","x2","xmlns","y","y1","y2","z","zoomandpan"]),xn=nt(["accent","accentunder","align","bevelled","close","columnsalign","columnlines","columnspan","denomalign","depth","dir","display","displaystyle","encoding","fence","frame","height","href","id","largeop","length","linethickness","lspace","lquote","mathbackground","mathcolor","mathsize","mathvariant","maxsize","minsize","movablelimits","notation","numalign","open","rowalign","rowlines","rowspacing","rowspan","rspace","rquote","scriptlevel","scriptminsize","scriptsizemultiplier","selection","separator","separators","stretchy","subscriptshift","supscriptshift","symmetric","voffset","width","xmlns"]),je=nt(["xlink:href","xml:id","xlink:title","xml:space","xmlns:xlink"]),co=Tt(/\{\{[\w\W]*|[\w\W]*\}\}/gm),uo=Tt(/<%[\w\W]*|[\w\W]*%>/gm),mo=Tt(/\$\{[\w\W]*/gm),ho=Tt(/^data-[\-\w.\u00B7-\uFFFF]+$/),po=Tt(/^aria-[\-\w]+$/),bn=Tt(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i),fo=Tt(/^(?:\w+script|data):/i),go=Tt(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g),Sn=Tt(/^html$/i),vo=Tt(/^[a-z][.\w]*(-[.\w]+)+$/i);var Cn=Object.freeze({__proto__:null,ARIA_ATTR:po,ATTR_WHITESPACE:go,CUSTOM_ELEMENT:vo,DATA_ATTR:ho,DOCTYPE_NAME:Sn,ERB_EXPR:uo,IS_ALLOWED_URI:bn,IS_SCRIPT_OR_DATA:fo,MUSTACHE_EXPR:co,TMPLIT_EXPR:mo});const De={element:1,attribute:2,text:3,cdataSection:4,entityReference:5,entityNode:6,progressingInstruction:7,comment:8,document:9,documentType:10,documentFragment:11,notation:12},Eo=function(){return typeof window>"u"?null:window},yo=function(e,r){if(typeof e!="object"||typeof e.createPolicy!="function")return null;let s=null;const i="data-tt-policy-suffix";r&&r.hasAttribute(i)&&(s=r.getAttribute(i));const l="dompurify"+(s?"#"+s:"");try{return e.createPolicy(l,{createHTML(d){return d},createScriptURL(d){return d}})}catch{return console.warn("TrustedTypes policy "+l+" could not be created."),null}},Ln=function(){return{afterSanitizeAttributes:[],afterSanitizeElements:[],afterSanitizeShadowDOM:[],beforeSanitizeAttributes:[],beforeSanitizeElements:[],beforeSanitizeShadowDOM:[],uponSanitizeAttribute:[],uponSanitizeElement:[],uponSanitizeShadowNode:[]}};function wn(){let t=arguments.length>0&&arguments[0]!==void 0?arguments[0]:Eo();const e=h=>wn(h);if(e.version="3.2.6",e.removed=[],!t||!t.document||t.document.nodeType!==De.document||!t.Element)return e.isSupported=!1,e;let{document:r}=t;const s=r,i=s.currentScript,{DocumentFragment:l,HTMLTemplateElement:d,Node:p,Element:f,NodeFilter:A,NamedNodeMap:E=t.NamedNodeMap||t.MozNamedAttrMap,HTMLFormElement:C,DOMParser:ot,trustedTypes:ct}=t,Z=f.prototype,D=Re(Z,"cloneNode"),zt=Re(Z,"remove"),Kt=Re(Z,"nextSibling"),I=Re(Z,"childNodes"),L=Re(Z,"parentNode");if(typeof d=="function"){const h=r.createElement("template");h.content&&h.content.ownerDocument&&(r=h.content.ownerDocument)}let O,Nt="";const{implementation:U,createNodeIterator:Q,createDocumentFragment:bt,getElementsByTagName:ie}=r,{importNode:Ft}=s;let J=Ln();e.isSupported=typeof ft=="function"&&typeof L=="function"&&U&&U.createHTMLDocument!==void 0;const{MUSTACHE_EXPR:le,ERB_EXPR:pe,TMPLIT_EXPR:ze,DATA_ATTR:an,ARIA_ATTR:Oa,IS_SCRIPT_OR_DATA:Ma,ATTR_WHITESPACE:_n,CUSTOM_ELEMENT:Ia}=Cn;let{IS_ALLOWED_URI:Nn}=Cn,q=null;const kn=v({},[...yn,...Je,...qe,...tn,...An]);let at=null;const Un=v({},[...Tn,...en,...xn,...je]);let B=Object.seal(ae(null,{tagNameCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},attributeNameCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},allowCustomizedBuiltInElements:{writable:!0,configurable:!1,enumerable:!0,value:!1}})),Me=null,rn=null,Bn=!0,sn=!0,jn=!1,Hn=!0,fe=!1,Fe=!0,ce=!1,ln=!1,cn=!1,ge=!1,We=!1,$e=!1,zn=!0,Fn=!1;const Pa="user-content-";let dn=!0,Ie=!1,ve={},Ee=null;const Wn=v({},["annotation-xml","audio","colgroup","desc","foreignobject","head","iframe","math","mi","mn","mo","ms","mtext","noembed","noframes","noscript","plaintext","script","style","svg","template","thead","title","video","xmp"]);let $n=null;const Vn=v({},["audio","video","img","source","image","track"]);let un=null;const Kn=v({},["alt","class","for","id","label","name","pattern","placeholder","role","summary","title","value","style","xmlns"]),Ve="http://www.w3.org/1998/Math/MathML",Ke="http://www.w3.org/2000/svg",te="http://www.w3.org/1999/xhtml";let ye=te,mn=!1,hn=null;const _a=v({},[Ve,Ke,te],Le);let Ge=v({},["mi","mo","mn","ms","mtext"]),Ye=v({},["annotation-xml"]);const Na=v({},["title","style","font","a","script"]);let Pe=null;const ka=["application/xhtml+xml","text/html"],Ua="text/html";let tt=null,Ae=null;const Ba=r.createElement("form"),Gn=function(n){return n instanceof RegExp||n instanceof Function},pn=function(){let n=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};if(!(Ae&&Ae===n)){if((!n||typeof n!="object")&&(n={}),n=qt(n),Pe=ka.indexOf(n.PARSER_MEDIA_TYPE)===-1?Ua:n.PARSER_MEDIA_TYPE,tt=Pe==="application/xhtml+xml"?Le:he,q=Ot(n,"ALLOWED_TAGS")?v({},n.ALLOWED_TAGS,tt):kn,at=Ot(n,"ALLOWED_ATTR")?v({},n.ALLOWED_ATTR,tt):Un,hn=Ot(n,"ALLOWED_NAMESPACES")?v({},n.ALLOWED_NAMESPACES,Le):_a,un=Ot(n,"ADD_URI_SAFE_ATTR")?v(qt(Kn),n.ADD_URI_SAFE_ATTR,tt):Kn,$n=Ot(n,"ADD_DATA_URI_TAGS")?v(qt(Vn),n.ADD_DATA_URI_TAGS,tt):Vn,Ee=Ot(n,"FORBID_CONTENTS")?v({},n.FORBID_CONTENTS,tt):Wn,Me=Ot(n,"FORBID_TAGS")?v({},n.FORBID_TAGS,tt):qt({}),rn=Ot(n,"FORBID_ATTR")?v({},n.FORBID_ATTR,tt):qt({}),ve=Ot(n,"USE_PROFILES")?n.USE_PROFILES:!1,Bn=n.ALLOW_ARIA_ATTR!==!1,sn=n.ALLOW_DATA_ATTR!==!1,jn=n.ALLOW_UNKNOWN_PROTOCOLS||!1,Hn=n.ALLOW_SELF_CLOSE_IN_ATTR!==!1,fe=n.SAFE_FOR_TEMPLATES||!1,Fe=n.SAFE_FOR_XML!==!1,ce=n.WHOLE_DOCUMENT||!1,ge=n.RETURN_DOM||!1,We=n.RETURN_DOM_FRAGMENT||!1,$e=n.RETURN_TRUSTED_TYPE||!1,cn=n.FORCE_BODY||!1,zn=n.SANITIZE_DOM!==!1,Fn=n.SANITIZE_NAMED_PROPS||!1,dn=n.KEEP_CONTENT!==!1,Ie=n.IN_PLACE||!1,Nn=n.ALLOWED_URI_REGEXP||bn,ye=n.NAMESPACE||te,Ge=n.MATHML_TEXT_INTEGRATION_POINTS||Ge,Ye=n.HTML_INTEGRATION_POINTS||Ye,B=n.CUSTOM_ELEMENT_HANDLING||{},n.CUSTOM_ELEMENT_HANDLING&&Gn(n.CUSTOM_ELEMENT_HANDLING.tagNameCheck)&&(B.tagNameCheck=n.CUSTOM_ELEMENT_HANDLING.tagNameCheck),n.CUSTOM_ELEMENT_HANDLING&&Gn(n.CUSTOM_ELEMENT_HANDLING.attributeNameCheck)&&(B.attributeNameCheck=n.CUSTOM_ELEMENT_HANDLING.attributeNameCheck),n.CUSTOM_ELEMENT_HANDLING&&typeof n.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements=="boolean"&&(B.allowCustomizedBuiltInElements=n.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements),fe&&(sn=!1),We&&(ge=!0),ve&&(q=v({},An),at=[],ve.html===!0&&(v(q,yn),v(at,Tn)),ve.svg===!0&&(v(q,Je),v(at,en),v(at,je)),ve.svgFilters===!0&&(v(q,qe),v(at,en),v(at,je)),ve.mathMl===!0&&(v(q,tn),v(at,xn),v(at,je))),n.ADD_TAGS&&(q===kn&&(q=qt(q)),v(q,n.ADD_TAGS,tt)),n.ADD_ATTR&&(at===Un&&(at=qt(at)),v(at,n.ADD_ATTR,tt)),n.ADD_URI_SAFE_ATTR&&v(un,n.ADD_URI_SAFE_ATTR,tt),n.FORBID_CONTENTS&&(Ee===Wn&&(Ee=qt(Ee)),v(Ee,n.FORBID_CONTENTS,tt)),dn&&(q["#text"]=!0),ce&&v(q,["html","head","body"]),q.table&&(v(q,["tbody"]),delete Me.tbody),n.TRUSTED_TYPES_POLICY){if(typeof n.TRUSTED_TYPES_POLICY.createHTML!="function")throw we('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');if(typeof n.TRUSTED_TYPES_POLICY.createScriptURL!="function")throw we('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');O=n.TRUSTED_TYPES_POLICY,Nt=O.createHTML("")}else O===void 0&&(O=yo(ct,i)),O!==null&&typeof Nt=="string"&&(Nt=O.createHTML(""));nt&&nt(n),Ae=n}},Yn=v({},[...Je,...qe,...io]),Xn=v({},[...tn,...lo]),ja=function(n){let c=L(n);(!c||!c.tagName)&&(c={namespaceURI:ye,tagName:"template"});const m=he(n.tagName),P=he(c.tagName);return hn[n.namespaceURI]?n.namespaceURI===Ke?c.namespaceURI===te?m==="svg":c.namespaceURI===Ve?m==="svg"&&(P==="annotation-xml"||Ge[P]):!!Yn[m]:n.namespaceURI===Ve?c.namespaceURI===te?m==="math":c.namespaceURI===Ke?m==="math"&&Ye[P]:!!Xn[m]:n.namespaceURI===te?c.namespaceURI===Ke&&!Ye[P]||c.namespaceURI===Ve&&!Ge[P]?!1:!Xn[m]&&(Na[m]||!Yn[m]):!!(Pe==="application/xhtml+xml"&&hn[n.namespaceURI]):!1},Gt=function(n){me(e.removed,{element:n});try{L(n).removeChild(n)}catch{zt(n)}},Te=function(n,c){try{me(e.removed,{attribute:c.getAttributeNode(n),from:c})}catch{me(e.removed,{attribute:null,from:c})}if(c.removeAttribute(n),n==="is")if(ge||We)try{Gt(c)}catch{}else try{c.setAttribute(n,"")}catch{}},Zn=function(n){let c=null,m=null;if(cn)n="<remove></remove>"+n;else{const V=Ue(n,/^[\r\n\t ]+/);m=V&&V[0]}Pe==="application/xhtml+xml"&&ye===te&&(n='<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>'+n+"</body></html>");const P=O?O.createHTML(n):n;if(ye===te)try{c=new ot().parseFromString(P,Pe)}catch{}if(!c||!c.documentElement){c=U.createDocument(ye,"template",null);try{c.documentElement.innerHTML=mn?Nt:P}catch{}}const dt=c.body||c.documentElement;return n&&m&&dt.insertBefore(r.createTextNode(m),dt.childNodes[0]||null),ye===te?ie.call(c,ce?"html":"body")[0]:ce?c.documentElement:dt},Qn=function(n){return Q.call(n.ownerDocument||n,n,A.SHOW_ELEMENT|A.SHOW_COMMENT|A.SHOW_TEXT|A.SHOW_PROCESSING_INSTRUCTION|A.SHOW_CDATA_SECTION,null)},fn=function(n){return n instanceof C&&(typeof n.nodeName!="string"||typeof n.textContent!="string"||typeof n.removeChild!="function"||!(n.attributes instanceof E)||typeof n.removeAttribute!="function"||typeof n.setAttribute!="function"||typeof n.namespaceURI!="string"||typeof n.insertBefore!="function"||typeof n.hasChildNodes!="function")},Jn=function(n){return typeof p=="function"&&n instanceof p};function ee(h,n,c){re(h,m=>{m.call(e,n,c,Ae)})}const qn=function(n){let c=null;if(ee(J.beforeSanitizeElements,n,null),fn(n))return Gt(n),!0;const m=tt(n.nodeName);if(ee(J.uponSanitizeElement,n,{tagName:m,allowedTags:q}),Fe&&n.hasChildNodes()&&!Jn(n.firstElementChild)&&M(/<[/\w!]/g,n.innerHTML)&&M(/<[/\w!]/g,n.textContent)||n.nodeType===De.progressingInstruction||Fe&&n.nodeType===De.comment&&M(/<[/\w]/g,n.data))return Gt(n),!0;if(!q[m]||Me[m]){if(!Me[m]&&eo(m)&&(B.tagNameCheck instanceof RegExp&&M(B.tagNameCheck,m)||B.tagNameCheck instanceof Function&&B.tagNameCheck(m)))return!1;if(dn&&!Ee[m]){const P=L(n)||n.parentNode,dt=I(n)||n.childNodes;if(dt&&P){const V=dt.length;for(let St=V-1;St>=0;--St){const ne=D(dt[St],!0);ne.__removalCount=(n.__removalCount||0)+1,P.insertBefore(ne,Kt(n))}}}return Gt(n),!0}return n instanceof f&&!ja(n)||(m==="noscript"||m==="noembed"||m==="noframes")&&M(/<\/no(script|embed|frames)/i,n.innerHTML)?(Gt(n),!0):(fe&&n.nodeType===De.text&&(c=n.textContent,re([le,pe,ze],P=>{c=se(c,P," ")}),n.textContent!==c&&(me(e.removed,{element:n.cloneNode()}),n.textContent=c)),ee(J.afterSanitizeElements,n,null),!1)},to=function(n,c,m){if(zn&&(c==="id"||c==="name")&&(m in r||m in Ba))return!1;if(!(sn&&!rn[c]&&M(an,c))){if(!(Bn&&M(Oa,c))){if(!at[c]||rn[c]){if(!(eo(n)&&(B.tagNameCheck instanceof RegExp&&M(B.tagNameCheck,n)||B.tagNameCheck instanceof Function&&B.tagNameCheck(n))&&(B.attributeNameCheck instanceof RegExp&&M(B.attributeNameCheck,c)||B.attributeNameCheck instanceof Function&&B.attributeNameCheck(c))||c==="is"&&B.allowCustomizedBuiltInElements&&(B.tagNameCheck instanceof RegExp&&M(B.tagNameCheck,m)||B.tagNameCheck instanceof Function&&B.tagNameCheck(m))))return!1}else if(!un[c]){if(!M(Nn,se(m,_n,""))){if(!((c==="src"||c==="xlink:href"||c==="href")&&n!=="script"&&Be(m,"data:")===0&&$n[n])){if(!(jn&&!M(Ma,se(m,_n,"")))){if(m)return!1}}}}}}return!0},eo=function(n){return n!=="annotation-xml"&&Ue(n,Ia)},no=function(n){ee(J.beforeSanitizeAttributes,n,null);const{attributes:c}=n;if(!c||fn(n))return;const m={attrName:"",attrValue:"",keepAttr:!0,allowedAttributes:at,forceKeepAttr:void 0};let P=c.length;for(;P--;){const dt=c[P],{name:V,namespaceURI:St,value:ne}=dt,_e=tt(V),gn=ne;let ut=V==="value"?gn:En(gn);if(m.attrName=_e,m.attrValue=ut,m.keepAttr=!0,m.forceKeepAttr=void 0,ee(J.uponSanitizeAttribute,n,m),ut=m.attrValue,Fn&&(_e==="id"||_e==="name")&&(Te(V,n),ut=Pa+ut),Fe&&M(/((--!?|])>)|<\/(style|title)/i,ut)){Te(V,n);continue}if(m.forceKeepAttr)continue;if(!m.keepAttr){Te(V,n);continue}if(!Hn&&M(/\/>/i,ut)){Te(V,n);continue}fe&&re([le,pe,ze],ao=>{ut=se(ut,ao," ")});const oo=tt(n.nodeName);if(!to(oo,_e,ut)){Te(V,n);continue}if(O&&typeof ct=="object"&&typeof ct.getAttributeType=="function"&&!St)switch(ct.getAttributeType(oo,_e)){case"TrustedHTML":{ut=O.createHTML(ut);break}case"TrustedScriptURL":{ut=O.createScriptURL(ut);break}}if(ut!==gn)try{St?n.setAttributeNS(St,V,ut):n.setAttribute(V,ut),fn(n)?Gt(n):ke(e.removed)}catch{Te(V,n)}}ee(J.afterSanitizeAttributes,n,null)},Ha=function h(n){let c=null;const m=Qn(n);for(ee(J.beforeSanitizeShadowDOM,n,null);c=m.nextNode();)ee(J.uponSanitizeShadowNode,c,null),qn(c),no(c),c.content instanceof l&&h(c.content);ee(J.afterSanitizeShadowDOM,n,null)};return e.sanitize=function(h){let n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},c=null,m=null,P=null,dt=null;if(mn=!h,mn&&(h="<!-->"),typeof h!="string"&&!Jn(h))if(typeof h.toString=="function"){if(h=h.toString(),typeof h!="string")throw we("dirty is not a string, aborting")}else throw we("toString is not a function");if(!e.isSupported)return h;if(ln||pn(n),e.removed=[],typeof h=="string"&&(Ie=!1),Ie){if(h.nodeName){const ne=tt(h.nodeName);if(!q[ne]||Me[ne])throw we("root node is forbidden and cannot be sanitized in-place")}}else if(h instanceof p)c=Zn("<!---->"),m=c.ownerDocument.importNode(h,!0),m.nodeType===De.element&&m.nodeName==="BODY"||m.nodeName==="HTML"?c=m:c.appendChild(m);else{if(!ge&&!fe&&!ce&&h.indexOf("<")===-1)return O&&$e?O.createHTML(h):h;if(c=Zn(h),!c)return ge?null:$e?Nt:""}c&&cn&&Gt(c.firstChild);const V=Qn(Ie?h:c);for(;P=V.nextNode();)qn(P),no(P),P.content instanceof l&&Ha(P.content);if(Ie)return h;if(ge){if(We)for(dt=bt.call(c.ownerDocument);c.firstChild;)dt.appendChild(c.firstChild);else dt=c;return(at.shadowroot||at.shadowrootmode)&&(dt=Ft.call(s,dt,!0)),dt}let St=ce?c.outerHTML:c.innerHTML;return ce&&q["!doctype"]&&c.ownerDocument&&c.ownerDocument.doctype&&c.ownerDocument.doctype.name&&M(Sn,c.ownerDocument.doctype.name)&&(St="<!DOCTYPE "+c.ownerDocument.doctype.name+`>
`+St),fe&&re([le,pe,ze],ne=>{St=se(St,ne," ")}),O&&$e?O.createHTML(St):St},e.setConfig=function(){let h=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};pn(h),ln=!0},e.clearConfig=function(){Ae=null,ln=!1},e.isValidAttribute=function(h,n,c){Ae||pn({});const m=tt(h),P=tt(n);return to(m,P,c)},e.addHook=function(h,n){typeof n=="function"&&me(J[h],n)},e.removeHook=function(h,n){if(n!==void 0){const c=Qe(J[h],n);return c===-1?void 0:vn(J[h],c,1)[0]}return ke(J[h])},e.removeHooks=function(h){J[h]=[]},e.removeAllHooks=function(){J=Ln()},e}var Oe=wn();const Ao=/main\.[A-Fa-f0-9]{8}\.min\.css$/,To=/^https:\/\/fonts\.googleapis\.com/,xo=/^https:\/\/fonts\.gstatic\.com/,bo=t=>t.nodeName==="LINK",So=t=>{const e=t?.getAttribute("href")||"",r=e.match(Ao),s=e.match(To),i=e.match(xo);return r||s||i},Co=t=>(bo(t)&&!So(t)&&t.remove(),t),Lo=t=>t.nodeName==="IFRAME",wo=(t,e)=>{const r=t.getAttribute("src")||"";try{const{host:s}=new URL(r);return e.includes(s)}catch{return!1}},Ro=t=>e=>(Lo(e)&&!wo(e,t)&&e.remove(),e),Do=()=>{const t=(0,wt.gf)(Zt.U);return(0,u.useMemo)(()=>t.getOptionalConfig("techdocs.sanitizer"),[t])},Oo=()=>{const t=Do();return(0,u.useCallback)(async e=>{const r=t?.getOptionalStringArray("allowedIframeHosts");Oe.addHook("beforeSanitizeElements",Co);const s=["link","meta"];r&&(s.push("iframe"),Oe.addHook("beforeSanitizeElements",Ro(r))),Oe.addHook("uponSanitizeElement",(d,p)=>{p.tagName==="meta"&&(d.getAttribute("http-equiv")==="refresh"&&d.getAttribute("content")?.includes("url=")||d.parentNode?.removeChild(d))}),Oe.addHook("uponSanitizeAttribute",(d,p)=>{d.tagName!=="meta"&&(p.attrName==="http-equiv"||p.attrName==="content")&&d.removeAttribute(p.attrName)});const i=t?.getOptionalString("allowedCustomElementTagNameRegExp"),l=t?.getOptionalString("allowedCustomElementAttributeNameRegExp");return Oe.sanitize(e.outerHTML,{ADD_TAGS:s,FORBID_TAGS:["style"],ADD_ATTR:["http-equiv","content","dominant-baseline"],WHOLE_DOCUMENT:!0,RETURN_DOM:!0,CUSTOM_ELEMENT_HANDLING:{tagNameCheck:i?new RegExp(i):void 0,attributeNameCheck:l?new RegExp(l):void 0}})},[t])};var Mo=o(65901),xt=o(268),Io=({theme:t})=>`
/*==================  Variables  ==================*/
/*
  As the MkDocs output is rendered in shadow DOM, the CSS variable definitions on the root selector are not applied. Instead, they have to be applied on :host.
  As there is no way to transform the served main*.css yet (for example in the backend), we have to copy from main*.css and modify them.
*/

:host {
  /* FONT */
  --md-default-fg-color: ${t.palette.text.primary};
  --md-default-fg-color--light: ${t.palette.text.secondary};
  --md-default-fg-color--lighter: ${(0,xt.a)(t.palette.text.secondary,.7)};
  --md-default-fg-color--lightest: ${(0,xt.a)(t.palette.text.secondary,.3)};

  /* BACKGROUND */
  --md-default-bg-color:${t.palette.background.default};
  --md-default-bg-color--light: ${t.palette.background.paper};
  --md-default-bg-color--lighter: ${(0,xt.a)(t.palette.background.paper,.7)};
  --md-default-bg-color--lightest: ${(0,xt.a)(t.palette.background.paper,.3)};

  /* PRIMARY */
  --md-primary-fg-color: ${t.palette.primary.main};
  --md-primary-fg-color--light: ${t.palette.primary.light};
  --md-primary-fg-color--dark: ${t.palette.primary.dark};
  --md-primary-bg-color: ${t.palette.primary.contrastText};
  --md-primary-bg-color--light: ${(0,xt.a)(t.palette.primary.contrastText,.7)};

  /* ACCENT */
  --md-accent-fg-color: var(--md-primary-fg-color);
  --md-accent-fg-color--transparent: ${(0,xt.X4)(t.palette.primary.main,.1)};
  --md-accent-bg-color: var(--md-primary-bg-color);
  --md-accent-bg-color--light: var(--md-primary-bg-color--light);

  /* SHADOW */
  --md-shadow-z1: ${t.shadows[1]};
  --md-shadow-z2: ${t.shadows[2]};
  --md-shadow-z3: ${t.shadows[3]};

  /* EXTENSIONS */
  --md-admonition-fg-color: var(--md-default-fg-color);
  --md-admonition-bg-color: var(--md-default-bg-color);
  /* Admonitions and others are using SVG masks to define icons. These masks are defined as CSS variables. */
  --md-admonition-icon--note: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83 3.75 3.75M3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25z"/></svg>');
  --md-admonition-icon--abstract: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 5h16v2H4V5m0 4h16v2H4V9m0 4h16v2H4v-2m0 4h10v2H4v-2z"/></svg>');
  --md-admonition-icon--info: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M13 9h-2V7h2m0 10h-2v-6h2m-1-9A10 10 0 002 12a10 10 0 0010 10 10 10 0 0010-10A10 10 0 0012 2z"/></svg>');
  --md-admonition-icon--tip: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.55 11.2c-.23-.3-.5-.56-.76-.82-.65-.6-1.4-1.03-2.03-1.66C13.3 7.26 13 4.85 13.91 3c-.91.23-1.75.75-2.45 1.32-2.54 2.08-3.54 5.75-2.34 8.9.04.1.08.2.08.33 0 .22-.15.42-.35.5-.22.1-.46.04-.64-.12a.83.83 0 01-.15-.17c-1.1-1.43-1.28-3.48-.53-5.12C5.89 10 5 12.3 5.14 14.47c.04.5.1 1 .27 1.5.14.6.4 1.2.72 1.73 1.04 1.73 2.87 2.97 4.84 3.22 2.1.27 4.35-.12 5.96-1.6 1.8-1.66 2.45-4.32 1.5-6.6l-.13-.26c-.2-.46-.47-.87-.8-1.25l.05-.01m-3.1 6.3c-.28.24-.73.5-1.08.6-1.1.4-2.2-.16-2.87-.82 1.19-.28 1.89-1.16 2.09-2.05.17-.8-.14-1.46-.27-2.23-.12-.74-.1-1.37.18-2.06.17.38.37.76.6 1.06.76 1 1.95 1.44 2.2 2.8.04.14.06.28.06.43.03.82-.32 1.72-.92 2.27h.01z"/></svg>');
  --md-admonition-icon--success: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2m-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>');
  --md-admonition-icon--question: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.07 11.25l-.9.92C13.45 12.89 13 13.5 13 15h-2v-.5c0-1.11.45-2.11 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41a2 2 0 00-2-2 2 2 0 00-2 2H8a4 4 0 014-4 4 4 0 014 4 3.2 3.2 0 01-.93 2.25M13 19h-2v-2h2M12 2A10 10 0 002 12a10 10 0 0010 10 10 10 0 0010-10c0-5.53-4.5-10-10-10z"/></svg>');
  --md-admonition-icon--warning: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M13 14h-2v-4h2m0 8h-2v-2h2M1 21h22L12 2 1 21z"/></svg>');
  --md-admonition-icon--failure: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2c5.53 0 10 4.47 10 10s-4.47 10-10 10S2 17.53 2 12 6.47 2 12 2m3.59 5L12 10.59 8.41 7 7 8.41 10.59 12 7 15.59 8.41 17 12 13.41 15.59 17 17 15.59 13.41 12 17 8.41 15.59 7z"/></svg>');
  --md-admonition-icon--danger: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11.5 20l4.86-9.73H13V4l-5 9.73h3.5V20M12 2c2.75 0 5.1 1 7.05 2.95C21 6.9 22 9.25 22 12s-1 5.1-2.95 7.05C17.1 21 14.75 22 12 22s-5.1-1-7.05-2.95C3 17.1 2 14.75 2 12s1-5.1 2.95-7.05C6.9 3 9.25 2 12 2z"/></svg>');
  --md-admonition-icon--bug: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M14 12h-4v-2h4m0 6h-4v-2h4m6-6h-2.81a5.985 5.985 0 00-1.82-1.96L17 4.41 15.59 3l-2.17 2.17a6.002 6.002 0 00-2.83 0L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8z"/></svg>');
  --md-admonition-icon--example: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7 13v-2h14v2H7m0 6v-2h14v2H7M7 7V5h14v2H7M3 8V5H2V4h2v4H3m-1 9v-1h3v4H2v-1h2v-.5H3v-1h1V17H2m2.25-7a.75.75 0 01.75.75c0 .2-.08.39-.21.52L3.12 13H5v1H2v-.92L4 11H2v-1h2.25z"/></svg>');
  --md-admonition-icon--quote: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M14 17h3l2-4V7h-6v6h3M6 17h3l2-4V7H5v6h3l-2 4z"/></svg>');
  --md-footnotes-icon: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 7v4H5.83l3.58-3.59L8 6l-6 6 6 6 1.41-1.42L5.83 13H21V7h-2z"/></svg>');
  --md-details-icon: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M8.59 16.58 13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.42z"/></svg>');
  --md-tasklist-icon: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>');
  --md-tasklist-icon--checked: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>');
  --md-nav-icon--prev: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 11v2H8l5.5 5.5-1.42 1.42L4.16 12l7.92-7.92L13.5 5.5 8 11h12z"/></svg>');
  --md-nav-icon--next: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M8.59 16.58 13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.42z"/></svg>');
  --md-toc-icon: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 9h14V7H3v2m0 4h14v-2H3v2m0 4h14v-2H3v2m16 0h2v-2h-2v2m0-10v2h2V7h-2m0 6h2v-2h-2v2z"/></svg>');
  --md-clipboard-icon: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12V1z"/></svg>');
  --md-search-result-icon: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h7c-.41-.25-.8-.56-1.14-.9-.33-.33-.61-.7-.86-1.1H6V4h7v5h5v1.18c.71.16 1.39.43 2 .82V8l-6-6m6.31 16.9c1.33-2.11.69-4.9-1.4-6.22-2.11-1.33-4.91-.68-6.22 1.4-1.34 2.11-.69 4.89 1.4 6.22 1.46.93 3.32.93 4.79.02L22 23.39 23.39 22l-3.08-3.1m-3.81.1a2.5 2.5 0 0 1-2.5-2.5 2.5 2.5 0 0 1 2.5-2.5 2.5 2.5 0 0 1 2.5 2.5 2.5 2.5 0 0 1-2.5 2.5z"/></svg>');
  --md-source-forks-icon: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm0 2.122a2.25 2.25 0 1 0-1.5 0v.878A2.25 2.25 0 0 0 5.75 8.5h1.5v2.128a2.251 2.251 0 1 0 1.5 0V8.5h1.5a2.25 2.25 0 0 0 2.25-2.25v-.878a2.25 2.25 0 1 0-1.5 0v.878a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 5 6.25v-.878zm3.75 7.378a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm3-8.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5z"/></svg>');
  --md-source-repositories-icon: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 1 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 0 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 0 1 1-1h8zM5 12.25v3.25a.25.25 0 0 0 .4.2l1.45-1.087a.25.25 0 0 1 .3 0L8.6 15.7a.25.25 0 0 0 .4-.2v-3.25a.25.25 0 0 0-.25-.25h-3.5a.25.25 0 0 0-.25.25z"/></svg>');
  --md-source-stars-icon: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694v.001z"/></svg>');
  --md-source-version-icon: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M2.5 7.775V2.75a.25.25 0 0 1 .25-.25h5.025a.25.25 0 0 1 .177.073l6.25 6.25a.25.25 0 0 1 0 .354l-5.025 5.025a.25.25 0 0 1-.354 0l-6.25-6.25a.25.25 0 0 1-.073-.177zm-1.5 0V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 0 1 0 2.474l-5.026 5.026a1.75 1.75 0 0 1-2.474 0l-6.25-6.25A1.75 1.75 0 0 1 1 7.775zM6 5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>');
  --md-version-icon: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--! Font Awesome Free 6.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2022 Fonticons, Inc.--><path d="m310.6 246.6-127.1 128c-7.1 6.3-15.3 9.4-23.5 9.4s-16.38-3.125-22.63-9.375l-127.1-128C.224 237.5-2.516 223.7 2.438 211.8S19.07 192 32 192h255.1c12.94 0 24.62 7.781 29.58 19.75s3.12 25.75-6.08 34.85z"/></svg>');
  
  --md-status--updated: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>cellphone-arrow-down</title><path d="M17,1H7A2,2 0 0,0 5,3V21A2,2 0 0,0 7,23H17A2,2 0 0,0 19,21V3A2,2 0 0,0 17,1M17,19H7V5H17V19M16,13H13V8H11V13H8L12,17L16,13Z" /></svg>');
  --md-status: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11 9h2V7h-2m1 13c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8m0-18A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2m-1 15h2v-6h-2v6Z"/></svg>');
  --md-status--new: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m23 12-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12m-10 5h-2v-2h2v2m0-4h-2V7h2v6Z"/></svg>');
  --md-status--deprecated: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 3v1H4v2h1v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6h1V4h-5V3H9m0 5h2v9H9V8m4 0h2v9h-2V8Z"/></svg>');
  --md-status--encrypted: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4m0 6c1.4 0 2.8 1.1 2.8 2.5V11c.6 0 1.2.6 1.2 1.3v3.5c0 .6-.6 1.2-1.3 1.2H9.2c-.6 0-1.2-.6-1.2-1.3v-3.5c0-.6.6-1.2 1.2-1.2V9.5C9.2 8.1 10.6 7 12 7m0 1.2c-.8 0-1.5.5-1.5 1.3V11h3V9.5c0-.8-.7-1.3-1.5-1.3Z"/></svg>');
}

:host > * {
  /* CODE */
  --md-code-fg-color: ${t.palette.text.primary};
  --md-code-bg-color: ${t.palette.code?.background??t.palette.background.paper};
  --md-code-hl-color: ${(0,xt.X4)(t.palette.warning.main,.5)};
  --md-code-hl-color--light: var(--md-code-hl-color);
  --md-code-hl-keyword-color: ${t.palette.type==="dark"?t.palette.primary.light:t.palette.primary.dark};
  --md-code-hl-function-color: ${t.palette.type==="dark"?t.palette.secondary.light:t.palette.secondary.dark};
  --md-code-hl-string-color: ${t.palette.type==="dark"?t.palette.success.light:t.palette.success.dark};
  --md-code-hl-number-color: ${t.palette.type==="dark"?t.palette.error.light:t.palette.error.dark};
  --md-code-hl-constant-color: var(--md-code-hl-function-color);
  --md-code-hl-special-color: var(--md-code-hl-function-color);
  --md-code-hl-name-color: var(--md-code-fg-color);
  --md-code-hl-comment-color: var(--md-default-fg-color--light);
  --md-code-hl-generic-color: var(--md-default-fg-color--light);
  --md-code-hl-variable-color: var(--md-default-fg-color--light);
  --md-code-hl-operator-color: var(--md-default-fg-color--light);
  --md-code-hl-punctuation-color: var(--md-default-fg-color--light);

  /* TYPESET */
  --md-typeset-font-size: 1rem;
  --md-typeset-color: var(--md-default-fg-color);
  --md-typeset-a-color: ${t.palette.link};
  --md-typeset-table-color: ${t.palette.text.primary};
  --md-typeset-table-color--light: ${(0,xt.X4)(t.palette.text.primary,.05)};
  --md-typeset-del-color: ${t.palette.type==="dark"?(0,xt.X4)(t.palette.error.dark,.5):(0,xt.X4)(t.palette.error.light,.5)};
  --md-typeset-ins-color: ${t.palette.type==="dark"?(0,xt.X4)(t.palette.success.dark,.5):(0,xt.X4)(t.palette.success.light,.5)};
  --md-typeset-mark-color: ${t.palette.type==="dark"?(0,xt.X4)(t.palette.warning.dark,.5):(0,xt.X4)(t.palette.warning.light,.5)};
  --md-typeset-kbd-color: var(--md-code-bg-color);
  --md-typeset-kbd-accent-color var(--md-code-bg-color);
  --md-typeset-kbd-border-color: var(--md-default-fg-color--light);
}

@media screen and (max-width: 76.1875em) {
  :host > * {
    /* TYPESET */
    --md-typeset-font-size: .9rem;
  }
}

@media screen and (max-width: 600px) {
  :host > * {
    /* TYPESET */
    --md-typeset-font-size: .7rem;
  }
}

  --md-footer-bg-color: var(--md-default-bg-color);
  --md-footer-bg-color--dark: var(--md-default-bg-color);
`,Po=({theme:t})=>`
/*==================  Reset  ==================*/

body {
  --md-text-color: var(--md-default-fg-color);
  --md-text-link-color: var(--md-accent-fg-color);
  --md-text-font-family: ${t.typography.fontFamily};
  font-family: var(--md-text-font-family);
  background-color: unset;
}
`;const _o="224px";var No=({theme:t,sidebar:e})=>`
/*==================  Layout  ==================*/

/* mkdocs material v9 compat */
.md-nav__title {
  color: var(--md-default-fg-color);
}

.md-grid {
  max-width: 100%;
  margin: 0;
}

.md-nav {
  font-size: calc(var(--md-typeset-font-size) * 0.9);
}
.md-nav__link:not(:has(svg)) {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.md-nav__link:has(svg) > .md-ellipsis {
  flex-grow: 1;
}
.md-nav__icon {
  height: 20px !important;
  width: 20px !important;
  margin-left:${t.spacing(1)}px;
}
.md-nav__icon svg {
  margin: 0;
  width: 20px !important;
  height: 20px !important;
}
.md-nav__icon:after {
  width: 20px !important;
  height: 20px !important;
}
.md-status--updated::after {
  -webkit-mask-image: var(--md-status--updated);
  mask-image: var(--md-status--updated);
}

.md-nav__item--active > .md-nav__link, a.md-nav__link--active {
  text-decoration: underline;
  color: var(--md-typeset-a-color);
}
.md-nav__link--active > .md-status:after {
  background-color: var(--md-typeset-a-color);
}
.md-nav__link[href]:hover > .md-status:after {
  background-color: var(--md-accent-fg-color);
}

.md-main__inner {
  margin-top: 0;
}

.md-sidebar {
  bottom: 75px;
  position: fixed;
  width: 16rem;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-color: rgb(193, 193, 193) #eee;
  scrollbar-width: thin;
}
.md-sidebar .md-sidebar__scrollwrap {
  width: calc(16rem);
  overflow-y: hidden;
}
@supports selector(::-webkit-scrollbar) {
  [dir=ltr] .md-sidebar__inner {
      padding-right: calc(100% - 15.1rem);
  }
}
.md-sidebar--secondary {
  right: ${t.spacing(3)}px;
}
.md-sidebar::-webkit-scrollbar {
  width: 5px;
}
.md-sidebar::-webkit-scrollbar-button {
  width: 5px;
  height: 5px;
}
.md-sidebar::-webkit-scrollbar-track {
  background: #eee;
  border: 1 px solid rgb(250, 250, 250);
  box-shadow: 0px 0px 3px #dfdfdf inset;
  border-radius: 3px;
}
.md-sidebar::-webkit-scrollbar-thumb {
  width: 5px;
  background: rgb(193, 193, 193);
  border: transparent;
  border-radius: 3px;
}
.md-sidebar::-webkit-scrollbar-thumb:hover {
  background: rgb(125, 125, 125);
}

.md-content {
  max-width: calc(100% - 16rem * 2);
  margin-left: 16rem;
  margin-bottom: 50px;
}

.md-content > .md-sidebar {
  left: 16rem;
}

.md-footer {
  position: fixed;
  bottom: 0px;
  pointer-events: none;
}

.md-footer-nav__link, .md-footer__link {
  pointer-events: all;
}

.md-footer__title {
  background-color: unset;
}
.md-footer-nav__link, .md-footer__link {
  width: 16rem;
}

.md-dialog {
  background-color: unset;
}

@media screen and (min-width: 76.25em) {
  .md-sidebar {
    height: auto;
  }
}

@media screen and (max-width: 76.1875em) {
  .md-nav {
    transition: none !important;
    background-color: var(--md-default-bg-color)
  }
  .md-nav--primary .md-nav__title {
    cursor: auto;
    color: var(--md-default-fg-color);
    font-weight: 700;
    white-space: normal;
    line-height: 1rem;
    height: auto;
    display: flex;
    flex-flow: column;
    row-gap: 1.6rem;
    padding: 1.2rem .8rem .8rem;
    background-color: var(--md-default-bg-color);
  }
  .md-nav--primary .md-nav__title~.md-nav__list {
    box-shadow: none;
  }
  .md-nav--primary .md-nav__title ~ .md-nav__list > :first-child {
    border-top: none;
  }
  .md-nav--primary .md-nav__title .md-nav__button {
    display: none;
  }
  .md-nav--primary .md-nav__title .md-nav__icon {
    color: var(--md-default-fg-color);
    position: static;
    height: auto;
    margin: 0 0 0 -0.2rem;
  }
  .md-nav--primary > .md-nav__title [for="none"] {
    padding-top: 0;
  }
  .md-nav--primary .md-nav__item {
    border-top: none;
  }
  .md-nav--primary :is(.md-nav__title,.md-nav__item) {
    font-size : var(--md-typeset-font-size);
  }
  .md-nav .md-source {
    display: none;
  }

  .md-sidebar {
    height: 100%;
  }
  .md-sidebar--primary {
    width: 16rem !important;
    z-index: 200;
    left: ${e.isPinned?`calc(-16rem + ${_o})`:"calc(-16rem + 72px)"} !important;
  }
  .md-sidebar--secondary:not([hidden]) {
    display: none;
  }

  [data-md-toggle=drawer]:checked~.md-container .md-sidebar--primary {
    transform: translateX(16rem);
  }

  .md-content {
    max-width: 100%;
    margin-left: 0;
  }

  .md-header__button {
    margin: 0.4rem 0;
    margin-left: 0.4rem;
    padding: 0;
  }

  .md-overlay {
    left: 0;
  }

  .md-footer {
    position: static;
    padding-left: 0;
  }
  .md-footer-nav__link {
    /* footer links begin to overlap at small sizes without setting width */
    width: 50%;
  }
}

@media screen and (max-width: 600px) {
  .md-sidebar--primary {
    left: -16rem !important;
    width: 16rem;
  }
}


@media print {
  .md-sidebar,
  #toggle-sidebar {
    display: none;
  }

  .md-content {
    margin: 0;
    width: 100%;
    max-width: 100%;
  }
}
`;const ko=["h1","h2","h3","h4","h5","h6"],Rn=/(em)|(rem)/gi,Dn=/var\(|\)/gi;var Uo=({theme:t})=>`
/*==================  Typeset  ==================*/

.md-typeset {
  font-size: var(--md-typeset-font-size);
}

${ko.reduce((e,r)=>{const s=t.typography.htmlFontSize??16,i=t.typography[r],{lineHeight:l,fontFamily:d,fontWeight:p,fontSize:f}=i,A=E=>{if(typeof E=="number")return A(`${E/s*.6}rem`);if(typeof E=="string"){if(E.match(Dn)){const C=window.getComputedStyle(document.body).getPropertyValue(E.replaceAll(Dn,""));if(C!=="")return A(C)}else if(E.match(Rn))return`calc(${E.replace(Rn,"")} * var(--md-typeset-font-size))`}return E};return e.concat(`
    .md-typeset ${r} {
      color: var(--md-default-fg-color);
      line-height: ${l};
      font-family: ${d};
      font-weight: ${p};
      font-size: ${A(f)};
    }
  `)},"")}

.md-typeset .md-content__button {
  color: var(--md-default-fg-color);
}

.md-typeset hr {
  border-bottom: 0.05rem dotted ${t.palette.divider};
}

.md-typeset details {
  font-size: var(--md-typeset-font-size) !important;
}
.md-typeset details summary {
  padding-left: 2.5rem !important;
}
.md-typeset details summary:before,
.md-typeset details summary:after {
  top: 50% !important;
  width: 20px !important;
  height: 20px !important;
  transform: rotate(0deg) translateY(-50%) !important;
}
.md-typeset details[open] > summary:after {
  transform: rotate(90deg) translateX(-50%) !important;
}

.md-typeset blockquote {
  color: var(--md-default-fg-color--light);
  border-left: 0.2rem solid var(--md-default-fg-color--light);
}

.md-typeset table:not([class]) {
  font-size: var(--md-typeset-font-size);
  border: 1px solid var(--md-default-fg-color);
  border-bottom: none;
  border-collapse: collapse;
  border-radius: ${t.shape.borderRadius}px;
}
.md-typeset table:not([class]) th {
  font-weight: bold;
}
.md-typeset table:not([class]) td, .md-typeset table:not([class]) th {
  border-bottom: 1px solid var(--md-default-fg-color);
}

.md-typeset pre > code::-webkit-scrollbar-thumb {
  background-color: hsla(0, 0%, 0%, 0.32);
}
.md-typeset pre > code::-webkit-scrollbar-thumb:hover {
  background-color: hsla(0, 0%, 0%, 0.87);
}

.md-typeset code {
  word-break: keep-all;
}
`,Bo=()=>`
/*==================  Animations  ==================*/
/*
  Disable CSS animations on link colors as they lead to issues in dark mode.
  The dark mode color theme is applied later and theirfore there is always an animation from light to dark mode when navigation between pages.
*/
.md-dialog, .md-nav__link, .md-footer__link, .md-typeset a, .md-typeset a::before, .md-typeset .headerlink {
  transition: none;
}
`,jo=({theme:t})=>`
/*==================  Extensions  ==================*/

/* HIGHLIGHT */
.highlight .md-clipboard:after {
  content: unset;
}

.highlight .nx {
  color: ${t.palette.type==="dark"?"#ff53a3":"#ec407a"};
}

/* CODE HILITE */
.codehilite .gd {
  background-color: ${t.palette.type==="dark"?"rgba(248,81,73,0.65)":"#fdd"};
}

.codehilite .gi {
  background-color: ${t.palette.type==="dark"?"rgba(46,160,67,0.65)":"#dfd"};
}

/* TABBED */
.tabbed-set>input:nth-child(1):checked~.tabbed-labels>:nth-child(1),
.tabbed-set>input:nth-child(2):checked~.tabbed-labels>:nth-child(2),
.tabbed-set>input:nth-child(3):checked~.tabbed-labels>:nth-child(3),
.tabbed-set>input:nth-child(4):checked~.tabbed-labels>:nth-child(4),
.tabbed-set>input:nth-child(5):checked~.tabbed-labels>:nth-child(5),
.tabbed-set>input:nth-child(6):checked~.tabbed-labels>:nth-child(6),
.tabbed-set>input:nth-child(7):checked~.tabbed-labels>:nth-child(7),
.tabbed-set>input:nth-child(8):checked~.tabbed-labels>:nth-child(8),
.tabbed-set>input:nth-child(9):checked~.tabbed-labels>:nth-child(9),
.tabbed-set>input:nth-child(10):checked~.tabbed-labels>:nth-child(10),
.tabbed-set>input:nth-child(11):checked~.tabbed-labels>:nth-child(11),
.tabbed-set>input:nth-child(12):checked~.tabbed-labels>:nth-child(12),
.tabbed-set>input:nth-child(13):checked~.tabbed-labels>:nth-child(13),
.tabbed-set>input:nth-child(14):checked~.tabbed-labels>:nth-child(14),
.tabbed-set>input:nth-child(15):checked~.tabbed-labels>:nth-child(15),
.tabbed-set>input:nth-child(16):checked~.tabbed-labels>:nth-child(16),
.tabbed-set>input:nth-child(17):checked~.tabbed-labels>:nth-child(17),
.tabbed-set>input:nth-child(18):checked~.tabbed-labels>:nth-child(18),
.tabbed-set>input:nth-child(19):checked~.tabbed-labels>:nth-child(19),
.tabbed-set>input:nth-child(20):checked~.tabbed-labels>:nth-child(20) {
  color: var(--md-accent-fg-color);
  border-color: var(--md-accent-fg-color);
}

/* TASK-LIST */
.task-list-control .task-list-indicator::before {
  background-color: ${t.palette.action.disabledBackground};
}
.task-list-control [type="checkbox"]:checked + .task-list-indicator:before {
 background-color: ${t.palette.success.main};
}

/* ADMONITION */
.admonition {
  font-size: var(--md-typeset-font-size) !important;
}
.admonition .admonition-title {
  padding-left: 2.5rem !important;
}

.admonition .admonition-title:before {
  top: 50% !important;
  width: 20px !important;
  height: 20px !important;
  transform: translateY(-50%) !important;
}
`;const Ho={dark:["#only-light","#gh-light-mode-only"],light:["#only-dark","#gh-dark-mode-only"]};var zo=({theme:t})=>`
/*==================  Palette  ==================*/
/*
  When color palette toggle is enabled in material theme for Mkdocs, there is a possibility to show conditionally 
  images by adding #only-dark or #only-light to resource hash. Backstage doesn't use mkdocs color palette mechanism,
  so there is a need to add css rules from palette*.css manually.
*/

${Ho[t.palette.type].map(e=>`img[src$="${e}"]`).join(", ")} {
  display: none;
}
`;const Fo=[Io,Po,No,Uo,Bo,jo,zo],Wo=()=>(0,Mo.Ut)(),$o=()=>{const t=Wo(),e=(0,Dt.A)();return(0,u.useMemo)(()=>{const r={theme:e,sidebar:t};return Fo.reduce((s,i)=>s+i(r),"")},[e,t])},Vo=()=>{const t=$o();return(0,u.useCallback)(e=>(e.getElementsByTagName("head")[0].insertAdjacentHTML("beforeend",`<style>${t}</style>`),e),[t])},Ko=(t,e,r)=>{const s=new URL(e,"https://ignored.com").pathname,i=t==="src"&&s.endsWith(".svg"),l=!e.match(/^([a-z]*:)?\/\//i),d=e.startsWith(r);return i&&(l||d)},Go=({techdocsStorageApi:t,entityId:e,path:r})=>async s=>{const i=await t.getApiOrigin(),l=async(d,p)=>{for(const f of d)if(f.hasAttribute(p)){const A=f.getAttribute(p);if(!A)return;const E=await t.getBaseUrl(A,e,r);if(Ko(p,A,i))try{const ot=await(await fetch(E,{credentials:"include"})).text();f.setAttribute(p,`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(ot)))}`)}catch{f.setAttribute("alt",`Error: ${A}`)}else f.setAttribute(p,E)}};return await Promise.all([l(s.querySelectorAll("img"),"src"),l(s.querySelectorAll("script"),"src"),l(s.querySelectorAll("source"),"src"),l(s.querySelectorAll("link"),"href"),l(s.querySelectorAll("a[download]"),"href")]),s};var Yo=o(78264),Xo=o(90292),Zo=o(52536),Qo=o.n(Zo);let On;On=Promise.resolve().then(o.t.bind(o,25873,19));function He(t,e){On.then(r=>{"createRoot"in r?r.createRoot(e).render(t):r.render(t,e)})}const Jo=t=>e=>{const r=e.querySelector('[title="Edit this page"]');if(!r||!r.href)return e;const s=new URL(r.href),i=t.byUrl(s);if(i?.type!=="github"&&i?.type!=="gitlab")return e;const l=e.querySelector("article>h1")?.childNodes[0].textContent||"",d=encodeURIComponent(`Documentation Feedback: ${l}`),p=encodeURIComponent(`Page source:
${r.href}

Feedback:`),f=i?.type==="github"?(0,Yo.F)(s.href,"blob"):s.href,A=Qo()(f),E=`/${A.organization}/${A.name}`,C=r.cloneNode();switch(i?.type){case"gitlab":C.href=`${s.origin}${E}/issues/new?issue[title]=${d}&issue[description]=${p}`;break;case"github":C.href=`${s.origin}${E}/issues/new?title=${d}&body=${p}`;break;default:return e}return He((0,u.createElement)(Xo.A),C),C.style.paddingLeft="5px",C.title="Leave feedback for this page",C.id="git-feedback-link",r?.insertAdjacentElement("beforebegin",C),e};var qo=o(27326);const ta=()=>t=>{const e=t.querySelector('.md-header label[for="__drawer"]'),r=t.querySelector("article");if(!e||!r)return t;const s=e.cloneNode();return He((0,u.createElement)(qo.A),s),s.id="toggle-sidebar",s.title="Toggle Sidebar",s.classList.add("md-content__button"),s.style.setProperty("padding","0 0 0 5px"),s.style.setProperty("margin","0.4rem 0 0.4rem 0.4rem"),r?.prepend(s),t},ea=()=>t=>(((r,s)=>{Array.from(r).filter(i=>i.hasAttribute(s)).forEach(i=>{const l=i.getAttribute(s);if(l){l.match(/^https?:\/\//i)&&i.setAttribute("target","_blank");try{const d=Mn(window.location.href);i.setAttribute(s,new URL(l,d).toString())}catch{i.replaceWith(i.textContent||l)}}})})(Array.from(t.getElementsByTagName("a")),"href"),t);function Mn(t){const e=new URL(t);return!e.pathname.endsWith("/")&&!e.pathname.endsWith(".html")&&(e.pathname+="/"),e.toString()}const na=({baseUrl:t,onClick:e})=>r=>(Array.from(r.getElementsByTagName("a")).forEach(s=>{s.addEventListener("click",i=>{const d=s.getAttribute("href");d&&d.startsWith(t)&&!s.hasAttribute("download")&&(i.preventDefault(),e(i,d))})}),r);var oa=o(7031),aa=o(50868),ra=o(10437),sa=o(71677),ia=o(36338);const la=(0,oa.A)(t=>({tooltip:{fontSize:"inherit",color:t.palette.text.primary,margin:0,padding:t.spacing(.5),backgroundColor:"transparent",boxShadow:"none"}}))(sa.Ay),ca=()=>(0,a.jsx)(ra.A,{children:(0,a.jsx)("path",{d:"M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"})}),da=({text:t})=>{const[e,r]=(0,u.useState)(!1),[,s]=(0,ia.A)(),i=(0,u.useCallback)(()=>{s(t),r(!0)},[t,s]),l=(0,u.useCallback)(()=>{r(!1)},[r]);return(0,a.jsx)(la,{title:"Copied to clipboard",placement:"left",open:e,onClose:l,leaveDelay:1e3,children:(0,a.jsx)(At.A,{style:{position:"absolute"},className:"md-clipboard md-icon",onClick:i,"aria-label":"Copy to clipboard",children:(0,a.jsx)(ca,{})})})},ua=t=>e=>{const r=e.querySelectorAll("pre > code");for(const s of r){const i=s.textContent||"",l=document.createElement("div");s?.parentElement?.prepend(l),He((0,a.jsx)(aa.A,{theme:t,children:(0,a.jsx)(da,{text:i})}),l)}return e},ma=()=>t=>(t.querySelector(".md-header")?.remove(),t),ha=()=>t=>(t.querySelector(".md-footer .md-copyright")?.remove(),t.querySelector(".md-footer-copyright")?.remove(),t),In=({onLoading:t,onLoaded:e})=>r=>(t(),r.addEventListener(k,function s(){e(),r.removeEventListener(k,s)}),r),pa=()=>t=>(setTimeout(()=>{const e=t?.querySelectorAll("li.md-nav__item--active");e.length!==0&&(e.forEach(s=>{const i=s?.querySelector("input");i?.checked||i?.click()}),e[e.length-1].scrollIntoView())},200),t),Pn=async(t,e)=>{let r;if(typeof t=="string")r=new DOMParser().parseFromString(t,"text/html").documentElement;else if(t instanceof Element)r=t;else throw new Error("dom is not a recognized type");for(const s of e)r=await s(r);return r};var fa=o(38097);const ga=(0,y.A)(t=>({button:{color:t.palette.primary.light,textDecoration:"underline"}})),va=({message:t,handleButtonClick:e,autoHideDuration:r})=>{const s=ga(),[i,l]=(0,u.useState)(!0),d=()=>l(!1);return(0,a.jsx)(fa.A,{open:i,anchorOrigin:{vertical:"top",horizontal:"right"},autoHideDuration:r,color:"primary",onClose:d,message:t,action:(0,a.jsx)(Bt.A,{classes:{root:s.button},size:"small",onClick:()=>{d(),e()},children:"Redirect now"})})},Ea=(t,e)=>{const s=i=>{const l=Mn(window.location.href),d=new URL(i,l);if(d.hostname!==window.location.hostname){const f=window.location.pathname,A=f.indexOf(e),E=f.slice(0,A+e.length);return new URL(E,l).href}return d.href};return i=>{for(const l of Array.from(i.querySelectorAll("meta")))if(l.getAttribute("http-equiv")==="refresh"){const d=l.getAttribute("content")?.split("url=");if(!d||d.length<2)return i;const p=d[1],f=s(p);if(window.location.href===f)return i;const A=document.createElement("div");return He((0,a.jsx)(va,{message:"This TechDocs page is no longer maintained. Will automatically redirect to the designated replacement.",handleButtonClick:()=>t(f),autoHideDuration:3e3}),A),document.body.appendChild(A),setTimeout(()=>{t(f)},3e3),i}return i}};function ya(){return t=>(t.querySelectorAll("label.md-nav__link[for]").forEach(r=>{r.setAttribute("tabIndex","0"),r.addEventListener("keydown",s=>{const i=s;if(i.key==="Enter"||i.key===" "){const l=r.getAttribute("for");if(!l)return;const d=t.querySelector(`#${l}`);d&&d.type==="checkbox"&&(d.checked=!d.checked,d.dispatchEvent(new Event("change",{bubbles:!0})),s.preventDefault(),s.stopPropagation())}})}),t)}function Aa(t,e){const r=new URL(e),s=`${r.origin}${r.pathname.replace(/\/$/,"")}`,i=t.replace(s,"").replace(/^\/+/,""),l=new URL(`http://localhost/${i}`);return`${l.pathname}${l.search}${l.hash}`}function Ta(){const t=(0,u.useRef)((0,g.Zp)()),r=(0,wt.gf)(Zt.U).getOptionalString("app.baseUrl");return(0,u.useCallback)(i=>{let l=i;if(r)try{l=Aa(i,r)}catch{}t.current(l)},[r])}const xa="screen and (max-width: 76.1875em)",ba=t=>{const e=(0,g.zy)(),r=(0,g.Zp)(),{"*":s=""}=(0,g.g)();(0,u.useLayoutEffect)(()=>{s===""&&t&&r(`${e.pathname}${t}`,{replace:!0})},[])},Sa=(t,e)=>{const r=Ta(),s=(0,Dt.A)(),i=(0,_t.A)(xa),l=Oo(),d=Vo(),p=(0,Qt.s)(),f=(0,wt.gf)(lt.s),A=(0,wt.gf)(Ht.Y),E=(0,wt.gf)(Zt.U),{state:C,path:ot,content:ct}=pt(),{"*":Z=""}=(0,g.g)(),[D,zt]=(0,u.useState)(null),Kt=T(D);ba(e);const I=(0,u.useCallback)(()=>{if(!D)return;D.querySelectorAll(".md-sidebar").forEach(Q=>{if(i)Q.style.top="0px";else{const ie=document?.querySelector(".techdocs-reader-page")?.getBoundingClientRect().top??0;let Ft=D.getBoundingClientRect().top??0;const le=D.querySelector(".md-container > .md-tabs")?.getBoundingClientRect().height??0;Ft<ie&&(Ft=ie);const pe=Math.max(Ft,0)+le;Q.style.top=`${pe}px`;const an=D.querySelector(".md-container > .md-footer")?.getBoundingClientRect().top??window.innerHeight;Q.style.height=`${an-pe}px`}Q.style.setProperty("opacity","1")})},[D,i]);(0,u.useEffect)(()=>(window.addEventListener("resize",I),window.addEventListener("scroll",I,!0),()=>{window.removeEventListener("resize",I),window.removeEventListener("scroll",I,!0)}),[D,I]);const L=(0,u.useCallback)(()=>{if(!D)return;const U=D.querySelector(".md-footer");U&&(U.style.width=`${D.getBoundingClientRect().width}px`)},[D]);(0,u.useEffect)(()=>(window.addEventListener("resize",L),()=>{window.removeEventListener("resize",L)}),[D,L]),(0,u.useEffect)(()=>{Kt||(L(),I())},[C,Kt,L,I]);const O=(0,u.useCallback)((U,Q)=>Pn(U,[l,Go({techdocsStorageApi:f,entityId:t,path:Q}),ea(),ta(),ma(),ha(),Jo(A),d]),[t,A,f,l,d]),Nt=(0,u.useCallback)(async U=>Pn(U,[Ea(r,t.name),pa(),ua(s),na({baseUrl:E.getOptionalString("app.baseUrl")||window.location.origin,onClick:(Q,bt)=>{const ie=Q.ctrlKey||Q.metaKey,Ft=new URL(bt),J=Q.target?.innerText||bt,le=bt.replace(window.location.origin,"");p.captureEvent("click",J,{attributes:{to:le}}),Ft.hash?ie?window.open(bt,"_blank"):(window.location.pathname!==Ft.pathname?r(bt):window.history.pushState(null,document.title,Ft.hash),U?.querySelector(`[id="${Ft.hash.slice(1)}"]`)?.scrollIntoView(),U?.querySelector(`[id="${Ft.hash.slice(1)}"]`)?.querySelector("a, button, [tabindex]")?.focus()):ie?window.open(bt,"_blank"):r(bt)}}),In({onLoading:()=>{},onLoaded:()=>{U.querySelector(".md-nav__title")?.removeAttribute("for")}}),In({onLoading:()=>{Array.from(U.querySelectorAll(".md-sidebar")).forEach(bt=>{bt.style.setProperty("opacity","0")})},onLoaded:()=>{}}),ya()]),[s,r,p,t.name,E]);return(0,u.useEffect)(()=>{if(!ct)return()=>{};let U=!0;return O(ct,ot).then(async Q=>{if(!Q?.innerHTML||!U||Z!==ot)return;window.scroll({top:0});const bt=await Nt(Q);zt(bt)}),()=>{U=!1}},[ct,Z,ot,O,Nt]),D};var nn=o(41883),Ca=o(11618),on=o(15246);const La=()=>{const t=(0,Ca.YR)(),{shadowRoot:e}=(0,N.V)(),r=e?.querySelector('[data-md-component="content"]'),s=e?.querySelector('div[data-md-component="sidebar"][data-md-type="navigation"], div[data-md-component="navigation"]');let i=s?.querySelector('[data-techdocs-addons-location="primary sidebar"]');i||(i=document.createElement("div"),i.setAttribute("data-techdocs-addons-location","primary sidebar"),s?.prepend(i));const l=e?.querySelector('div[data-md-component="sidebar"][data-md-type="toc"], div[data-md-component="toc"]');let d=l?.querySelector('[data-techdocs-addons-location="secondary sidebar"]');return d||(d=document.createElement("div"),d.setAttribute("data-techdocs-addons-location","secondary sidebar"),l?.prepend(d)),(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(nn.A,{container:i,children:t.renderComponentsByLocation(on.e.PrimarySidebar)}),(0,a.jsx)(nn.A,{container:r,children:t.renderComponentsByLocation(on.e.Content)}),(0,a.jsx)(nn.A,{container:d,children:t.renderComponentsByLocation(on.e.SecondarySidebar)})]})};var wa=o(95208);const Ra=(0,y.A)({search:{width:"100%","@media (min-width: 76.1875em)":{width:"calc(100% - 34.4rem)",margin:"0 auto"},"@media print":{display:"none"}}}),Da=Jt(t=>{const{withSearch:e=!0,searchResultUrlMapper:r,onReady:s}=t,i=Ra(),{entityMetadata:{value:l,loading:d},entityRef:p,setShadowRoot:f}=(0,N.V)(),{state:A}=pt(),E=Sa(p,t.defaultPath),C=window.location.pathname,ot=window.location.hash,ct=T(E),[Z]=(0,$.$r)([`[id="${ot.slice(1)}"]`]),D=(0,wa.n)(),{NotFoundErrorPage:zt}=D.getComponents();(0,u.useEffect)(()=>{ct||(ot?Z&&Z.scrollIntoView():document?.querySelector("header")?.scrollIntoView())},[C,ot,Z,ct]);const Kt=(0,u.useCallback)(I=>{f(I),s instanceof Function&&s()},[f,s]);return d===!1&&!l?(0,a.jsx)(zt,{}):E?(0,a.jsx)(G.U,{children:(0,a.jsxs)(w.A,{container:!0,children:[(0,a.jsx)(w.A,{xs:12,item:!0,children:(0,a.jsx)(R,{})}),e&&(0,a.jsx)(w.A,{className:i.search,xs:"auto",item:!0,children:(0,a.jsx)(ht,{entityId:p,entityTitle:l?.metadata?.title,searchResultUrlMapper:r})}),(0,a.jsxs)(w.A,{xs:12,item:!0,children:[(A==="CHECKING"||ct)&&(0,a.jsx)(Ct.k,{}),(0,a.jsx)(x,{element:E,onAppend:Kt,children:(0,a.jsx)(La,{})})]})]})}):(0,a.jsx)(G.U,{children:(0,a.jsx)(w.A,{container:!0,children:(0,a.jsx)(w.A,{xs:12,item:!0,children:(0,a.jsx)(R,{})})})})}),za=null},84893:(kt,_,o)=>{"use strict";o.d(_,{Z:()=>G});var a=o(31085),u=o(14041),w=o(58837),y=o(29365),N=o(75173),W=o(71677),j=o(37757),K=o(77125),k=o(9684),yt=o(11618),T=o(83380),x=o(15246);const $=(0,w.A)(Ct=>({root:{gridArea:"pageSubheader",flexDirection:"column",minHeight:"auto",padding:Ct.spacing(3,3,0),"@media print":{display:"none"}}})),G=Ct=>{const rt=$(),[Y,mt]=(0,u.useState)(null),st=(0,u.useCallback)(X=>{mt(X.currentTarget)},[]),et=(0,u.useCallback)(()=>{mt(null)},[]),{entityMetadata:{value:b,loading:S}}=(0,T.V)(),H=(0,yt.YR)(),g=H.renderComponentsByLocation(x.e.Subheader),it=H.renderComponentsByLocation(x.e.Settings);return!g&&!it||S===!1&&!b?null:(0,a.jsx)(N.A,{classes:rt,...Ct.toolbarProps,children:(0,a.jsxs)(K.A,{display:"flex",justifyContent:"flex-end",width:"100%",flexWrap:"wrap",children:[g,it?(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(W.Ay,{title:"Settings",children:(0,a.jsx)(y.A,{"aria-controls":"tech-docs-reader-page-settings","aria-haspopup":"true",onClick:st,children:(0,a.jsx)(k.A,{})})}),(0,a.jsx)(j.A,{id:"tech-docs-reader-page-settings",getContentAnchorEl:null,anchorEl:Y,anchorOrigin:{vertical:"bottom",horizontal:"right"},open:!!Y,onClose:et,keepMounted:!0,children:(0,a.jsx)("div",{children:it})})]}):null]})})}},87437:(kt,_,o)=>{"use strict";o.d(_,{Lt:()=>et,SQ:()=>Ct});var a=o(31085),u=o(45250),w=o.n(u),y=o(14041),N=o(73466),W=o(5877),j=o(54852),K=o(4790),k=o(19224),yt=o(52262),T=o(18139),x=o(54195),$=o(20570);const G=(0,j.tK)("search-context"),Ct=()=>{const b=(0,y.useContext)(G);if(!b)throw new Error("useSearch must be used within a SearchContextProvider");const S=b.atVersion(1);if(!S)throw new Error("No SearchContext v1 found");return S},rt=()=>(0,y.useContext)(G)!==void 0,Y={term:"",types:[],filters:{},pageLimit:void 0,pageCursor:void 0},mt=(b=Y)=>{const S=(0,T.gf)($.y),H=(0,yt.s)(),[g,it]=(0,y.useState)(b.term),[X,Ut]=(0,y.useState)(b.types),[ht,Bt]=(0,y.useState)(b.filters),[Lt,oe]=(0,y.useState)(b.pageLimit),[Yt,At]=(0,y.useState)(b.pageCursor),Xt=(0,W.A)(g),Mt=(0,W.A)(ht),z=(0,N.A)(async()=>{const Qt=await S.query({term:g,types:X,filters:ht,pageLimit:Lt,pageCursor:Yt});return g&&H.captureEvent("search",g,{value:Qt.numberOfResults}),Qt},[g,X,ht,Lt,Yt]),jt=!z.loading&&!z.error&&z.value?.nextPageCursor,Wt=!z.loading&&!z.error&&z.value?.previousPageCursor,$t=(0,y.useCallback)(()=>{At(z.value?.nextPageCursor)},[z.value?.nextPageCursor]),wt=(0,y.useCallback)(()=>{At(z.value?.previousPageCursor)},[z.value?.previousPageCursor]);return(0,y.useEffect)(()=>{Xt!==void 0&&g!==Xt&&At(void 0)},[g,Xt,At]),(0,y.useEffect)(()=>{Mt!==void 0&&!(0,u.isEqual)(ht,Mt)&&At(void 0)},[ht,Mt,At]),{result:z,term:g,setTerm:it,types:X,setTypes:Ut,filters:ht,setFilters:Bt,pageLimit:Lt,setPageLimit:oe,pageCursor:Yt,setPageCursor:At,fetchNextPage:jt?$t:void 0,fetchPreviousPage:Wt?wt:void 0}},st=b=>{const{initialState:S,children:H}=b,g=mt(S);return(0,a.jsx)(k.I,{attributes:{searchTypes:g.types.sort().join(",")},children:(0,a.jsx)(G.Provider,{value:(0,K.B)({1:g}),children:H})})},et=b=>{const{initialState:S,inheritParentContextIfAvailable:H,children:g}=b,it=rt(),X=(0,T.gf)(x.U),Ut=S??{},ht=X.has("search.query.pageLimit")?{pageLimit:X.getNumber("search.query.pageLimit")}:{},Bt={...Y,...Ut,...ht};return it&&H?(0,a.jsx)(a.Fragment,{children:g}):(0,a.jsx)(st,{initialState:Bt,children:g})}},90292:(kt,_,o)=>{"use strict";var a,u=o(4293),w=o(78920);a={value:!0},_.A=void 0;var y=w(o(14041)),N=u(o(74044)),W=(0,N.default)(y.createElement("path",{d:"M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17l-.59.59-.58.58V4h16v12zm-9-4h2v2h-2zm0-6h2v4h-2z"}),"FeedbackOutlined");_.A=W},91042:(kt,_,o)=>{"use strict";o.d(_,{Y:()=>w});var a=o(14041),u=o(16261);function w(y,N){const[W,j]=(0,a.useState)({status:"not-executed",error:void 0,result:N}),K=(0,a.useRef)(),k=(0,a.useRef)(),yt=(0,u.J)({execute(...T){k.current=T;const x=y(...T);return K.current=x,j($=>({...$,status:"loading"})),x.then($=>{x===K.current&&j(G=>({...G,status:"success",error:void 0,result:$}))},$=>{x===K.current&&j(G=>({...G,status:"error",error:$}))}),x},reset(){j({status:"not-executed",error:void 0,result:N}),K.current=void 0,k.current=void 0}});return[W,(0,a.useMemo)(()=>({reset(){yt.current.reset()},execute:(...T)=>yt.current.execute(...T)}),[]),{promise:K.current,lastArgs:k.current}]}},92469:(kt,_,o)=>{"use strict";o.d(_,{_:()=>u});var a=o(97963);const u=(0,a.h)({id:"search-react",messages:{searchBar:{title:"Search",placeholder:"Search in {{org}}",clearButtonTitle:"Clear"},searchFilter:{allOptionTitle:"All"},searchPagination:{limitLabel:"Results per page:",limitText:"of {{num}}"},noResultsDescription:"Sorry, no results were found",searchResultGroup:{linkTitle:"See All",addFilterButtonTitle:"Add filter"},searchResultPager:{previous:"Previous",next:"Next"}}})}}]);})();

//# sourceMappingURL=3402.1d6033da.chunk.js.map