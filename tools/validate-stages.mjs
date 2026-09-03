import fs from 'node:fs';

const SIZE=5;
const source=fs.readFileSync(new URL('../www/game.js',import.meta.url),'utf8');
const match=source.match(/const stages=(\[[\s\S]*?\n\]);/);
if(!match) throw new Error('Could not read stages from www/game.js');
const stages=Function(`"use strict";return (${match[1]})`)();
const empty=()=>Array.from({length:SIZE},()=>Array(SIZE).fill(0));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function compress(line){const nums=line.filter(Boolean),out=[];let merges=0;for(let i=0;i<nums.length;i++){if(nums[i]===nums[i+1]){out.push(nums[i]*2);merges++;i++}else out.push(nums[i])}while(out.length<SIZE)out.push(0);return{line:out,merges}}
function simulate(source,dir){const next=empty();let moveMerges=0;for(let i=0;i<SIZE;i++){let line=(dir==='left'||dir==='right')?[...source[i]]:source.map(r=>r[i]);if(dir==='right'||dir==='down')line.reverse();const c=compress(line);line=c.line;moveMerges+=c.merges;if(dir==='right'||dir==='down')line.reverse();for(let j=0;j<SIZE;j++){if(dir==='left'||dir==='right')next[i][j]=line[j];else next[j][i]=line[j]} }return{board:next,moveMerges}}
function solve(stage){const start=empty();stage.tiles.forEach(([r,c,v=2])=>start[r][c]=v);if(start.flat().includes(stage.target))return{ok:false,reason:'target already exists'};const dirs=['up','down','left','right'];const q=[{board:start,merges:0,path:[]}],seen=new Set([JSON.stringify(start)+'|0']);for(let p=0;p<q.length;p++){const state=q[p];if(state.path.length>=12)continue;for(const dir of dirs){const r=simulate(state.board,dir);if(same(state.board,r.board))continue;const merges=state.merges+r.moveMerges;if(merges>stage.maxMerges)continue;const path=[...state.path,dir];if(r.board.flat().includes(stage.target))return{ok:true,path,merges};const key=JSON.stringify(r.board)+'|'+merges;if(!seen.has(key)){seen.add(key);q.push({board:r.board,merges,path})}}}return{ok:false,reason:'no solution within merge limit'}}
let failed=false;
stages.forEach((stage,i)=>{const result=solve(stage);if(!result.ok){failed=true;console.error(`Stage ${i+1}: FAIL - ${result.reason}`)}else console.log(`Stage ${i+1}: OK - ${result.path.join(' → ')} (${result.merges}/${stage.maxMerges} merges)`) });
if(failed)process.exit(1);
console.log(`Validated ${stages.length} solvable stages.`);
