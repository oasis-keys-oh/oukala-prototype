 const rc=e=>{if(!e)return null;const r=e.getBoundingClientRect();return [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)].join(',')};
 const sl=ms=>new Promise(r=>setTimeout(r,ms));await sl(500);
 const bn=document.querySelector('#inbxBanners');
 return JSON.stringify({w:innerWidth,rail:rc(document.querySelector('aside.rail')),railPos:getComputedStyle(document.querySelector('aside.rail')).position,collapsed:document.getElementById('railCollapse').checked,topbar:rc(document.querySelector('.topbar')),view:rc(document.querySelector('#view')),search:rc(document.querySelector('.topbar .search')),banners:rc(bn),orb:rc(document.querySelector('#chxOrb')),viewPadBottom:getComputedStyle(document.querySelector('#view')).paddingBottom})
