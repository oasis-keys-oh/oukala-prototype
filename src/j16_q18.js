(()=>{const out=[];for(const s of SCREENS){try{go(s[0]);const n=DASHX.discover().length;if(n>=5)out.push(s[0]+':'+n)}catch(e){}}return out.join(' ')})()
