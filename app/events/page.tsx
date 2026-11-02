"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

type RunContestant = { _id: string; stageName?: string; fullName: string; category: string; entryTitle: string; photograph?: string; voteCount?: number };
type RunChallenge = { schedule?: { status: string; nextAnnouncement?: string }; registered?: number; totalVotes?: number; contestants?: RunContestant[] };

const kapsokwonyMedia = [
  ["Official Kapsokwony run poster", "/media/kapsokwony-run/official-run-poster.jpg"],
  ["Race prizes and awards", "/media/kapsokwony-run/prize-details.jpg"],
  ["Run sponsors and partners", "/media/kapsokwony-run/sponsors-and-route.jpg"],
  ["Community partners", "/media/kapsokwony-run/partners-overview.jpg"],
] as const;

const fallback = [
  ["Kapsokwony Annual Run","Annual event","See event schedule","Kapsokwony, Kenya","The famous annual Kapsokwony Run community event.","event"],
  ["Silas Chai Music Launch","November 2024","Date and venue details to be announced","Kenya","Silas Chai music launch event.","music"],
  ["Arap Koko Music Launch","2025","Time to be confirmed","Kenya","Arap Koko music launch event.","music"],
  ["Mbuzi Party","2025","Time to be confirmed","Nairobi, Kenya","Mbuzi Party in Nairobi.","party"],
  ["Mbuzi Party","2026","Time to be confirmed","Nairobi, Kenya","Mbuzi Party in Nairobi.","party"],
  ["Career Talk","Date to be announced","Time to be confirmed","Kapsokwony, Kenya","Career Talk and community guidance session.","career"],
  ["Moses Kibe Music Launch","14 November 2026","Time to be confirmed","Kitum, Endebes, Kenya","Upcoming Moses Kibe music launch.","music"],
] as const;

