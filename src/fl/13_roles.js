/* ---------------- roles and permissions (shared by approvals and workflow assignment) ---------------- */
const USERROLES={"Omar Hamid":["CIO","Portfolio board","Executive sponsor","Platform admin"],"Avery Chen":["Controller","Budget owner","Finance approver","Contract owner"],"Priya Shah":["Project manager","Release manager","Budget owner"],"Tom Becker":["Service owner","Service desk lead"],"Maya Ortiz":["Portfolio lead","Portfolio board","Vendor owner","Budget owner"],"Nia Brooks":["Change manager","CAB member"],"Rina Okafor":["Security lead","Data steward"],"Jordan Lee":["Architecture review board","Architect"],"Sam Patel":["Service owner","Release manager","CAB member"],"Dev Rao":["Data steward","Project manager"],"Chief Editor":["Contract owner","Service owner"]};
const ALLROLES=["Controller","CIO","CFO","CEO","Budget owner","Portfolio lead","Portfolio board","Change manager","CAB member","Security lead","Service owner","Contract owner","Architecture review board","Release manager","Data steward","Requester's manager","Procurement lead","Legal counsel","Project manager","Vendor owner","Finance approver"];
const rolesOf=n=>USERROLES[n]||[];
const holders=role=>Object.keys(USERROLES).filter(u=>USERROLES[u].includes(role));
const TEAMN=TEAMS.map(t=>t.n);
const SKILLS=()=>{const s=new Set();DIR.forEach(d=>(d.skills||[]).forEach(x=>s.add(x)));return[...s].sort()};
