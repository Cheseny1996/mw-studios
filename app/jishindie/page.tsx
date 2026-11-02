"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function JishindiePage() {
  const [registered,setRegistered] = useState(0);
  const [contestants,setContestants] = useState<Array<{_id:string;stageName?:string;fullName:string;category:string;entryTitle:string;photograph?:string;voteCount?:number}>>([]);
  useEffect(()=>{fetch("/api/jishindie/challenge").then(r=>r.ok?r.json():null).then(d=>{if(d){setRegistered(d.registered||0);setContestants(d.contestants||[])}}).catch(()=>undefined)},[]);
  return (
    <main className="inner-page">
      <header className="inner-page-header"><Link href="/" className="inner-brand">MzimaWells Studios</Link><Link href="/">← Back to home</Link></header>
      <section className="inner-hero section-hero jishindie-hero"><span>WEEKLY CREATOR CHALLENGE</span><h1>Register. Create.<br/>Compete. Get voted.</h1></section>
      <section className="route-content">
        <div className="route-intro"><span>JISHINDIE</span><h2>Show your talent to the world.</h2><p>Open to artists, dancers, filmmakers, fashion creators, comedians, and digital storytellers. Create, submit, and receive votes from the community.</p></div>
        <div className="stats"><div><strong>{registered}</strong><span>Registered creators</span></div><div><strong>3</strong><span>Prize tiers</span></div><div><strong>KSH</strong><span>Cash rewards</span></div></div>
        <div className="route-prizes">{[["01","Grand Prize","MzimaWells feature + branded merchandise"],["02","Runner Up","Branded hoodie + studio access"],["03","Fan Favourite","Branded mug + T-shirt"]].map(([number,title,copy])=><article key={title}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
        <div className="route-title"><span>CONTESTANTS</span><h2>Approved entries</h2></div>
        {contestants.length?<div className="contestant-grid">{[...contestants].sort((a,b)=>(b.voteCount||0)-(a.voteCount||0)).map((contestant,index)=><article className="contestant-card" key={contestant._id}><div className="contestant-avatar">{contestant.photograph?<img src={contestant.photograph} alt={contestant.stageName||contestant.fullName}/>:String(index+1).padStart(2,"0")}</div><span>{contestant.category}</span><h4>{contestant.stageName||contestant.fullName}</h4><p>{contestant.entryTitle}</p><div className="vote-row"><strong>{contestant.voteCount||0} votes</strong><Link href="/">Vote</Link></div></article>)}</div>:<div className="empty-contestants"><b>Contestants are being reviewed.</b><p>Approved entries will appear here before voting opens.</p></div>}
        <div className="join-team-page"><span>TAKE PART</span><h2>Ready to enter the challenge?</h2><Link href="/#jishindie">Register from the challenge page →</Link></div>
      </section>
    </main>
  );
}