export default function EventsPage() {
  const [events,setEvents] = useState<Array<{_id:string;title:string;date:string;time?:string;location?:string;description?:string;registrationCount?:number;displayDate?:string}>>([]);
  const [notice,setNotice] = useState("");
  const [runChallenge,setRunChallenge] = useState<RunChallenge|null>(null);
  const [runRegistrationOpen,setRunRegistrationOpen] = useState(false);
  const [runVoterId,setRunVoterId] = useState("");
  const [runNotice,setRunNotice] = useState("");
  useEffect(()=>{
    const runEvent = {
      _id: "kapsokwony-annual-run",
      title: "Kapsokwony Annual Run",
      date: "2026-12-15T00:00:00.000Z",
      time: "See event schedule",
      location: "Kapsokwony, Kenya",
      description: "The famous annual Kapsokwony Run community event.",
      registrationCount: 0,
    };
    const fallbackEvents = fallback.map(([title,date,time,location,copy],index)=>({
      _id: `event-${index}`,
      title,
      date: date.includes("2026") ? "2026-11-14T00:00:00.000Z" : "2026-01-01T00:00:00.000Z",
      time,
      location,
      description: copy,
      registrationCount: 0,
      displayDate: date,
    })).filter((event)=>event.title !== "Kapsokwony Annual Run");
    fetch("/api/public/events")
      .then(r=>r.ok?r.json():null)
      .then(d=>{
        const published = Array.isArray(d?.events)
          ? d.events.filter((event:{title?:string})=>event.title !== "Kapsokwony Annual Run")
          : [];
        setEvents([runEvent, ...published, ...fallbackEvents.filter((item)=>!published.some((event:{title?:string})=>event.title===item.title))]);
      })
      .catch(()=>setEvents([runEvent,...fallbackEvents]));
    const refreshRun = () => fetch("/api/jishindie/challenge?challenge=kapsokwony-annual-run")
      .then((response)=>response.ok?response.json():null)
      .then((data)=>{ if (data) setRunChallenge(data); })
      .catch(()=>{});
    const savedVoterId = window.localStorage.getItem("mw_jishindie_voter");
    if (savedVoterId) window.setTimeout(()=>setRunVoterId(savedVoterId),0);
    refreshRun();
    const timer=window.setInterval(refreshRun,5000);
    return ()=>window.clearInterval(timer);
  },[]);

  async function register(eventId:string) {
    const response=await fetch("/api/events/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eventId})});
    const data=await response.json().catch(()=>({}));
    setNotice(data.error||data.message||"Registration status unavailable.");
  }

  async function registerRun(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form=new FormData(event.currentTarget);
    const photograph=(form.get("photograph") as string)||"";
    const response=await fetch("/api/jishindie/challenge",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        challengeSlug:"kapsokwony-annual-run",
        fullName:form.get("fullName"),
        stageName:form.get("stageName"),
        email:form.get("email"),
        phone:form.get("phone"),
        category:form.get("category"),
        entryTitle:form.get("entryTitle"),
        entryLink:form.get("entryLink"),
        photograph,
      }),
    });
    const data=await response.json().catch(()=>({}));
    setRunNotice(data.error||data.message||"Registration status unavailable.");
    if (data.success) {
      setRunVoterId(data.voterId||runVoterId);
      if (data.voterId) window.localStorage.setItem("mw_jishindie_voter",data.voterId);
      setRunRegistrationOpen(false);
    }
  }

  async function voteRun(contestantId:string) {
    const response=await fetch("/api/jishindie/challenge/vote",{
      method:"POST",
      headers:{"Content-Type":"application/json","x-mzima-voter-id":runVoterId},
      body:JSON.stringify({contestantId,challengeSlug:"kapsokwony-annual-run",voterId:runVoterId||undefined}),
    });
    const data=await response.json().catch(()=>({}));
    if (data.requiresRegistration) setRunRegistrationOpen(true);
    setRunNotice(data.error||data.message||"Vote status unavailable.");
  }

  return (
    <main className="inner-page">
      <header className="inner-page-header"><Link href="/" className="inner-brand"><span>MzimaWells</span> Studios</Link><Link href="/">← Back to home</Link></header>
      <section className="inner-hero section-hero events-hero"><span>LIVE & IN PERSON</span><h1>Moments made to<br/>bring people together.</h1></section>
      <section className="route-content run-challenge-section">
        <div className="route-title"><span>KAPSOKWONY RUN / LIVE CHALLENGE</span><h2>Run, register, vote in real time.</h2></div>
        <div className="challenge-live-panel">
          <div><span className="live-pill">{runChallenge?.schedule?.status==="voting"?"LIVE VOTING":runChallenge?.schedule?.status==="closed"?"CHALLENGE CLOSED":"REGISTRATION OPEN"}</span><h2>Kapsokwony K-Run Challenge</h2><p>{runChallenge?.schedule?.nextAnnouncement||"Loading live event details..."}</p></div>
          <div className="stats"><div><strong>{runChallenge?.registered||0}</strong><span>Registered contestants</span></div><div><strong>{runChallenge?.totalVotes||0}</strong><span>Votes cast</span></div><div><strong>{runChallenge?.contestants?.length||0}</strong><span>Approved contestants</span></div></div>
        </div>
        {runNotice&&<p className="challenge-notice">{runNotice}</p>}
        <div className="run-challenge-actions"><button className="route-primary-action" onClick={()=>setRunRegistrationOpen(true)} disabled={runChallenge?.schedule?.status==="closed"||runChallenge?.schedule?.status==="voting"}>Register for K-Run challenge</button><Link className="route-primary-action" href="/jishindie">Open voting platform</Link></div>
        {runChallenge?.contestants?.length?<div className="contestant-grid">{[...runChallenge.contestants].sort((a,b)=>(b.voteCount||0)-(a.voteCount||0)).map((contestant,index)=><article className="contestant-card" key={contestant._id}><div className="leaderboard-rank">#{index+1}</div><div className="contestant-avatar">{contestant.photograph?<img src={contestant.photograph} alt={contestant.stageName||contestant.fullName}/>:<span>{String(index+1).padStart(2,"0")}</span>}</div><span>Kapsokwony Run · {contestant.category}</span><h4>{contestant.stageName||contestant.fullName}</h4><p>{contestant.entryTitle}</p><div className="vote-row"><strong>{contestant.voteCount||0} votes</strong><button onClick={()=>voteRun(contestant._id)} disabled={runChallenge?.schedule?.status!=="voting"}>Vote now</button></div></article>)}</div>:<div className="empty-contestants"><b>Contestants are being reviewed.</b><p>Approved entries and live vote totals will appear here.</p></div>}
        <div className="route-title kapsokwony-gallery-title"><span>EVENT INFORMATION</span><h2>Kapsokwony Run posters and details</h2><p>Race information, awards, and participating partners.</p></div>
        <div className="run-media-gallery">{kapsokwonyMedia.map(([title,image])=><figure key={image}><Image src={image} alt={title} width={768} height={960}/><figcaption>{title}</figcaption></figure>)}</div>
      </section>
      <section className="route-content"><div className="route-title"><span>UPCOMING</span><h2>Events at MzimaWells</h2></div>{notice&&<p className="challenge-notice">{notice}</p>}
        <div className="events-page-grid">
          {events.map((event,index)=><article key={event._id}><div className={`route-event-art event-tone-${index%3}`}>{event.title.includes("Mbuzi Party")&&<Image src="/media/events/mbuzi-party-ticket.jpg" alt="Mbuzi Party event ticket" width={768} height={1024}/>}<span>{event.displayDate || new Date(event.date).toLocaleDateString("en-GB",{day:"2-digit",month:"short"})}</span></div><div><h3>{event.title}</h3><p>{event.description}</p><ul><li>{event.time||"Time to be confirmed"}</li><li>{event.location||"MzimaWells Studios, Nairobi"}</li><li>{event.registrationCount||0} registered</li></ul>{event._id.startsWith("event-")||event._id==="kapsokwony-annual-run"?<Link className="route-cta route-button" href="/#events">View event details</Link>:<button className="route-cta route-button" onClick={()=>register(event._id)}>Register for event</button>}</div></article>)}
        </div>
      </section>
      {runRegistrationOpen&&<div className="challenge-modal" role="dialog" aria-modal="true"><div className="challenge-modal-card"><button className="challenge-modal-close" type="button" aria-label="Close" onClick={()=>setRunRegistrationOpen(false)}>×</button><span>KAPSOKWONY K-RUN</span><h2>Register for the challenge</h2><form className="challenge-registration-form" onSubmit={registerRun}><div className="challenge-form-grid"><label>Full name<input name="fullName" required /></label><label>Stage / creator name<input name="stageName" /></label><label>Email<input name="email" type="email" required /></label><label>Phone number<input name="phone" type="tel" required /></label><label>Category<select name="category" required><option value="music">Music</option><option value="dance">Dance</option><option value="film">Film</option><option value="fashion">Fashion</option><option value="comedy">Comedy</option><option value="content">AI / ML / Data Analyst</option></select></label><label>Entry title<input name="entryTitle" required /></label><label className="full-field">Entry link<input name="entryLink" type="url" placeholder="https://" /></label></div><button className="submit-registration" type="submit">Submit K-Run entry</button></form></div></div>}
    </main>
  );
}
