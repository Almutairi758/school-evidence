
const form = document.getElementById('evidenceForm');
const photosInput = document.getElementById('photos');
const thumbs = document.getElementById('thumbs');
const uploadMsg = document.getElementById('uploadMsg');
const previewWrap = document.getElementById('previewWrap');
let selectedFiles = [];

function renderThumbs(){
  thumbs.innerHTML = '';
  selectedFiles.forEach((file,index)=>{
    const box = document.createElement('div');
    box.className = 'thumb';

    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.alt = 'صورة شاهد ' + (index + 1);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = '×';
    remove.setAttribute('aria-label','حذف الصورة');
    remove.addEventListener('click',()=>{
      selectedFiles.splice(index,1);
      renderThumbs();
    });

    box.append(img,remove);
    thumbs.appendChild(box);
  });
}

photosInput.addEventListener('change',()=>{
  const incoming = Array.from(photosInput.files || []).filter(f=>f.type.startsWith('image/'));
  const combined = [...selectedFiles,...incoming];
  uploadMsg.textContent = '';
  if(combined.length > 4){
    selectedFiles = combined.slice(0,4);
    uploadMsg.textContent = 'يمكن رفع 4 صور فقط. تم الاحتفاظ بأول 4 صور.';
  } else {
    selectedFiles = combined;
  }
  photosInput.value = '';
  renderThumbs();
});

form.addEventListener('reset',()=>{
  selectedFiles = [];
  setTimeout(()=>{
    renderThumbs();
    uploadMsg.textContent = '';
    previewWrap.classList.add('hidden');
  },0);
});

function formatDate(value){
  if(!value) return '';
  const [y,m,d] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('ar-SA-u-ca-gregory',{year:'numeric',month:'numeric',day:'numeric'})
    .format(new Date(Date.UTC(y,m-1,d)));
}

form.addEventListener('submit',(e)=>{
  e.preventDefault();

  document.getElementById('rSchool').textContent = document.getElementById('school').value.trim();
  document.getElementById('rTeacher').textContent = document.getElementById('teacher').value.trim();
  document.getElementById('rTarget').textContent = document.getElementById('target').value.trim();
  document.getElementById('rLocation').textContent = document.getElementById('location').value.trim() || '—';
  document.getElementById('rCount').textContent = document.getElementById('count').value.trim() || '—';
  document.getElementById('rDate').textContent = formatDate(document.getElementById('date').value);

  const title = document.getElementById('title').value.trim();
  const titleNode = document.getElementById('rTitle');
  if (titleNode) titleNode.textContent = title ? 'عنوان الشاهد: ' + title : '';

  const goals = document.getElementById('goals').value
    .split(/\n+/)
    .map(x=>x.trim())
    .filter(Boolean);

  const goalsBox = document.getElementById('rGoals');
  goalsBox.innerHTML = '';
  goals.forEach(g=>{
    const li = document.createElement('li');
    li.textContent = g;
    goalsBox.appendChild(li);
  });

  const photosBox = document.getElementById('rPhotos');
  photosBox.innerHTML = '';

  if(selectedFiles.length){
    selectedFiles.forEach((file,index)=>{
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = 'الشاهد المصور ' + (index+1);
      photosBox.appendChild(img);
    });
  }

  for(let i=selectedFiles.length;i<4;i++){
    const placeholder = document.createElement('div');
    placeholder.className = 'photo-placeholder';
    placeholder.textContent = 'صورة شاهد';
    photosBox.appendChild(placeholder);
  }

  previewWrap.classList.remove('hidden');
  previewWrap.scrollIntoView({behavior:'smooth',block:'start'});
});

document.getElementById('editBtn').addEventListener('click',()=>{
  previewWrap.classList.add('hidden');
  form.scrollIntoView({behavior:'smooth',block:'start'});
});

document.getElementById('printBtn').addEventListener('click',()=>window.print());


async function ensureExportLibs(){
  if(!window.html2canvas){
    await new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      s.onload=resolve; s.onerror=reject; document.head.appendChild(s);
    });
  }
  if(!window.jspdf){
    await new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
      s.onload=resolve; s.onerror=reject; document.head.appendChild(s);
    });
  }
}

async function renderReportCanvas(){
  await ensureExportLibs();
  const report=document.getElementById('report');
  document.body.classList.add('exporting');
  try{
    return await html2canvas(report,{
      scale:2,
      useCORS:true,
      backgroundColor:'#ffffff',
      logging:false
    });
  } finally {
    document.body.classList.remove('exporting');
  }
}

document.getElementById('imageBtn').addEventListener('click', async ()=>{
  try{
    const canvas=await renderReportCanvas();
    const link=document.createElement('a');
    link.download='الشاهد.png';
    link.href=canvas.toDataURL('image/png');
    link.click();
  }catch(e){
    alert('تعذر إنشاء الصورة. تأكد من اتصال الإنترنت ثم حاول مرة أخرى.');
  }
});

document.getElementById('pdfBtn').addEventListener('click', async ()=>{
  try{
    const canvas=await renderReportCanvas();
    const { jsPDF }=window.jspdf;
    const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    const imgData=canvas.toDataURL('image/jpeg',0.95);
    const pageW=210, pageH=297;
    const ratio=Math.min(pageW/canvas.width,pageH/canvas.height);
    const w=canvas.width*ratio, h=canvas.height*ratio;
    const x=(pageW-w)/2, y=(pageH-h)/2;
    pdf.addImage(imgData,'JPEG',x,y,w,h,undefined,'FAST');
    pdf.save('الشاهد.pdf');
  }catch(e){
    alert('تعذر إنشاء PDF. تأكد من اتصال الإنترنت ثم حاول مرة أخرى.');
  }
});
