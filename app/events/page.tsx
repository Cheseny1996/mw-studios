"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const fallback = [
  ["Plat4m Podcast Live Recording","January 22, 2025","7:00 PM - 9:00 PM","City Hall, Nairobi","Be part of a live podcast recording with special guests.","event"],
  ["Jishindie Challenge Finals","February 5, 2025","4:00 PM - 8:00 PM","National Theatre, Nairobi","Watch the top finalists compete for the grand prize.","jishindie"],
  ["Creative Minds Workshop","February 15, 2025","2:00 PM - 6:00 PM","MzimaWells Studios, Nairobi","Learn practical content creation and digital storytelling skills.","workshop"],
] as const;

export default function EventsPage() {
  const [events,setEvents] = useState<Array<{_id:string;title:string;date:string;time?:string;location?:string;description?:string;registrationCount?:number}>>([]);
  const [notice,setNotice] = useState("");
  useEffect(()=>{fetch("/api/public/events").then(r=>r.ok?r.json():null).then(d=>setEvents(d?.events||[])).catch(()=>setEvents([]));},[]);

  async function register(eventId:string) {
    const response=await fetch("/api/events/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eventId})});
    const data=await response.json().catch(()=>({}));
    setNotice(data.error||data.message||"Registration status unavailable.");
  }
  return (
    <main className="inner-page">
      <header className="inner-page-header"><Link href="/" className="inner-brand">MzimaWells Studios</Link><Link href="/">← Back to home</Link></header>
      <section className="inner-hero section-hero events-hero"><span>LIVE & IN PERSON</span><h1>Moments made to<br/>bring people together.</h1></section>
      <section className="route-content"><div className="route-title"><span>UPCOMING</span><h2>Events at MzimaWells</h2></div>{notice&&<p className="challenge-notice">{notice}</p>}
        <div className="events-page-grid">
          {events.length ? events.map((event,index)=><article key={event._id}><div className={`route-event-art event-tone-${index%3}`}><span>{new Date(event.date).toLocaleDateString("en-GB",{day:"2-digit",month:"short"})}</span></div><div><h3>{event.title}</h3><p>{event.description}</p><ul><li>{event.time||"Time to be confirmed"}</li><li>{event.location||"MzimaWells Studios, Nairobi"}</li><li>{event.registrationCount||0} registered</li></ul><button className="route-cta route-button" onClick={()=>register(event._id)}>Register for event</button></div></article>) : fallback.map(([title,date,time,location,copy],index)=><article key={title}><div className={`route-event-art event-tone-${index}`}><span>{date.split(" ")[0]+" "+date.split(" ")[1]}</span></div><div><h3>{title}</h3><p>{copy}</p><ul><li>{time}</li><li>{location}</li></ul><Link className="route-cta route-button" href="/#events">View registration details</Link></div></article>)}
        </div>
      </section>
    </main>
  );
}
