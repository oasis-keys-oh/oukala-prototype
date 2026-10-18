(()=>{const a=ZLINK.audit();const c=(a.checks||[]).find(c=>c.id==="m_noin");return c&&(c.items||c.list||c.ex||c.rows||Object.keys(c)).slice?JSON.stringify(c).slice(0,500):1})()
