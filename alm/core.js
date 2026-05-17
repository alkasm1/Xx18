// FILE: /alm/core.js

const B=32, LMAX=12;

const indexToChar={
  1:"ا",2:"ب",3:"ت",4:"ث",5:"ج",6:"ح",7:"خ",8:"د",9:"ذ",
  10:"ر",11:"ز",12:"س",13:"ش",14:"ص",15:"ض",16:"ط",
  17:"ظ",18:"ع",19:"غ",20:"ف",21:"ق",22:"ك",23:"ل",
  24:"م",25:"ن",26:"ه",27:"و",28:"ي",29:"ء"
};

const charToIndex={};
for(let k in indexToChar) charToIndex[indexToChar[k]]=Number(k);

function normalizeArabic(s){
  return (s||"")
    .replace(/[إأآ]/g,"ا")
    .replace(/ئ/g,"ي")
    .replace(/ة/g,"ه");
}

export function cleanText(t){
  t=normalizeArabic(t);
  let out="";
  for(const ch of t){
    if(ch===" "||ch==="\n"||ch==="\t") out+=" ";
    else if(charToIndex[ch]) out+=ch;
  }
  return out.replace(/\s+/g," ").trim();
}

export function crc32(str){
  const table=crc32.table||(crc32.table=(()=>{
    const t=new Array(256);
    for(let i=0;i<256;i++){
      let c=i;
      for(let k=0;k<8;k++){
        c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);
      }
      t[i]=c>>>0;
    }
    return t;
  })());

  const bytes=new TextEncoder().encode(str);
  let crc=0xFFFFFFFF;
  for(let i=0;i<bytes.length;i++){
    crc=(crc>>>8)^table[(crc^bytes[i])&0xFF];
  }
  return (crc^0xFFFFFFFF)>>>0;
}

function wordToCode(w){
  const c=new Array(LMAX).fill(0);
  let p=0;
  for(let i=w.length-1;i>=0;i--){
    const idx=charToIndex[w[i]];
    if(idx===undefined) continue;
    c[p++]=idx;
    if(p>=LMAX) break;
  }
  let C=0n;
  for(let i=0;i<LMAX;i++){
    C+=BigInt(c[i])*(BigInt(B)**BigInt(i));
  }
  return C;
}

function codeToWord(C){
  let out="";
  for(let i=0;i<LMAX;i++){
    const d=Number(C%BigInt(B));
    C/=BigInt(B);
    if(d) out=indexToChar[d]+out;
  }
  return out;
}

export function encodeBlocks(text,key){
  const words=text.split(" ");
  const blocks=[];
  for(const w of words){
    for(let i=0;i<w.length;i+=LMAX){
      blocks.push(w.slice(i,i+LMAX));
    }
  }
  return blocks.map(b=>wordToCode(b)^key);
}

export function decodeBlocks(blocks,key){
  return blocks.map(C=>codeToWord(C^key)).join(" ");
}
