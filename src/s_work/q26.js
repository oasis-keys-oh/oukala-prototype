return JSON.stringify({items:NEWMENU.items?NEWMENU.items.map(i=>i.key+":"+i.label):Object.keys(NEWMENU)})
