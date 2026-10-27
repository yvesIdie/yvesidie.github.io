// Original 16-bit-inspired fighters and environment. All art stays local.
export const CHARACTERS={
  ray:{name:'ЮКИО',title:'ХРАНИТЕЛЬ ЗИМЫ',color:'#b4e5ee',move:'Ледяной клинок',fatality:'Вечная зима',description:'Стремительный взмах катаны и ледяной полумесяц. Финал — кристальная буря.'},
  kai:{name:'РЮ',title:'СЕРДЦЕ ДРАКОНА',color:'#f1b18e',move:'Огненная вертушка',fatality:'Пробуждение дракона',description:'Прыжок и огненный удар ногой. Финал — восходящий удар с огненным драконом.'},
  nox:{name:'ХАРУКИ',title:'ЛОВЕЦ ЗВЁЗД',color:'#c8b6ef',move:'Неоновый импульс',fatality:'Звёздный предел',description:'Заряд в киберруке и плазменная волна. Финал — орбитальный луч из звёздной сферы.'},
};
const palettes={
  ray:{skin:'#e5b79b',shade:'#ac7968',light:'#f9d9bd',hair:'#293c54',dark:'#25354b',cloth:'#547d93',mid:'#88b1bf',hi:'#cbe2df',accent:'#d6f2f0',glove:'#3c5871',boot:'#2b3e51'},
  kai:{skin:'#e3a47c',shade:'#a45d47',light:'#ffd09d',hair:'#683947',dark:'#302938',cloth:'#aa5846',mid:'#dd8661',hi:'#f7b87c',accent:'#f2d19b',glove:'#e3d4b5',boot:'#473643'},
  nox:{skin:'#adc2cb',shade:'#657a96',light:'#dce4dc',hair:'#d0d9db',dark:'#26243e',cloth:'#514e7c',mid:'#8577ad',hi:'#c4b2d7',accent:'#cba2ff',glove:'#5c6581',boot:'#282e49'},
};
function box(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.closePath();c.fill();}
function limb(c,a,b,width,color,shade,outline='#192529'){
  const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
  const shape=w=>[[a[0]+nx*w,a[1]+ny*w],[b[0]+nx*w,b[1]+ny*w],[b[0]-nx*w,b[1]-ny*w],[a[0]-nx*w,a[1]-ny*w]];
  poly(c,shape(width/2+1.4),outline);poly(c,shape(width/2),color);
  poly(c,[[a[0]+nx*width/2,a[1]+ny*width/2],[b[0]+nx*width/2,b[1]+ny*width/2],[b[0],b[1]],[a[0],a[1]]],shade);
}
const sprite=document.createElement('canvas');sprite.width=130;sprite.height=112;const sc=sprite.getContext('2d');
function paintFighter(c,character,x,y,scale,flip,{pose='idle',motion=0,time=0,flash=false,fallen=false}={}){
  const p=palettes[character]||palettes.ray;sc.clearRect(0,0,130,112);sc.imageSmoothingEnabled=false;
  const nox=character==='nox',kai=character==='kai',punch=['attack','final'].includes(pose)&&character==='ray',kick=pose==='attack'&&kai,blast=['attack','final'].includes(pose)&&nox;
  const bob=Math.round(Math.sin(time/(kai?140:nox?370:260))*(nox?2:1));
  let hip=[43,68],rearKnee=[28,83],rearFoot=[18,99],frontKnee=[58,82],frontFoot=[65,100],rearElbow=[21,52],rearHand=[29,58],frontElbow=[61,48],frontHand=[65,32];
  if(punch){frontElbow=[66,35];frontHand=[80,25];rearHand=[29,39];rearElbow=[22,46];frontKnee=[61,83];frontFoot=[74,99];}
  if(kick){frontKnee=[65,59];frontFoot=[90,43];rearKnee=[30,85];rearFoot=[27,101];frontHand=[57,30];rearHand=[24,42];}
  if(blast){frontElbow=[65,42];frontHand=[83,40];rearElbow=[53,56];rearHand=[78,43];}
  if(pose==='final'&&kai){frontElbow=[62,26];frontHand=[64,7];rearElbow=[22,48];rearHand=[29,42];frontKnee=[58,71];frontFoot=[57,89];}
  if(pose==='hurt'){frontHand=[64,42];frontElbow=[58,55];rearHand=[24,36];rearElbow=[19,47];}
  const s=sc;
  s.save();s.translate(0,bob);
  // Wide stance, layered trousers, knee seams and heavy arcade boots.
  limb(s,[37,67],rearKnee,15,p.cloth,p.dark);limb(s,rearKnee,rearFoot,12,p.cloth,p.dark);
  limb(s,[48,67],frontKnee,16,p.mid,p.cloth);limb(s,frontKnee,frontFoot,13,p.mid,p.cloth);
  box(s,rearKnee[0]-5,rearKnee[1]-2,8,3,p.mid);box(s,frontKnee[0]-5,frontKnee[1]-2,10,3,p.hi);
  poly(s,[[rearFoot[0]-7,rearFoot[1]-5],[rearFoot[0]+5,rearFoot[1]-5],[rearFoot[0]+7,rearFoot[1]+2],[rearFoot[0]-10,rearFoot[1]+2]],p.dark);
  box(s,rearFoot[0]-9,rearFoot[1]-2,16,4,p.boot);box(s,rearFoot[0]-8,rearFoot[1]+2,15,2,p.accent);
  if(kick){limb(s,[frontFoot[0]-7,frontFoot[1]+4],[frontFoot[0]+3,frontFoot[1]-3],10,p.boot,p.dark);box(s,frontFoot[0]-3,frontFoot[1]-7,7,3,p.accent);}
  else{poly(s,[[frontFoot[0]-6,frontFoot[1]-6],[frontFoot[0]+5,frontFoot[1]-6],[frontFoot[0]+12,frontFoot[1]+1],[frontFoot[0]-7,frontFoot[1]+2]],p.dark);box(s,frontFoot[0]-5,frontFoot[1]-3,13,5,p.boot);box(s,frontFoot[0]-6,frontFoot[1]+2,19,2,p.accent);}
  // Back arm and oversized muscular silhouette.
  limb(s,[28,41],rearElbow,12,p.skin,p.shade);limb(s,rearElbow,rearHand,10,p.skin,p.shade);
  box(s,rearHand[0]-5,rearHand[1]-4,10,9,p.dark);box(s,rearHand[0]-4,rearHand[1]-3,8,7,p.glove);box(s,rearHand[0]-3,rearHand[1]-3,7,2,p.accent);
  // Sleeveless uniform; cyber armour for Nox.
  poly(s,[[26,35],[37,32],[49,32],[60,38],[57,54],[53,67],[32,68],[27,56],[23,43]],p.dark);
  poly(s,[[28,36],[36,35],[42,39],[49,34],[57,39],[54,52],[51,66],[33,66],[29,52]],p.cloth);
  poly(s,[[28,37],[35,36],[40,42],[38,59],[33,64],[28,51]],p.mid);
  poly(s,[[45,40],[50,35],[57,40],[53,51],[45,56]],p.mid);
  box(s,34,47,4,10,p.hi);box(s,42,43,3,20,p.dark);box(s,46,57,6,3,p.hi);
  if(nox){poly(s,[[29,38],[39,37],[40,45],[29,47]],p.hi);poly(s,[[45,39],[55,38],[54,46],[45,47]],p.mid);box(s,39,47,7,6,p.accent);box(s,40,48,5,3,'#f5dfff');box(s,34,58,15,2,p.accent);}
  box(s,30,64,25,5,p.dark);box(s,31,65,24,2,p.accent);box(s,39,64,5,5,p.hi);
  if(!nox){poly(s,[[42,68],[46,68],[51,78],[47,80]],p.accent);poly(s,[[43,68],[46,68],[42,78],[39,77]],p.mid);}
  if(character==='ray'){poly(s,[[29,61],[37,65],[33,83],[22,86],[28,73]],p.cloth);poly(s,[[48,65],[54,62],[62,79],[56,85],[49,75]],p.mid);box(s,25,82,8,2,p.accent);box(s,55,80,6,2,p.hi);}
  // Neck, square jaw, cheek planes and unmistakable fighting-game brows.
  box(s,36,27,13,10,p.shade);box(s,38,28,9,8,p.skin);
  poly(s,[[30,12],[36,7],[48,8],[56,15],[55,27],[49,33],[39,33],[32,28]],p.dark);
  poly(s,[[32,13],[39,10],[49,11],[53,17],[52,27],[47,31],[39,30],[33,25]],p.skin);
  box(s,33,20,5,7,p.shade);box(s,38,28,10,3,p.shade);box(s,48,19,5,6,p.light);box(s,43,27,7,1,p.dark);box(s,42,30,5,1,p.light);
  if(nox){poly(s,[[30,11],[34,5],[40,6],[44,2],[50,6],[55,8],[55,16],[48,13],[42,15],[37,11]],p.hair);box(s,36,18,18,6,p.dark);box(s,40,19,14,2,p.accent);box(s,53,19,3,4,p.hi);box(s,31,17,4,11,p.glove);box(s,32,20,2,5,p.accent);}
  else{
    poly(s,[[29,15],[29,9],[33,5],[37,7],[41,3],[45,6],[49,5],[54,10],[55,17],[49,14],[45,13],[40,17],[34,14]],p.hair);
    if(kai){poly(s,[[30,9],[24,10],[18,17],[19,25],[22,20],[27,17],[30,16]],p.hair);box(s,20,17,3,6,p.mid);}
    box(s,31,15,23,4,p.accent);box(s,32,17,21,2,kai?'#b94841':'#7c9c47');
    poly(s,[[31,16],[25,17],[18-(motion*4),14],[20,19],[28,20]],p.accent);poly(s,[[28,19],[23,22],[18-(motion*5),21],[23,25],[30,21]],p.mid);
    box(s,40,20,6,2,p.hair);box(s,49,20,5,2,p.hair);box(s,42,22,3,2,'#f9efd3');box(s,50,22,3,2,'#f9efd3');box(s,44,22,1,2,p.dark);box(s,52,22,1,2,p.dark);box(s,48,24,3,2,p.shade);
  }
  // Front arm is a separate animated limb, with wraps and knuckle highlights.
  const armSkin=nox?p.glove:p.skin,armShade=nox?p.cloth:p.shade;
  limb(s,[55,40],frontElbow,14,armSkin,armShade);box(s,53,38,7,6,nox?p.hi:p.light);
  limb(s,frontElbow,frontHand,11,armSkin,armShade);
  box(s,frontHand[0]-6,frontHand[1]-5,12,11,p.dark);box(s,frontHand[0]-5,frontHand[1]-4,10,9,p.glove);box(s,frontHand[0]-4,frontHand[1]-4,9,3,p.accent);box(s,frontHand[0]+2,frontHand[1]-1,4,4,nox?p.hi:p.skin);
  for(let i=0;i<3;i++)box(s,frontHand[0]-3+i*3,frontHand[1]+3,2,1,p.shade);
  if(nox){limb(s,[57,42],frontElbow,4,p.accent,p.mid);box(s,frontHand[0]-2,frontHand[1]-2,5,5,'#ead2ff');}
  if(character==='ray'){
    // White scarf and a genuine animated katana silhouette.
    box(s,34,29,18,5,p.hi);box(s,36,31,17,2,p.accent);poly(s,[[35,32],[31,33],[24-motion*6,28],[26,34],[34,37]],p.hi);
    const h=frontHand,tip=punch?[h[0]+32,h[1]-20]:[h[0]+18,h[1]+31];
    limb(s,[h[0]+3,h[1]+2],tip,3,p.accent,p.mid);box(s,h[0],h[1]-1,8,3,'#d9cfaa');box(s,h[0]+1,h[1]+2,3,5,p.dark);
  }
  s.restore();
  c.save();c.translate(x,y);if(flip)c.scale(-1,1);if(fallen){c.rotate(-1.35);c.translate(-45,22);}if(pose==='hurt')c.rotate(-.1);c.imageSmoothingEnabled=false;
  if(flash){s.globalCompositeOperation='source-atop';box(s,0,0,130,112,'#fff1ce');s.globalCompositeOperation='source-over';}
  c.drawImage(sprite,-43*scale,-104*scale,130*scale,112*scale);c.restore();
}
export function portrait(canvas,character){const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false;const tall=canvas.height>canvas.width*1.2;if(tall)paintFighter(c,character,canvas.width*.43,canvas.height*.92,canvas.height/117,false);else paintFighter(c,character,canvas.width*.43,canvas.height*1.95,canvas.width/50,false);}

