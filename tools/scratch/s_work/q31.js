return JSON.stringify(ORGX.vacs().reduce((a,v)=>(a[v.status]=(a[v.status]||0)+1,a),{}))
