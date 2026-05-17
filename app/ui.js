// FILE: /app/ui.js

import {cleanText,crc32,encodeBlocks,decodeBlocks} from "../alm/core.js";

const SIZE=1024, HEADER=24;
const HEADER_CRC_OFFSET=8;
const HEADER_RESERVED_OFFSET=12;

async function extractDocx(file){
  const buf=await file.arrayBuffer();
  const zip=new JSZip();
  const doc=await zip.loadAsync(buf);
  const xml=await doc.file("word/document.xml").async("string");
  return xml.replace(/<[^>]+>/g," ");
}

async function extractPdf(file){
  const buf=await file.arrayBuffer();
  const pdf=await pdfjsLib.getDocument({data:buf}).promise;
  let out="";
  for(let i=1;i<=pdf.numPages;i++){
    const page=await pdf.getPage(i);
    const content=await page.getTextContent();
    const items=content.items.map(it=>{
      const tr=it.transform||[1,0,0,1,0,0];
      return {str:it.str,x:tr[4],y:tr[5]};
    });
    const Y=5;
    items.sort((a,b)=>b.y-a.y);
    const lines=[];
    for(const it of items){
      let placed=false;
      for(const line of lines){
        if(Math.abs(line.y-it.y)<=Y){
          line.items.push(it);
          line.y=(line.y*(line.items.length-1)+it.y)/line.items.length;
          placed=true;
          break;
        }
      }
      if(!placed) lines.push({y:it.y,items:[it]});
    }
    lines.sort((a,b)=>b.y-a.y);
    for(const line of lines){
      line.items.sort((a,b)=>b.x-a.x);
      const t=line.items.map(x=>x.str).join(" ");
      if(t.trim()) out+=t+"\n";
    }
  }
  return out;
}

export async function uiLoadFile(file){
  const n=file.name.toLowerCase();
  if(n.endsWith(".docx")) return await extractDocx(file);
  if(n.endsWith(".pdf")) return await extractPdf(file);
  return "";
}

function drawByte(buf,p,v){
  const g=255-(v&0xFF);
  const i=p*4;
  buf[i]=g; buf[i+1]=g; buf[i+2]=g; buf[i+3]=255;
}

export function uiEncodeToCanvas(text,key,canvas){
  const blocks=encodeBlocks(text,key);
  const crc=crc32(text);

  canvas.width=SIZE;
  canvas.height=SIZE;
  const ctx=canvas.getContext("2d");
  const img=ctx.createImageData(SIZE,SIZE);
  const buf=img.data;

  for(let i=0;i<buf.length;i+=4){
    buf[i]=255; buf[i+1]=255; buf[i+2]=255; buf[i+3]=255;
  }

  const count=BigInt(blocks.length);
  for(let i=0;i<8;i++){
    drawByte(buf,i,Number((count>>BigInt(8*i))&0xFFn));
  }

  for(let i=0;i<4;i++){
    drawByte(buf,HEADER_CRC_OFFSET+i,(crc>>>(8*i))&0xFF);
  }

  for(let p=HEADER_RESERVED_OFFSET;p<HEADER;p++){
    drawByte(buf,p,0);
  }

  for(let bi=0;bi<blocks.length;bi++){
    const C=blocks[bi];
    for(let j=0;j<8;j++){
      const v=Number((C>>BigInt(8*j))&0xFFn);
      drawByte(buf,HEADER+bi*8+j,v);
    }
  }

  ctx.putImageData(img,0,0);
}

function readByte(data,p){
  return 255-data[p*4];
}

export function uiDecodeFromCanvas(key,canvas){
  const ctx=canvas.getContext("2d");
  const size=canvas.width;
  const data=ctx.getImageData(0,0,size,size).data;

  let count=0n;
  for(let i=0;i<8;i++){
    count|=(BigInt(readByte(data,i))<<BigInt(8*i));
  }
  const blocksCount=Number(count);

  let crc=0;
  for(let i=0;i<4;i++){
    crc|=(readByte(data,HEADER_CRC_OFFSET+i)<<(8*i));
  }

  const blocks=[];
  for(let bi=0;bi<blocksCount;bi++){
    let C=0n;
    for(let j=0;j<8;j++){
      const v=readByte(data,HEADER+bi*8+j);
      C|=(BigInt(v)<<BigInt(8*j));
    }
    blocks.push(C);
  }

  const text=decodeBlocks(blocks,key);
  return {text,crc};
}

export function uiExportWord(text){
  const doc=new docx.Document({
    sections:[{children:[new docx.Paragraph(text)]}]
  });
  docx.Packer.toBlob(doc).then(b=>{
    const a=document.createElement("a");
    a.href=URL.createObjectURL(b);
    a.download="decoded.docx";
    a.click();
  });
}

export function uiExportPdf(text){
  const {jsPDF}=window.jspdf;
  const pdf=new jsPDF();
  const lines=pdf.splitTextToSize(text,180);
  pdf.text(lines,15,15);
  pdf.save("decoded.pdf");
}
