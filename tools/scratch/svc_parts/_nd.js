 const CHN=[["teams","Teams"],["email","Email"],["sms","SMS"],["push","Push"],["inapp","In-app"]];
 const EVT=[
  {id:"e1",n:"Incident P1 opened",src:"Incidents",sev:"Urgent",to:"On-call primary, service owner",x:{teams:1,email:0,sms:1,push:1,inapp:1}},
  {id:"e2",n:"SLA reached 75%",src:"SLAs",sev:"High",to:"Assignee, assignment group manager",x:{teams:1,email:0,sms:0,push:1,inapp:1}},
  {id:"e3",n:"SLA breached",src:"SLAs",sev:"Urgent",to:"Assignee, manager, service owner",x:{teams:1,email:1,sms:1,push:0,inapp:1}},
  {id:"e4",n:"Approval needed",src:"Requests",sev:"Normal",to:"Approver",x:{teams:1,email:1,sms:0,push:1,inapp:1}},
  {id:"e5",n:"Request delivered",src:"Requests",sev:"Info",to:"Requester",x:{teams:0,email:1,sms:0,push:1,inapp:1}},
  {id:"e6",n:"Change scheduled",src:"Changes",sev:"Normal",to:"Change advisory board, affected owners",x:{teams:1,email:1,sms:0,push:0,inapp:1}},
  {id:"e7",n:"Change freeze starts",src:"Changes",sev:"High",to:"All engineers, service owners",x:{teams:1,email:1,sms:0,push:1,inapp:1}},
  {id:"e8",n:"On-call page",src:"On-call",sev:"Urgent",to:"Person on call",x:{teams:0,email:0,sms:1,push:1,inapp:0}},
  {id:"e9",n:"Licence true-up risk",src:"Assets",sev:"High",to:"IT asset owner, CIO",x:{teams:1,email:1,sms:0,push:0,inapp:1}},
  {id:"e10",n:"Knowledge article review due",src:"Knowledge",sev:"Info",to:"Article owner",x:{teams:0,email:1,sms:0,push:0,inapp:1}},
  {id:"e11",n:"Access review due",src:"Compliance",sev:"Normal",to:"Data owners",x:{teams:1,email:1,sms:0,push:0,inapp:1}}];
 const MX={};EVT.forEach(e=>MX[e.id]=Object.assign({},e.x));
 const DIGO={freq:["Real time","Hourly","Daily at 08:00","Weekly on Monday"],ch:["Teams","Email","In-app"],fl:["Everything","Normal and above","High and above","Urgent only"]};
 const DIG={exec:{freq:"Daily at 08:00",ch:"Email",fl:"High and above"},fin:{freq:"Daily at 08:00",ch:"Email",fl:"Normal and above"},pm:{freq:"Hourly",ch:"Teams",fl:"Normal and above"},ops:{freq:"Real time",ch:"Teams",fl:"Everything"}};
 const QH={on:true,from:"20:00",to:"07:00",tz:"Mountain",wk:true,p1:true};
 const PIPE={ev:3418,matched:2906,sup:412,thr:96,quiet:64,ok:2247,fail:87};
 const TPL=[
  {id:"T1",ev:"e1",ch:"teams",sub:"P1 incident {{ticket.number}}",body:"{{ticket.short_description}}. Priority {{priority}}. Assigned to {{assignee}}. Join the bridge: {{link}}",up:"Sep 14"},
  {id:"T2",ev:"e1",ch:"sms",sub:"",body:"MSF P1 {{ticket.number}}: {{ticket.short_description}}. Reply 1 to acknowledge. {{link}}",up:"Sep 14"},
  {id:"T3",ev:"e2",ch:"teams",sub:"{{ticket.number}} is at {{sla.percent}}% of its SLA",body:"{{ticket.short_description}}. Due {{sla.due}}. Owner: {{assignee}}. {{link}}",up:"Aug 30"},
  {id:"T4",ev:"e3",ch:"email",sub:"SLA breached: {{ticket.number}}",body:"The SLA on {{ticket.number}} ({{ticket.short_description}}) was breached at {{sla.due}}. Assignee: {{assignee}}. Next step: review the escalation in {{link}}.",up:"Aug 30"},
  {id:"T5",ev:"e4",ch:"email",sub:"Approval needed: {{item}} for {{requester}}",body:"{{requester}} asked for {{item}}. Your approval is needed as {{approver}}. Approve or reject in one click: {{link}}",up:"Sep 02"},
  {id:"T6",ev:"e4",ch:"push",sub:"Approval needed",body:"{{requester}}: {{item}}. Tap to approve.",up:"Sep 02"},
  {id:"T7",ev:"e5",ch:"email",sub:"Delivered: {{item}}",body:"Your request for {{item}} is done. If anything is wrong, reply to this message and we will reopen it. {{link}}",up:"Jul 21"},
  {id:"T8",ev:"e8",ch:"sms",sub:"",body:"MSF on-call page: {{ticket.short_description}} ({{ticket.number}}). Acknowledge: {{link}}",up:"Sep 14"}];
 const TVARS={"ticket.number":"INC0004417","ticket.short_description":"Contract Repository search timing out",priority:"2",assignee:"Sam Patel","sla.percent":"82","sla.due":"Tue 17:00","link":"msf.co/i/4417",item:"New laptop",requester:"Priya Shah",approver:"Budget owner"};
 const LOG=[
  {id:"D01",t:"10:58",ev:"e1",who:"Sam Patel",ch:"sms",st:"Delivered",why:""},{id:"D02",t:"10:58",ev:"e1",who:"Sam Patel",ch:"push",st:"Delivered",why:""},
  {id:"D03",t:"10:41",ev:"e4",who:"Avery Chen",ch:"teams",st:"Failed",why:"Teams: user not found in tenant chat service (404). Likely a recent rename.",perm:false},
  {id:"D04",t:"10:41",ev:"e4",who:"Avery Chen",ch:"email",st:"Delivered",why:""},{id:"D05",t:"10:20",ev:"e2",who:"Tom Becker",ch:"teams",st:"Delivered",why:""},
  {id:"D06",t:"10:12",ev:"e8",who:"Dev Rao",ch:"sms",st:"Failed",why:"SMS: carrier rejected the number (invalid). Contact record needs fixing.",perm:true},
  {id:"D07",t:"10:05",ev:"e2",who:"Tom Becker",ch:"teams",st:"Suppressed",why:"Deduplicated: same event and record sent 4 minutes earlier."},
  {id:"D08",t:"09:51",ev:"e3",who:"Jordan Lee",ch:"email",st:"Failed",why:"Email: mailbox full (452 4.2.2). Retry is likely to work in an hour.",perm:false},
  {id:"D09",t:"09:40",ev:"e1",who:"Maya Ortiz",ch:"push",st:"Failed",why:"Push: device token expired. The phone needs to open the app once.",perm:true},
  {id:"D10",t:"09:32",ev:"e5",who:"Priya Shah",ch:"email",st:"Delivered",why:""},{id:"D11",t:"09:15",ev:"e6",who:"Nia Brooks",ch:"teams",st:"Delivered",why:""},
  {id:"D12",t:"06:58",ev:"e10",who:"Nia Brooks",ch:"email",st:"Deferred",why:"Quiet hours (20:00 to 07:00). Held for the 07:00 digest."},{id:"D13",t:"06:41",ev:"e9",who:"Avery Chen",ch:"email",st:"Deferred",why:"Quiet hours (20:00 to 07:00). Held for the 07:00 digest."},
  {id:"D14",t:"Mon 16:44",ev:"e7",who:"Sam Patel",ch:"push",st:"Delivered",why:""},{id:"D15",t:"Mon 16:44",ev:"e7",who:"Jordan Lee",ch:"teams",st:"Delivered",why:""},
  {id:"D16",t:"Mon 15:02",ev:"e4",who:"Maya Ortiz",ch:"teams",st:"Suppressed",why:"Throttled: Maya Ortiz already received 3 notifications in 10 minutes. Rolled into digest."},
  {id:"D17",t:"Mon 14:30",ev:"e3",who:"Tom Becker",ch:"sms",st:"Failed",why:"SMS: carrier timeout (transient).",perm:false},{id:"D18",t:"Mon 14:30",ev:"e3",who:"Tom Becker",ch:"teams",st:"Delivered",why:""}];
 const evN=id=>(EVT.find(e=>e.id===id)||{n:id}).n,chN=c=>(CHN.find(x=>x[0]===c)||[c,c])[1];
