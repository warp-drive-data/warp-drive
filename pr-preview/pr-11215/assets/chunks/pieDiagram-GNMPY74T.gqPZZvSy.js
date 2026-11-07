import{t as e}from"./chunk-JWPE2WC7.A3RzWITa.js";import{b as t}from"../app.Dm7Wjwmb.js";import{i as n,m as r}from"./chunk-7S6XSTFO.CGb6lb67.js";import{t as i}from"./ordinal.BAxfPAgN.js";import{C as a,H as o,U as s,_ as c,a as l,b as u,c as d,f,q as p,v as m}from"./chunk-DSNLSHJZ.DJCE4OGi.js";import{m as h}from"./src.Duoub3vK.js";import{t as g}from"./arc.cxkLdl1s.js";import{n as _}from"./chunk-Y2CYZVJY.DsF7k-Jl.js";import{n as v}from"./mermaid-parser.core.BTr63xp-.js";import{t as y}from"./array.BifhSqXX.js";import{n as b}from"./path.fybaL0A-.js";import{m as x}from"./dist.B-59DSOZ.js";function S(e,t){return t<e?-1:t>e?1:t>=e?0:NaN}function C(e){return e}function w(){var e=C,t=S,n=null,r=b(0),i=b(x),a=b(0);function o(o){var s,c=(o=y(o)).length,l,u,d=0,f=Array(c),p=Array(c),m=+r.apply(this,arguments),h=Math.min(x,Math.max(-x,i.apply(this,arguments)-m)),g,_=Math.min(Math.abs(h)/c,a.apply(this,arguments)),v=_*(h<0?-1:1),b;for(s=0;s<c;++s)(b=p[f[s]=s]=+e(o[s],s,o))>0&&(d+=b);for(t==null?n!=null&&f.sort(function(e,t){return n(o[e],o[t])}):f.sort(function(e,n){return t(p[e],p[n])}),s=0,u=d?(h-c*v)/d:0;s<c;++s,m=g)l=f[s],b=p[l],g=m+(b>0?b*u:0)+v,p[l]={data:o[l],index:s,value:b,startAngle:m,endAngle:g,padAngle:_};return p}return o.value=function(t){return arguments.length?(e=typeof t==`function`?t:b(+t),o):e},o.sortValues=function(e){return arguments.length?(t=e,n=null,o):t},o.sort=function(e){return arguments.length?(n=e,t=null,o):n},o.startAngle=function(e){return arguments.length?(r=typeof e==`function`?e:b(+e),o):r},o.endAngle=function(e){return arguments.length?(i=typeof e==`function`?e:b(+e),o):i},o.padAngle=function(e){return arguments.length?(a=typeof e==`function`?e:b(+e),o):a},o}var T=f.pie,E={sections:new Map,showData:!1,config:T},D=E.sections,O=E.showData,k=structuredClone(T),A={getConfig:_(()=>structuredClone(k),`getConfig`),clear:_(()=>{D=new Map,O=E.showData,l()},`clear`),setDiagramTitle:p,getDiagramTitle:a,setAccTitle:s,getAccTitle:m,setAccDescription:o,getAccDescription:c,addSection:_(({label:e,value:t})=>{if(t<0)throw Error(`"${e}" has invalid value: ${t}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);D.has(e)||(D.set(e,t),h.debug(`added new section: ${e}, with value: ${t}`))},`addSection`),getSections:_(()=>D,`getSections`),setShowData:_(e=>{O=e},`setShowData`),getShowData:_(()=>O,`getShowData`)},j=_((t,n)=>{e(t,n),n.setShowData(t.showData),t.sections.map(n.addSection)},`populateDb`),M={parse:_(async e=>{let t=await v(`pie`,e);h.debug(t),j(t,A)},`parse`)},N=_(e=>`
  .pieCircle{
    stroke: ${e.pieStrokeColor};
    stroke-width : ${e.pieStrokeWidth};
    opacity : ${e.pieOpacity};
  }
  .pieCircle.highlighted{
    scale: 1.05;
    opacity: 1;
  }
  .pieCircle.highlightedOnHover:hover{
    transition-duration: 250ms;
    scale: 1.05;
    opacity: 1;
  }
  .pieOuterCircle{
    stroke: ${e.pieOuterStrokeColor};
    stroke-width: ${e.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${e.pieTitleTextSize};
    fill: ${e.pieTitleTextColor};
    font-family: ${e.fontFamily};
  }
  .slice {
    font-family: ${e.fontFamily};
    fill: ${e.pieSectionTextColor};
    font-size:${e.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${e.pieLegendTextColor};
    font-family: ${e.fontFamily};
    font-size: ${e.pieLegendTextSize};
  }
`,`getStyles`),P=_(e=>{let t=[...e.values()].reduce((e,t)=>e+t,0),n=[...e.entries()].map(([e,t])=>({label:e,value:t})).filter(e=>e.value/t*100>=1);return w().value(e=>e.value).sort(null)(n)},`createPieArcs`),F={parser:M,db:A,renderer:{draw:_((e,a,o,s)=>{h.debug(`rendering pie chart
`+e);let c=s.db,l=u(),f=n(c.getConfig(),l.pie),p=t(a),m=p.append(`g`);m.attr(`transform`,`translate(225,225)`);let{themeVariables:_}=l,[v]=r(_.pieOuterStrokeWidth);v??=2;let y=f.legendPosition,b=f.textPosition,x=f.donutHole>0&&f.donutHole<=.9?f.donutHole:0,S=g().innerRadius(x*185).outerRadius(185),C=g().innerRadius(185*b).outerRadius(185*b),w=m.append(`g`);w.append(`circle`).attr(`cx`,0).attr(`cy`,0).attr(`r`,185+v/2).attr(`class`,`pieOuterCircle`);let T=c.getSections(),E=P(T),D=[_.pie1,_.pie2,_.pie3,_.pie4,_.pie5,_.pie6,_.pie7,_.pie8,_.pie9,_.pie10,_.pie11,_.pie12],O=0;T.forEach(e=>{O+=e});let k=E.filter(e=>(e.data.value/O*100).toFixed(0)!==`0`),A=i(D).domain([...T.keys()]);w.selectAll(`mySlices`).data(k).enter().append(`path`).attr(`d`,S).attr(`fill`,e=>A(e.data.label)).attr(`class`,e=>{let t=`pieCircle`;return f.highlightSlice===`hover`?t+=` highlightedOnHover`:f.highlightSlice===e.data.label&&(t+=` highlighted`),t}),w.selectAll(`mySlices`).data(k).enter().append(`text`).text(e=>(e.data.value/O*100).toFixed(0)+`%`).attr(`transform`,e=>`translate(`+C.centroid(e)+`)`).style(`text-anchor`,`middle`).attr(`class`,`slice`);let j=m.append(`text`).text(c.getDiagramTitle()).attr(`x`,0).attr(`y`,-200).attr(`class`,`pieTitleText`),M=[...T.entries()].map(([e,t])=>({label:e,value:t})),N=m.selectAll(`.legend`).data(M).enter().append(`g`).attr(`class`,`legend`);N.append(`rect`).attr(`width`,18).attr(`height`,18).style(`fill`,e=>A(e.label)).style(`stroke`,e=>A(e.label)),N.append(`text`).attr(`x`,22).attr(`y`,14).text(e=>c.getShowData()?`${e.label} [${e.value}]`:e.label);let F=Math.max(...N.selectAll(`text`).nodes().map(e=>e?.getBoundingClientRect().width??0)),I=450,L=490,R=M.length*22;switch(y){case`center`:N.attr(`transform`,(e,t)=>{let n=22*M.length/2,r=-F/2-22,i=t*22-n;return`translate(`+r+`,`+i+`)`});break;case`top`:I+=R,N.attr(`transform`,(e,t)=>`translate(${-F/2-22}, ${t*22-185})`),w.attr(`transform`,()=>`translate(0, ${R+22})`);break;case`bottom`:I+=R,N.attr(`transform`,(e,t)=>{let n=-F/2-22,r=t*22- -207;return`translate(`+n+`,`+r+`)`});break;case`left`:L+=22+F,N.attr(`transform`,(e,t)=>{let n=22*M.length/2;return`translate(-207,`+(t*22-n)+`)`}),w.attr(`transform`,()=>`translate(${F+18+4}, 0)`);break;default:L+=22+F,N.attr(`transform`,(e,t)=>{let n=22*M.length/2;return`translate(216,`+(t*22-n)+`)`})}let z=j.node()?.getBoundingClientRect().width??0,B=225-z/2,V=225+z/2,H=Math.min(0,B),U=Math.max(L,V)-H;p.attr(`viewBox`,`${H} 0 ${U} ${I}`),d(p,I,U,f.useMaxWidth)},`draw`)},styles:N};export{F as diagram};