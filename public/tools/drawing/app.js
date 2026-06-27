const canvas=document.getElementById('drawingCanvas');
const ctx=canvas.getContext('2d',{willReadFrequently:true});
const colorInput=document.getElementById('color');
const sizeInput=document.getElementById('size');
const sizeLabel=document.getElementById('sizeLabel');
const status=document.getElementById('status');
const toolButtons=[...document.querySelectorAll('[data-tool]')];
let tool='brush',drawing=false,startX=0,startY=0,snapshot=null,history=[],redo=[];
ctx.lineCap='round';
ctx.lineJoin='round';
ctx.fillStyle='#ffffff';
ctx.fillRect(0,0,canvas.width,canvas.height);
function setStatus(text){status.textContent=text;}
function setTool(next){tool=next;toolButtons.forEach(b=>b.classList.toggle('active',b.dataset.tool===next));const current=toolButtons.find(b=>b.dataset.tool===next);setStatus(`Selected tool: ${current.textContent}`);}
function point(event){const rect=canvas.getBoundingClientRect();return{x:Math.floor((event.clientX-rect.left)*(canvas.width/rect.width)),y:Math.floor((event.clientY-rect.top)*(canvas.height/rect.height))};}
function strokeColor(){return tool==='eraser'?'#ffffff':colorInput.value;}
function pushHistory(){history.push(canvas.toDataURL('image/png'));if(history.length>40)history.shift();redo=[];}
function restore(dataUrl){const image=new Image();image.onload=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0);};image.src=dataUrl;}
function drawLine(x1,y1,x2,y2){ctx.strokeStyle=strokeColor();ctx.lineWidth=Number(sizeInput.value);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function drawRect(x1,y1,x2,y2){ctx.strokeStyle=colorInput.value;ctx.lineWidth=Number(sizeInput.value);ctx.strokeRect(Math.min(x1,x2),Math.min(y1,y2),Math.abs(x2-x1),Math.abs(y2-y1));}
function drawCircle(x1,y1,x2,y2){const radius=Math.hypot(x2-x1,y2-y1);ctx.strokeStyle=colorInput.value;ctx.lineWidth=Number(sizeInput.value);ctx.beginPath();ctx.arc(x1,y1,radius,0,Math.PI*2);ctx.stroke();}
function hexToRgba(hex){const v=hex.replace('#','');return[parseInt(v.slice(0,2),16),parseInt(v.slice(2,4),16),parseInt(v.slice(4,6),16),255];}
function fillAt(x,y){const image=ctx.getImageData(0,0,canvas.width,canvas.height);const data=image.data;const start=(y*canvas.width+x)*4;const target=[data[start],data[start+1],data[start+2],data[start+3]];const fill=hexToRgba(colorInput.value);if(target.every((v,i)=>v===fill[i]))return;const stack=[[x,y]];while(stack.length){const [cx,cy]=stack.pop();if(cx<0||cy<0||cx>=canvas.width||cy>=canvas.height)continue;const i=(cy*canvas.width+cx)*4;if(data[i]!==target[0]||data[i+1]!==target[1]||data[i+2]!==target[2]||data[i+3]!==target[3])continue;data[i]=fill[0];data[i+1]=fill[1];data[i+2]=fill[2];data[i+3]=fill[3];stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);}ctx.putImageData(image,0,0);}
function pickColor(x,y){const pixel=ctx.getImageData(x,y,1,1).data;colorInput.value=`#${[pixel[0],pixel[1],pixel[2]].map(v=>v.toString(16).padStart(2,'0')).join('')}`;setTool('brush');}
toolButtons.forEach(button=>button.addEventListener('click',()=>setTool(button.dataset.tool)));
sizeInput.addEventListener('input',()=>sizeLabel.textContent=`${sizeInput.value} px`);
canvas.addEventListener('pointerdown',event=>{const pos=point(event);startX=pos.x;startY=pos.y;if(tool==='fill'){fillAt(pos.x,pos.y);pushHistory();setStatus('Used fill bucket');return;}if(tool==='picker'){pickColor(pos.x,pos.y);setStatus('Picked a color and switched to Brush');return;}drawing=true;snapshot=ctx.getImageData(0,0,canvas.width,canvas.height);if(tool==='brush'||tool==='eraser')drawLine(pos.x,pos.y,pos.x,pos.y);});
canvas.addEventListener('pointermove',event=>{if(!drawing)return;const pos=point(event);if(tool==='brush'||tool==='eraser'){drawLine(startX,startY,pos.x,pos.y);startX=pos.x;startY=pos.y;return;}ctx.putImageData(snapshot,0,0);if(tool==='line')drawLine(startX,startY,pos.x,pos.y);if(tool==='rectangle')drawRect(startX,startY,pos.x,pos.y);if(tool==='circle')drawCircle(startX,startY,pos.x,pos.y);});
function endDraw(){if(!drawing)return;drawing=false;snapshot=null;pushHistory();}
canvas.addEventListener('pointerup',endDraw);
canvas.addEventListener('pointerleave',endDraw);
document.getElementById('undo').addEventListener('click',()=>{if(history.length<=1)return;redo.push(history.pop());restore(history[history.length-1]);setStatus('Undo');});
document.getElementById('redo').addEventListener('click',()=>{if(!redo.length)return;const next=redo.pop();history.push(next);restore(next);setStatus('Redo');});
document.getElementById('clear').addEventListener('click',()=>{ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);pushHistory();setStatus('Canvas cleared');});
document.getElementById('save').addEventListener('click',()=>{const link=document.createElement('a');link.download=`drawing-${Date.now()}.png`;link.href=canvas.toDataURL('image/png');link.click();setStatus('Saved drawing');});
pushHistory();
sizeLabel.textContent=`${sizeInput.value} px`;
setTool('brush');
