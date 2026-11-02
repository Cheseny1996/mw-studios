"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

export default function JishindiePage() {
  const [registered,setRegistered] = useState(0);
  const [contestants,setContestants] = useState<Array<{_id:string;stageName?:string;fullName:string;category:string;entryTitle:string;photograph?:string;voteCount?:number}>>([]);
  const [schedule,setSchedule] = useState<{status:string;registrationEndsAt:string;votingEndsAt:string;nextAnnouncement:string}|null>(null);
  const [now,setNow] = useState(0);
  const [totalVotes,setTotalVotes] = useState(0);
  const [entries,setEntries] = useState<Array<{_id:string;fullName:string;stageName:string;category:string;status:string;photograph:string}>>([]);
  const [registrationOpen,setRegistrationOpen] = useState(false);
  const [photoPreview,setPhotoPreview] = useState("");
  const [registrationNotice,setRegistrationNotice] = useState("");

  useEffect(()=>{
    setNow(Date.now());
    const refresh=()=>{
      fetch("/api/jishindie/challenge",{cache:"no-store"})
        .then(r=>r.ok?r.json():null)
        .then(d=>{
          if(d){setRegistered(d.registered||0);setContestants(d.contestants||[]);setEntries(d.entries||[]);setTotalVotes(d.totalVotes||0);setSchedule(d.schedule||null)}
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
  function previewPhoto(file?: File) {
    if (!file) { setPhotoPreview(""); return; }
    if (file.size > 750 * 1024) { setRegistrationNotice("Please choose a profile photo smaller than 750 KB."); return; }
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(String(reader.result || ""));
    reader.readAsDataURL(file);
  }
  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const body = Object.fromEntries(formData.entries());
    body.photograph = photoPreview;
    setRegistrationNotice("");
    const response = await fetch("/api/jishindie/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setRegistrationNotice(data.error || "Registration could not be completed."); return; }
    setRegistrationNotice("Registration submitted. Your entry is awaiting approval.");
    form.reset();
    setPhotoPreview("");
  }
  return (
    <main className="inner-page">
      <header className="inner-page-header"><Link href="/" className="inner-brand"><span>MzimaWells</span> Studios</Link><Link href="/">← Back to home</Link></header>
      <section className="inner-hero section-hero jishindie-hero"><span>WEEKLY CREATOR CHALLENGE</span><h1>Register. Create.<br/>Compete. Get voted.</h1></section>
      <section className="route-content">
        <button className="route-primary-action" type="button" onClick={()=>setRegistrationOpen(true)} disabled={schedule?.status!=="registration"}>{schedule?.status==="registration"?"Register for Jishindie":"Registration closed"}</button>
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
        <div className="stats"><div><strong>{registered}</strong><span>Registered creators</span></div><div><strong>{totalVotes}</strong><span>Votes cast</span></div><div><strong>{contestants.length}</strong><span>Approved contestants</span></div><div><strong>KSH 100</strong><span>Registration fee</span></div></div>
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
        <div className="route-title"><span>LIVE DASHBOARD</span><h2>Everyone registered</h2></div>
        {entries.length ? (
          <div className="registered-grid">
            {[...entries].map((entry)=>(
              <article key={entry._id} className={`registered-card registered-${entry.status}`}>
                <div className="registered-avatar">{entry.photograph?<img src={entry.photograph} alt={entry.stageName||entry.fullName}/>:<span>{(entry.stageName||entry.fullName).slice(0,1).toUpperCase()}</span>}</div>
                <div><h4>{entry.stageName||entry.fullName}</h4><p>{entry.category} · {entry.status}</p></div>
              </article>
            ))}
          </div>
        ) : <div className="empty-contestants"><b>No registrations yet.</b><p>New creators will appear here when they register.</p></div>}
        <div className="route-title"><span>CONTESTANTS</span><h2>Approved live leaderboard</h2></div>
        {contestants.length?<div className="contestant-grid">{[...contestants].sort((a,b)=>(b.voteCount||0)-(a.voteCount||0)).map((contestant,index)=><article className="contestant-card" key={contestant._id}><div className="leaderboard-rank">#{index+1}</div><div className="contestant-avatar">{contestant.photograph?<img src={contestant.photograph} alt={contestant.stageName||contestant.fullName}/>:String(index+1).padStart(2,"0")}</div><span>{contestant.category}</span><h4>{contestant.stageName||contestant.fullName}</h4><p>{contestant.entryTitle}</p><div className="vote-row"><strong>{contestant.voteCount||0} votes</strong><button onClick={()=>voteFor(contestant._id)} disabled={schedule?.status!=="voting"}>{schedule?.status==="voting"?"Vote now":schedule?.status==="registration"?"Voting opens at 8 AM":"Voting closed"}</button></div></article>)}</div>:<div className="empty-contestants"><b>Contestants are being reviewed.</b><p>Approved entries will appear here before voting opens.</p></div>}
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
        <div className="join-team-page"><span>TAKE PART</span><h2>Ready to enter the challenge?</h2><button type="button" onClick={()=>setRegistrationOpen(true)} disabled={schedule?.status!=="registration"}>{schedule?.status==="registration"?"Register for Jishindie →":"Registration closed"}</button></div>
      </section>
      {registrationOpen && (
        <div className="challenge-modal" role="dialog" aria-modal="true" aria-label="Register for Jishindie">
          <div className="challenge-modal-card">
            <button className="challenge-modal-close" type="button" aria-label="Close registration" onClick={()=>setRegistrationOpen(false)}>×</button>
            <span>JISHINDIE REGISTRATION</span>
            <h2>Enter this week's challenge</h2>
            <form onSubmit={submitRegistration} className="challenge-registration-form">
              <div className="challenge-form-grid">
                <label>Full name<input name="fullName" required /></label>
                <label>Stage / creator name<input name="stageName" /></label>
                <label>Email<input name="email" type="email" required /></label>
                <label>Phone number<input name="phone" type="tel" required /></label>
                <label>Category<select name="category" required><option value="music">Music</option><option value="dance">Dance</option><option value="film">Film</option><option value="fashion">Fashion</option><option value="comedy">Comedy</option><option value="content">AI / ML / Data Analyst</option></select></label>
                <label>Entry title<input name="entryTitle" required /></label>
                <label className="full-field">Entry link<input name="entryLink" type="url" placeholder="https://youtube.com/..." /></label>
                <label className="full-field">Profile photo<input name="photograph" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event)=>previewPhoto(event.currentTarget.files?.[0])}/></label>
                {photoPreview && <div className="photo-preview full-field"><img src={photoPreview} alt="Profile preview"/></div>}
              </div>
              <p className="challenge-fee-note">Registration fee: Ksh 100</p>
              <button className="submit-registration" type="submit">Submit entry</button>
            </form>
            {registrationNotice && <p className="challenge-notice" role="status">{registrationNotice}</p>}
          </div>
        </div>
      )}
    </main>
  );
}
