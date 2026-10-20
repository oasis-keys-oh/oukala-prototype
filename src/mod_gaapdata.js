/* GAAP reference graph (sample knowledge vault snapshot). node=[id,asc,title,type,status,tags,excerpt,bytes,upIdx,related,see] */
/* CL-39: the snapshot lives in src/assets/data/gaapdata.json. full.html embeds it; the split build fetches it when the Knowledge
   graph screen (vault) first opens. Read it with BUNDLE.get("gaapdata") or BUNDLE.data("gaapdata") (a Promise).
   Until 2026-10-20 it was a top-level const that no module could reach: mod_kgx reads window.GAAPDATA, which was never set. */
BUNDLE.lazy("gaapdata",{screens:["vault"]});
