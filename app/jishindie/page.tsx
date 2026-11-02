"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function JishindiePage() {
  const [registered,setRegistered] = useState(0);
  const [contestants,setContestants] = useState<Array<{_id:string;stageName?:string;fullName:string;category:string;entryTitle:string;photograph?:string;voteCount?:number}>>([]);
  const [schedule,setSchedule] = useState<{status:string;registrationEndsAt:string;votingEndsAt:string;nextAnnouncement:string}|null>(null);
  const [now,setNow] = useState(0);

  useEffect(()=>{
    setNow(Date.now());
    const refresh=()=>{
      fetch("/api/jishindie/challenge",{cache:"no-store"})
        .then(r=>r.ok?r.json():null)
        .then(d=>{
          if(d){setRegistered(d.registered||0);setContestants(d.contestants||[]);setSchedule(d.schedule||null)}
        })
        .catch(()=>undefined);
    };
    refresh();
    const dataTimer=window.setInterval(refresh,5000);
    const clockTimer=window.setInterval(()=>setNow(Date.now()),1000);
    return()=>{window.clearInterval(dataTimer);window.clearInterval(clockTimer)};
  },[]);

  const countdownTarget = schedule?.status==="registration"
    ? schedule.registrationEndsAt
    : schedule?.status==="voting" ? schedule.votingEndsAt : null;
  const remaining = countdownTarget ? Math.max(0,new Date(countdownTarget).getTime()-now) : 0;
  const countdownDays = Math.floor(remaining/86400000);
  const countdownHours = Math.floor((remaining%86400000)/3600000);
  const countdownMinutes = Math.floor((remaining%3600000)/60000);
  const countdownSeconds = Math.floor((remaining%60000)/1000);

  async function voteFor(contestantId:string){
    const voterId=window.localStorage.getItem("mw_jishindie_voter");
    const response=await fetch("/api/jishindie/challenge/vote",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({contestantId,voterId}),
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok){
      window.alert(data.error||"Vote could not be recorded.");
      return;
    }
    setContestants(current=>current.map(contestant=>contestant._id===contestantId?{...contestant,voteCount:(contestant.voteCount||0)+1}:contestant));
    window.alert(data.message||"Your vote has been recorded.");
  }
  return (
    <main className="inner-page">
      <header className="inner-page-header"><Link href="/" className="inner-brand"><span>MzimaWells</span> Studios</Link><Link href="/">← Back to home</Link></header>
      <section className="inner-hero section-hero jishindie-hero"><span>WEEKLY CREATOR CHALLENGE</span><h1>Register. Create.<br/>Compete. Get voted.</h1></section>
      <section className="route-content">
        <div className="route-intro"><span>JISHINDIE</span><h2>Show your talent to the world.</h2><p>Open to artists, dancers, filmmakers, fashion creators, comedians, and digital storytellers. Create, submit, and receive votes from the community.</p></div>
        <div className="challenge-live-panel">
          <div>
            <span className="live-pill">{schedule?.status==="voting"?"LIVE VOTING":schedule?.status==="closed"?"CHALLENGE CLOSED":"REGISTRATION OPEN"}</span>
            <h2>{schedule?.status==="voting"?"Voting closes in":schedule?.status==="registration"?"Registration closes in":"Next challenge countdown"}</h2>
            <p>{schedule?.nextAnnouncement||"Loading this week's challenge schedule..."}</p>
          </div>
          <div className="countdown" aria-label="Challenge countdown">
            {[["Days",countdownDays],["Hours",countdownHours],["Minutes",countdownMinutes],["Seconds",countdownSeconds]].map(([label,value])=><div key={String(label)}><strong>{String(value).padStart(2,"0")}</strong><span>{label}</span></div>)}
          </div>
        </div>
        <div className="stats"><div><strong>{registered}</strong><span>Registered creators</span></div><div><strong>KSH 100</strong><span>Registration fee</span></div><div><strong>Sunday</strong><span>Challenge day</span></div></div>
        <div className="jishindie-info-grid">
          <article><span>SCHEDULE</span><h3>This week's dates</h3><p><b>Registration:</b> opens Sunday-to-Sunday until 8:00 AM EAT.</p><p><b>Voting:</b> Sunday 8:00 AM to 9:00 PM EAT.</p><p><b>Winner:</b> announced after voting closes and the winner is contacted.</p></article>
          <article><span>CHALLENGE GIFTS</span><h3>Challenge prizes</h3><p><b>Winner:</b> official MzimaWells challenge gift.</p><p><b>Runner-up:</b> fan recognition and studio spotlight.</p><p><b>Fan favourite:</b> MzimaWells branded reward.</p></article>
          <article><span>ANNOUNCEMENTS</span><h3>Latest update</h3><p>{schedule?.nextAnnouncement||"Challenge announcements will appear here."}</p><p>Only approved contestants appear in the live voting list.</p></article>
        </div>
        <div className="route-title"><span>WINNERS</span><h2>Jishindie Winners</h2></div>
        <div className="team-page-grid team-page-winners">{[
          ["Academician Kibet OGW","Jishindie Winner","/crew/academician-kibet.jpeg"],
          ["Ann Cheroo","Jishindie Winner","/crew/ann-cheroo.jpeg"],
          ["Caleb Junior","Jishindie Winner","/crew/caleb-junior.jpeg"],
        ].map(([name,role,photo])=><article key={name}><img src={photo} alt={name}/><h3>{name}</h3><p>{role}</p></article>)}</div>
        <div className="route-title"><span>CONTESTANTS</span><h2>Approved entries</h2></div>
        {contestants.length?<div className="contestant-grid">{[...contestants].sort((a,b)=>(b.voteCount||0)-(a.voteCount||0)).map((contestant,index)=><article className="contestant-card" key={contestant._id}><div className="contestant-avatar">{contestant.photograph?<img src={contestant.photograph} alt={contestant.stageName||contestant.fullName}/>:String(index+1).padStart(2,"0")}</div><span>{contestant.category}</span><h4>{contestant.stageName||contestant.fullName}</h4><p>{contestant.entryTitle}</p><div className="vote-row"><strong>{contestant.voteCount||0} votes</strong><button onClick={()=>voteFor(contestant._id)} disabled={schedule?.status==="registration"}>{schedule?.status==="registration"?"Voting opens at 8 AM":"Vote"}</button></div></article>)}</div>:<div className="empty-contestants"><b>Contestants are being reviewed.</b><p>Approved entries will appear here before voting opens.</p></div>}
        <div className="route-title"><span>PAST WINNERS</span><h2>Creator hall of fame</h2></div>
        <div className="past-winners-grid">
          {[["Academician Kibet OGW","Challenge Winner"],["Ann Cheroo","Challenge Winner"],["Caleb Junior","Challenge Winner"]].map(([name,award])=><article key={name}><b>JISHINDIE</b><h3>{name}</h3><p>{award}</p></article>)}
        </div>
        <div className="route-title"><span>HOW TO TAKE PART</span><h2>From registration to winner</h2></div>
        <div className="steps">{[
          ["Register","Register on the platform and pay the registration fee of Ksh 100."],
          ["Share","After registration, share your link with fans, platform members, and supporters."],
          ["Registration closes","Registration starts on any day and closes Sunday at 8:00 AM. At 8:00 AM, the challenge begins."],
          ["Challenge ends","The challenge runs until 9:00 PM on Sunday evening."],
          ["Winner announced","The winner is announced, contacted, and receives the challenge gift."],
        ].map(([title,copy],index)=><article key={title}><b>{index+1}</b><div><h4>{title}</h4><p>{copy}</p></div></article>)}</div>
        <div className="join-team-page"><span>TAKE PART</span><h2>Ready to enter the challenge?</h2><Link href="/#jishindie">Register from the challenge page →</Link></div>
      </section>
    </main>
  );
}
