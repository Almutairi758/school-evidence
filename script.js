const form=document.getElementById('evidenceForm');
const photosInput=document.getElementById('photos');
const thumbs=document.getElementById('thumbs');
const photosBanner=document.getElementById('photosBanner');
const photosCount=document.getElementById('photosCount');
const uploadMsg=document.getElementById('uploadMsg');
const previewWrap=document.getElementById('previewWrap');
const report=document.getElementById('report');
const reportStage=document.getElementById('reportStage');
let selectedFiles=[];
let previewUrls=[];
let reportUrls=[];

function updateReportScale(){
  if(previewWrap.classList.contains('hidden'))return;
  const naturalWidth=794,naturalHeight=1123;
  const available=Math.max(280,reportStage.clientWidth);
  const scale=Math.min(1,available/naturalWidth);
  report.style.transform=`scale(${scale})`;
  reportStage.style.height=`${naturalHeight*scale}px`;
}
window.addEventListener('resize',updateReportScale);

function revoke(urls){urls.forEach(u=>URL.revokeObjectURL(u));urls.length=0}
function renderThumbs(){
  revoke(previewUrls);thumbs.innerHTML='';
  photosBanner.classList.toggle('empty',selectedFiles.length===0);
  photosCount.textContent=selectedFiles.length?`${selectedFiles.length} من 4 صور`:'لم يتم اختيار صور';
  selectedFiles.forEach((file,index)=>{
    const box=document.createElement('div');box.className='thumb';
    const img=document.createElement('img');const url=URL.createObjectURL(file);previewUrls.push(url);img.src=url;img.alt=`صورة شاهد ${index+1}`;
    const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','حذف الصورة');
    remove.addEventListener('click',()=>{selectedFiles.splice(index,1);renderThumbs()});
    box.append(img,remove);thumbs.appendChild(box);
  });
}
photosInput.addEventListener('change',()=>{
  const incoming=Array.from(photosInput.files||[]).filter(f=>f.type.startsWith('image/'));
  const combined=[...selectedFiles,...incoming];uploadMsg.textContent='';
  if(combined.length>4){selectedFiles=combined.slice(0,4);uploadMsg.textContent='يمكن رفع 4 صور فقط. تم الاحتفاظ بأول 4 صور.'}else selectedFiles=combined;
  photosInput.value='';renderThumbs();
});
form.addEventListener('reset',()=>{selectedFiles=[];setTimeout(()=>{renderThumbs();uploadMsg.textContent='';previewWrap.classList.add('hidden')},0)});

function formatDate(value){
  if(!value)return'';
  const[y,m,d]=value.split('-').map(Number);
  return `${y}/${m}/${d}`;
}

form.addEventListener('submit',e=>{
  e.preventDefault();
  document.getElementById('rSchool').textContent=document.getElementById('school').value.trim();
  document.getElementById('rProgram').textContent=document.getElementById('program').value.trim();
  document.getElementById('rTeacher').textContent=document.getElementById('teacher').value.trim();
  document.getElementById('rTarget').textContent=document.getElementById('target').value.trim();
  document.getElementById('rLocation').textContent=document.getElementById('location').value.trim();
  document.getElementById('rCount').textContent=document.getElementById('count').value.trim();
  document.getElementById('rDate').textContent=formatDate(document.getElementById('date').value);

  const goals=document.getElementById('goals').value.split(/\n+/).map(x=>x.trim()).filter(Boolean);
  const goalsBox=document.getElementById('rGoals');goalsBox.innerHTML='';
  goals.slice(0,6).forEach(g=>{const li=document.createElement('li');li.textContent=g;goalsBox.appendChild(li)});

  revoke(reportUrls);
  const photosBox=document.getElementById('rPhotos');photosBox.innerHTML='';
  selectedFiles.forEach((file,index)=>{const img=document.createElement('img');const url=URL.createObjectURL(file);reportUrls.push(url);img.src=url;img.alt=`الشاهد المصور ${index+1}`;photosBox.appendChild(img)});
  for(let i=selectedFiles.length;i<4;i++){const p=document.createElement('div');p.className='photo-placeholder';p.textContent='صورة شاهد';photosBox.appendChild(p)}

  previewWrap.classList.remove('hidden');
  requestAnimationFrame(()=>{updateReportScale();previewWrap.scrollIntoView({behavior:'smooth',block:'start'})});
});

document.getElementById('editBtn').addEventListener('click',()=>{previewWrap.classList.add('hidden');form.scrollIntoView({behavior:'smooth',block:'start'})});
document.getElementById('printBtn').addEventListener('click',()=>window.print());

async function ensureExportLibs(){
  if(!window.html2canvas)await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
  if(!window.jspdf)await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
}
async function renderReportCanvas(scale=3){
  await ensureExportLibs();document.body.classList.add('exporting');
  const oldTransform=report.style.transform,oldHeight=reportStage.style.height;
  report.style.transform='none';reportStage.style.height='1123px';
  try{
    await Promise.all(Array.from(report.querySelectorAll('img')).map(img=>img.complete?Promise.resolve():new Promise(r=>{img.onload=img.onerror=r})));
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    return await html2canvas(report,{scale,useCORS:true,backgroundColor:'#fff',logging:false,width:794,height:1123,windowWidth:1200,windowHeight:1400});
  }finally{report.style.transform=oldTransform;reportStage.style.height=oldHeight;document.body.classList.remove('exporting')}
}
function downloadDataUrl(dataUrl,filename){const a=document.createElement('a');a.download=filename;a.href=dataUrl;document.body.appendChild(a);a.click();a.remove()}
document.getElementById('imageBtn').addEventListener('click',async()=>{try{const canvas=await renderReportCanvas(3);downloadDataUrl(canvas.toDataURL('image/png'),'الشاهد-جودة-عالية.png')}catch(e){alert('تعذر إنشاء الصورة. تأكد من اتصال الإنترنت ثم حاول مرة أخرى.')}});
document.getElementById('pdfBtn').addEventListener('click',async()=>{try{const canvas=await renderReportCanvas(3);const{jsPDF}=window.jspdf;const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});pdf.addImage(canvas.toDataURL('image/jpeg',0.98),'JPEG',0,0,210,297,undefined,'FAST');pdf.save('الشاهد.pdf')}catch(e){alert('تعذر إنشاء PDF. تأكد من اتصال الإنترنت ثم حاول مرة أخرى.')}});
renderThumbs();
