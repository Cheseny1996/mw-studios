"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function JishindiePage() {
  const [registered,setRegistered] = useState(0);
  const [contestants,setContestants] = useState<Array<{_id:string;stageName?:string;fullName:string;category:string;entryTitle:string;photograph?:string;voteCount?:number}>>([]);
  useEffect(()=>{fetch("/api/jishindie/challenge").then(r=>r.ok?r.json():null).then(d=>{if(d){setRegistered(d.registered||0);setContestants(d.contestants||[])}}).catch(()=>undefined)},[]);
  return (
    <main className="inner-page">
      <header className="inner-page-header"><Link href="/" className="inner-brand"><span>MzimaWells</span> Studios</Link><Link href="/">← Back to home</Link></header>
      <section className="inner-hero section-hero jishindie-hero"><span>WEEKLY CREATOR CHALLENGE</span><h1>Register. Create.<br/>Compete. Get voted.</h1></section>
      <section className="route-content">
        <div className="route-intro"><span>JISHINDIE</span><h2>Show your talent to the world.</h2><p>Open to artists, dancers, filmmakers, fashion creators, comedians, and digital storytellers. Create, submit, and receive votes from the community.</p></div>
        <div className="stats"><div><strong>{registered}</strong><span>Registered creators</span></div><div><strong>KSH 100</strong><span>Registration fee</span></div><div><strong>Sunday</strong><span>Challenge day</span></div></div>
        <div className="route-title"><span>WINNERS</span><h2>Jishindie Winners</h2></div>
        <div className="team-page-grid team-page-winners">{[
          ["Academician Kibet OGW","Jishindie Winner","/crew/academician-kibet.jpeg"],
          ["Ann Cheroo","Jishindie Winner","/crew/ann-cheroo.jpeg"],
          ["Caleb Junior","Jishindie Winner","/crew/caleb-junior.jpeg"],
        ].map(([name,role,photo])=><article key={name}><img src={photo} alt={name}/><h3>{name}</h3><p>{role}</p></article>)}</div>
        <div className="route-title"><span>CONTESTANTS</span><h2>Approved entries</h2></div>
        {contestants.length?<div className="contestant-grid">{[...contestants].sort((a,b)=>(b.voteCount||0)-(a.voteCount||0)).map((contestant,index)=><article className="contestant-card" key={contestant._id}><div className="contestant-avatar">{contestant.photograph?<img src={contestant.photograph} alt={contestant.stageName||contestant.fullName}/>:String(index+1).padStart(2,"0")}</div><span>{contestant.category}</span><h4>{contestant.stageName||contestant.fullName}</h4><p>{contestant.entryTitle}</p><div className="vote-row"><strong>{contestant.voteCount||0} votes</strong><Link href="/">Vote</Link></div></article>)}</div>:<div className="empty-contestants"><b>Contestants are being reviewed.</b><p>Approved entries will appear here before voting opens.</p></div>}
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