function background(){
  const bg=document.createElement('canvas');bg.width=480;bg.height=210;const b=bg.getContext('2d');
  let seed=27;const rand=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
  for(let y=0;y<210;y++)box(b,0,y,480,1,`rgb(${29+y*.09},${31+y*.07},${54+y*.1})`);
  for(let i=0;i<100;i++)box(b,rand()*480,rand()*105,1,1,i%4?'#7c8c93':'#d3d2b3');
  // Hazy moon, stepped mountains, distant city.
  b.fillStyle='#516375';b.beginPath();b.arc(355,44,27,0,7);b.fill();b.fillStyle='#d7d6b1';b.beginPath();b.arc(355,44,24,0,7);b.fill();
  for(let i=0;i<16;i++)box(b,336+rand()*34,28+rand()*33,2+rand()*4,1+rand()*2,'#b4ba9b');
  for(let layer=0;layer<3;layer++){b.beginPath();b.moveTo(0,150);for(let x=0;x<=480;x+=20)b.lineTo(x,85+layer*13+rand()*22);b.lineTo(480,170);b.lineTo(0,170);b.fillStyle=['#414356','#333d50','#2b374a'][layer];b.fill();}
  for(let layer=0;layer<2;layer++)for(let x=0;x<480;x+=13+Math.floor(rand()*15)){
    const w=10+Math.floor(rand()*21),h=20+Math.floor(rand()*60),y=164-h;
    box(b,x,y,w,h,layer?'#122733':'#2c3c46');box(b,x+2,y-3,w-4,3,'#30444c');
    if(rand()>.6)box(b,x+w/2,y-10,1,9,'#556568');
    for(let wy=y+5;wy<160;wy+=7)for(let wx=x+3;wx<x+w-2;wx+=5)if(rand()>.45)box(b,wx,wy,2,3,['#9d9c69','#487477','#ce9f73'][Math.floor(rand()*3)]);
  }
  // Rooftop dojo with a tiled, curled roof and warmly lit paper screens.
  box(b,186,104,114,56,'#23332d');box(b,192,112,102,46,'#543f35');
  for(let x=197;x<291;x+=17){box(b,x,116,14,36,'#bfa16d');box(b,x+2,118,10,31,'#e0c88e');for(let y=121;y<150;y+=8)box(b,x+1,y,12,1,'#715c42');box(b,x+7,117,1,34,'#826e4c');}
  box(b,186,155,114,6,'#2c352b');for(const x of[188,239,294]){box(b,x,109,4,50,'#293b33');box(b,x+1,112,1,43,'#7d8760');}
  poly(b,[[171,107],[188,98],[229,81],[253,81],[297,99],[314,107],[303,112],[181,112]],'#182e30');
  for(let i=0;i<5;i++){const y=87+i*5;const half=12+i*11;box(b,241-half,y,half*2,2,'#4a6557');box(b,240-half,y+2,half*2+2,2,'#263f37');}
  poly(b,[[171,107],[169,100],[183,105],[300,105],[315,99],[314,107],[303,111],[181,111]],'#7b8e6d');box(b,181,109,122,2,'#263d32');
  box(b,225,105,33,12,'#202a28');box(b,227,107,29,8,'#4b5c3c');
  for(const [x,y]of[[231,109],[239,109],[247,109]]){box(b,x,y,5,1,'#ded39b');box(b,x+2,y-1,1,6,'#ded39b');box(b,x,y+3,5,1,'#ded39b');}
  // Air-conditioning units and old arcade cabinet.
  box(b,71,141,27,21,'#354345');box(b,73,143,23,15,'#63706a');for(let y=146;y<157;y+=3)box(b,76,y,17,1,'#293d3d');box(b,74,160,4,4,'#1e2d31');box(b,92,160,4,4,'#1e2d31');
  poly(b,[[393,132],[413,132],[415,146],[418,151],[418,170],[392,170],[392,149],[396,145]],'#252b39');box(b,396,135,14,12,'#77a397');box(b,398,137,10,8,'#294a4a');box(b,399,138,5,2,'#b5e29b');box(b,394,148,20,3,'#ba746c');box(b,396,150,3,2,'#e5c692');box(b,405,150,5,2,'#97ca8c');box(b,396,154,17,12,'#494657');box(b,399,156,11,1,'#8b777d');
  // Tree, stepped branches and detailed clusters of cherry blossoms.
  poly(b,[[15,167],[20,100],[14,66],[19,31],[23,29],[23,67],[31,98],[27,167]],'#293737');
  poly(b,[[22,69],[37,52],[65,49],[85,34],[88,37],[66,55],[40,59],[24,77]],'#394443');
  poly(b,[[20,56],[7,42],[0,39],[0,33],[13,37],[23,48]],'#344543');
  for(let i=0;i<170;i++){let x=rand()*113-18,y=rand()*49+17;if((x-40)**2/4700+(y-38)**2/900<1){const colors=['#765664','#9c6e79','#bd8a8d','#d9a798','#ae7e85'];box(b,x,y,3+rand()*7,2+rand()*5,colors[i%5]);if(i%5===0)box(b,x+2,y,2,1,'#e2b5a3');}}
  // Power cables, lantern light pools and paper lantern ribbing.
  for(let x=0;x<480;x+=4){const y=58+Math.sin(x/480*Math.PI)*18;box(b,x,y,4,1,'#142c31');}
  for(const [x,y]of[[106,72],[171,76],[313,76],[438,65]]){
    box(b,x+4,y-9,1,9,'#3e5251');box(b,x+1,y,8,13,'#d9a071');box(b,x,y+3,10,7,'#f0c38b');box(b,x+2,y,1,13,'#ac755b');box(b,x+7,y,1,13,'#ac755b');box(b,x+1,y-1,8,2,'#5a4c43');box(b,x+1,y+13,8,2,'#5a4c43');box(b,x+4,y+15,1,3,'#b18a67');
  }
  // Parapet, concrete tiles, perspective grout, weeds and markings.
  box(b,0,163,480,7,'#526d61');box(b,0,170,480,5,'#203d35');box(b,0,175,480,35,'#3a4c49');
  for(let x=0;x<480;x+=24){box(b,x,157,2,13,'#294b42');box(b,x,158,24,2,'#759078');}
  for(let y=179;y<210;y+=8){box(b,0,y,480,1,'#78816c');box(b,0,y+1,480,1,'#263f3a');}
  for(let x=-200;x<700;x+=37){b.strokeStyle='#73816a';b.beginPath();b.moveTo(240+(x-240)*.6,175);b.lineTo(x,210);b.stroke();}
  for(let i=0;i<100;i++)box(b,rand()*480,178+rand()*32,1+rand()*3,1,i%2?'#4e6256':'#354741');
  box(b,0,199,480,1,'#819378');box(b,0,201,480,2,'#2a4138');
  return bg;
}
export function startArt(canvas){
  const ctx=canvas.getContext('2d'),bg=background();
  let state={phase:'idle',players:[{character:'ray'},{character:'kai'}]},attack=null,lastKey='',raf,previewUntil=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function finalEffects(time){
    const p=Math.min(1,(time-attack.at)/3600),from=attack.index===0?245:715,to=attack.index===0?715:245,dir=Math.sign(to-from),kind=attack.character;
    const pulse=Math.sin(p*Math.PI),charge=Math.min(1,p*3),impact=Math.max(0,(p-.57)/.43);
    ctx.save();ctx.globalAlpha=pulse;
    // Each victory move has its own choreography, particle system and silhouette.
    if(kind==='ray'){
      for(let i=0;i<44;i++){const angle=i*2.39+p*5,r=35+(i%7)*13;const x=to+Math.cos(angle)*r,y=235+Math.sin(angle)*r*1.3;box(ctx,x,y,3,3,i%3?'#c5e9ee':'#f8f5e6');if(i%4===0){box(ctx,x-2,y+1,7,1,'#d7f4f3');box(ctx,x+1,y-2,1,7,'#d7f4f3');}}
      if(p>.17&&p<.76){const top=350-charge*220;ctx.globalAlpha=pulse*.82;poly(ctx,[[to-42,355],[to-55,210],[to,top],[to+55,205],[to+44,355]],'#9abed7');poly(ctx,[[to-40,350],[to-35,211],[to,top+12],[to+4,347]],'#d6f5f0');poly(ctx,[[to+6,346],[to+10,182],[to+45,216],[to+37,347]],'#7898bc');ctx.strokeStyle='#eefbfa';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(to-30,335);ctx.lineTo(to+18,199);ctx.lineTo(to-6,171);ctx.stroke();}
      ctx.globalAlpha=pulse;
      if(p>.43&&p<.67){const y=225+(p-.43)*170;poly(ctx,[[from,260],[to+60,y-6],[to+65,y+2],[from+dir*30,272]],'#edfdfb');}
      if(p>.68)for(let i=0;i<35;i++){const a=i*2.4,r=(p-.68)*270*(1+i%3/3);const x=to+Math.cos(a)*r,y=250+Math.sin(a)*r+impact*60;poly(ctx,[[x,y-7],[x+4,y],[x,y+6],[x-4,y]],i%2?'#d5f2f1':'#8eb6d8');}
    }else if(kind==='kai'){
      // A pixel dragon winds from the rising uppercut toward the opponent.
      const reach=Math.min(1,Math.max(0,(p-.15)*2.5));
      for(let i=0;i<30;i++){const t=i/29*reach,x=from+(to-from)*t,y=290-Math.sin(t*Math.PI)*160+Math.sin(t*12+p*7)*15,size=9+Math.sin(i*.9)*3;box(ctx,x-size,y-size,size*2,size*2,['#a0524d','#d88361','#f2b479','#f7d798'][i%4]);box(ctx,x-2,y-3,6,5,'#ffeac0');}
      const hx=from+(to-from)*reach,hy=290-Math.sin(reach*Math.PI)*160;
      poly(ctx,[[hx-dir*23,hy-21],[hx+dir*8,hy-25],[hx+dir*30,hy-7],[hx+dir*17,hy+9],[hx-dir*20,hy+13]],'#eeae73');
      poly(ctx,[[hx-dir*16,hy-17],[hx-dir*22,hy-42],[hx-dir*2,hy-23]],'#ffe4ad');box(ctx,hx+dir*8,hy-12,7,4,'#fff5d7');box(ctx,hx+dir*14,hy-10,3,3,'#a34c43');
      if(p>.54){const h=Math.sin(Math.min(1,(p-.54)*2.3)*Math.PI)*210;for(let i=0;i<11;i++){const offset=(i-5)*7;poly(ctx,[[to+offset-8,360],[to+offset,360-h-(i%3)*20],[to+offset+10,360]],i%2?'#f5ce90':'#df936b');}}
      for(let i=0;i<35;i++)box(ctx,to+Math.sin(i*7+p*9)*(20+impact*90),325-((i*29+p*230)%200),3+i%3,4,i%2?'#e5a273':'#fae3b3');
    }else{
      // A suspended star sphere, three orbital rings and a focused stellar beam.
      const cx=from+dir*15,cy=130,rad=18+charge*27;
      for(let ring=0;ring<3;ring++){ctx.strokeStyle=['#7b78b6','#b6a4e4','#e3d5f5'][ring];ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(cx,cy,rad+15+ring*14,(rad+ring*10)*.45,p*4+ring,0,Math.PI*2);ctx.stroke();}
      for(let i=0;i<24;i++){const a=i*2.4+p*4,r=rad*Math.sqrt((i+1)/24);box(ctx,cx+Math.cos(a)*r,cy+Math.sin(a)*r,7,6,i%3?'#bca5e4':'#f0e5f7');}
      box(ctx,cx-6,cy-rad,12,rad*2,'#f1e5ff');box(ctx,cx-rad,cy-5,rad*2,10,'#e0cffa');
      if(p>.48){const width=18+Math.sin(p*8)*5;poly(ctx,[[cx-width,cy],[cx+width,cy],[to+width,345],[to-width,345]],'#9782c8');poly(ctx,[[cx-6,cy],[cx+6,cy],[to+8,345],[to-8,345]],'#f1e5ff');}
      for(let i=0;i<35;i++){const x=to+Math.cos(i*2.4+p*3)*(25+impact*70),y=260+Math.sin(i*2.4+p*3)*(35+impact*90);box(ctx,x-4,y,9,2,'#ddcdf2');box(ctx,x,y-4,2,9,'#ddcdf2');}
    }
    ctx.restore();
  }
  function effects(time){
    if(!attack)return;if(attack.fatality){if(time-attack.at>3600){attack=null;return;}finalEffects(time);return;}const progress=(time-attack.at)/1300;if(progress>1){attack=null;return;}
    const from=attack.index===0?266:694,to=attack.index===0?694:266,dir=Math.sign(to-from),character=attack.character;
    const strike=Math.max(0,Math.min(1,(progress-.15)/.48)),point=from+(to-from)*strike;
    ctx.save();ctx.globalAlpha=Math.sin(Math.min(1,progress)*Math.PI)*.9;
    if(character==='ray'){
      for(let i=0;i<7;i++){const length=25+i*8;box(ctx,point-dir*(length+10),214+i*9,length,2,i%2?'#d9f1f2':'#8eb4d0');}
      poly(ctx,[[point-dir*30,191],[point+dir*22,211],[point+dir*43,243],[point+dir*22,276],[point-dir*29,294],[point-dir*4,266],[point+dir*13,243],[point-dir*5,217]],'#afdae4');
      poly(ctx,[[point-dir*17,201],[point+dir*28,242],[point-dir*16,282],[point+dir*9,242]],'#effdf8');
    }else if(character==='kai'){
      const cx=from+dir*100,cy=264;
      for(let i=0;i<17;i++){const angle=(-2+strike*5)+i*.11,radius=52+i*.9;box(ctx,cx+Math.cos(angle)*radius,cy+Math.sin(angle)*radius,8+i%3*3,5,['#f18757','#ffc382','#ffe8a5'][i%3]);}
      for(let i=0;i<10;i++)box(ctx,point-dir*i*12,254-Math.sin(i*.4)*26,12,6,i%2?'#ffc679':'#d95b48');
    }else{
      for(let i=0;i<4;i++){ctx.strokeStyle=['#665993','#9b80df','#d0b1fb','#f3dfff'][i];ctx.lineWidth=10-i*2;ctx.beginPath();ctx.ellipse(point,240,14+i*4,23+i*3,0,0,Math.PI*2);ctx.stroke();}
      for(let i=0;i<6;i++){const offset=Math.sin(time/30+i)*10;box(ctx,from,230+offset,point-from,3,i%2?'#c6a6fc':'#7767b8');}
      box(ctx,point-5,223,10,34,'#efe0ff');
    }
    if(progress>.54&&progress<.86){const amount=Math.sin((progress-.54)/.32*Math.PI);for(let i=0;i<16;i++){const a=i*Math.PI/8,r=15+amount*35;box(ctx,to+Math.cos(a)*r,239+Math.sin(a)*r,3+i%3,3,CHARACTERS[character].color);}}
    ctx.restore();
  }
  function draw(time){
    const attackProgress=attack?(time-attack.at)/(attack.fatality?3600:1300):2,active=attackProgress<1;
    ctx.save();ctx.imageSmoothingEnabled=false;
    if(active&&!reduced&&attackProgress>.55&&attackProgress<.7)ctx.translate(Math.round(Math.sin(time)*2),Math.round(Math.cos(time)*2));
    ctx.drawImage(bg,0,0,960,420);
    if(active&&attack.fatality){ctx.fillStyle=`rgba(24,22,45,${Math.sin(attackProgress*Math.PI)*.45})`;ctx.fillRect(0,0,960,420);}
    // Animated haze, airborne petals and lantern glints.
    if(!reduced){for(let i=0;i<15;i++){const x=(time/47+i*77)%990-20,y=68+(time/145+i*31)%264;box(ctx,x,y,3+(i%3),2,i%3?'#ba9091':'#e3b7a4');}for(let i=0;i<6;i++)box(ctx,(time/100+i*160)%960,330+i%3*11,65,1,'#8fa68612');}
    const chars=state.players?.map(p=>p.character||'ray')||['ray','kai'];
    for(let index=0;index<2;index++){
      const char=chars[index]||'kai',flip=index===1,attacking=active&&attack.index===index,hurt=active&&attack.index!==index&&attackProgress>.55;
      const x=index===0?245:715,dir=flip?-1:1;
      const rush=attacking?(char==='ray'?Math.sin(attackProgress*Math.PI)*78:char==='kai'?Math.sin(attackProgress*Math.PI)*55:Math.sin(attackProgress*Math.PI)*12):0;
      const jump=attacking&&char==='kai'?Math.sin(attackProgress*Math.PI)*(attack.fatality?115:65):0;
      ctx.fillStyle='#0c232783';ctx.beginPath();ctx.ellipse(x,363,67-(jump/4),8,0,0,Math.PI*2);ctx.fill();
      if(char==='nox'){ctx.globalAlpha=.25+.1*Math.sin(time/300);ctx.fillStyle='#b395f0';ctx.beginPath();ctx.ellipse(x,362,47,4,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
      if(attacking&&char==='kai'&&!reduced){ctx.globalAlpha=.16;paintFighter(ctx,char,x+dir*(rush-25),356-jump+10,2.15,flip,{pose:'attack',time});ctx.globalAlpha=1;}
      paintFighter(ctx,char,x+dir*rush+(hurt?-dir*14:0),356-jump,2.15,flip,{pose:attacking&&attackProgress>.16&&attackProgress<.8?(attack.fatality?'final':'attack'):hurt?'hurt':'idle',motion:active?1:0,time:reduced?0:time,flash:!reduced&&hurt&&Math.floor(time/100)%2===0,fallen:((state.phase==='finished'&&state.winner>=0&&state.winner!==index)||(active&&attack.fatality&&attack.index!==index&&attackProgress>.8))&&!(active&&attack.fatality&&attackProgress<.8)});
    }
    effects(time);ctx.restore();raf=requestAnimationFrame(draw);
  }
  raf=requestAnimationFrame(draw);
  return {
    update(next){const key=`${next.code}:${next.phase}:${next.round}:${next.result?.winner}`;if(next.phase==='finished'&&next.winner>=0&&!next.forfeit&&key!==lastKey){attack={at:performance.now(),index:next.winner,character:next.players?.[next.winner]?.character||'ray',fatality:true};lastKey=key;}else if(next.phase==='reveal'&&next.result?.winner>=0&&key!==lastKey){const index=next.result.winner;attack={at:performance.now(),index,character:next.players?.[index]?.character||'ray'};lastKey=key;}state={...state,...next};},
    preview(character,fatality=false){state={phase:'idle',players:[{character},{character:character==='kai'?'nox':'kai'}]};attack={at:performance.now(),index:0,character,fatality};},
    select(character){attack=null;state={phase:'idle',players:[{character},{character:character==='kai'?'nox':'kai'}]};},
    stop(){cancelAnimationFrame(raf);},
  };
}
