"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

const news = [
  ["Kapsokwony Annual Run Announced", "December 15, 2024", "MzimaWells Studios shares details for the famous annual Kapsokwony Run community event.", true],
  ["Jishindie Challenge Winners Announced", "December 10, 2024", "Congratulations to all the talented creators who participated in this season's competition.", true],
  ["Behind the Scenes: Latest Music Video Production", "December 5, 2024", "Take a look at our creative process for the latest music video project.", false],
  ["Community Outreach Program Success", "November 28, 2024", "Our recent community engagement initiative reached over 500 young creatives.", false],
  ["New Studio Equipment Upgrade", "November 20, 2024", "We invested in state-of-the-art equipment to deliver even better quality content.", false],
  ["Upcoming Events Calendar Released", "November 15, 2024", "Mark your calendars for our exciting lineup of events in the coming months.", false],
] as const;

const newsStories: Record<string, string[]> = {
  "Kapsokwony Annual Run Announced": [
    "The K-Run is MzimaWells Studios' event identity for the famous annual Kapsokwony Run.",
    "Community updates, participating details, and event announcements will be published on the Events page.",
  ],
  "Jishindie Challenge Winners Announced": [
    "The latest Jishindie Challenge season has celebrated talented creators from across participating categories.",
    "Community voting played a central role in recognising finalists, fan favourites, and standout entries across the season.",
  ],
  "Behind the Scenes: Latest Music Video Production": [
    "The newest MzimaWells music video production showcases the planning, filming, editing, and creative collaboration that happen behind the camera.",
    "From production design to final colour and sound, the team worked to deliver an authentic visual story.",
  ],
  "Community Outreach Program Success": [
    "MzimaWells Studios recently connected with more than 500 young creatives through community engagement activities designed to inspire participation in film, media, music, podcasting, and digital storytelling.",
    "The programme created opportunities for young people to learn, share ideas, meet creative professionals, and discover practical pathways into the creative industry.",
  ],
  "New Studio Equipment Upgrade": [
    "MzimaWells Studios has expanded its production capabilities with upgraded equipment for filming, editing, audio capture, lighting, and post-production.",
    "The investment supports higher-quality music videos, podcasts, documentaries, and live creative productions.",
  ],
  "Upcoming Events Calendar Released": [
    "MzimaWells Studios has published its upcoming calendar of live recordings, workshops, community events, competitions, and creative programmes.",
    "Visitors can use the Events section to follow upcoming activities and registration announcements.",
  ],
};

const episodes = [
  ["The Future of African Entertainment", "December 18, 2024", "45:30", "Join us as we explore the rapidly evolving entertainment landscape across Africa."],
  ["Creative Entrepreneurship with Local Artists", "December 11, 2024", "38:15", "Inspiring conversations with artists who are building successful creative businesses."],
  ["Behind the Mic: Producer Stories", "December 4, 2024", "52:20", "Top music producers share their journey and creative process."],
  ["Youth and Digital Media", "November 27, 2024", "41:45", "How young creators are using digital platforms to amplify their voices."],
  ["The Power of Community in Content Creation", "November 20, 2024", "47:10", "Building authentic connections through content and community engagement."],
  ["From Studio to Screen: Film Production Insights", "November 13, 2024", "55:30", "Industry professionals discuss the art and business of film production."],
] as const;

const events = [
  ["Plat4m Podcast Live Recording", "January 22, 2025", "7:00 PM - 9:00 PM", "City Hall, Nairobi", "Be part of our live podcast recording with special celebrity guests.", 120],
  ["Weekly Jishindie T-Shirt Challenge - Season 3 Round 5", "January 25, 2025", "8:00 AM - 8:59 PM", "Online / MzimaWells Studios", "Teams compete for recognition and prizes. Team Fearless Force leads with 4005 votes!", 500],
  ["Jishindie Challenge Finals", "February 5, 2025", "4:00 PM - 8:00 PM", "National Theater, Nairobi", "Watch the top finalists compete for the grand prize in our creative competition.", 250],
  ["Creative Minds Workshop", "February 15, 2025", "2:00 PM - 6:00 PM", "MzimaWells Studios, Nairobi", "An interactive workshop on content creation and digital storytelling.", 45],
] as const;

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginMenuOpen, setLoginMenuOpen] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [challengeNotice, setChallengeNotice] = useState("");
  const [selectedNews, setSelectedNews] = useState<string | null>(null);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [contestants, setContestants] = useState<Array<{ _id: string; stageName?: string; fullName: string; category: string; entryTitle: string; photograph?: string; voteCount?: number }>>([]);
  const [challengeSchedule, setChallengeSchedule] = useState<{status:string;registrationEndsAt:string;votingEndsAt:string;nextAnnouncement:string}|null>(null);
  const [challengeNow, setChallengeNow] = useState(0);
  useEffect(() => {
    setChallengeNow(Date.now());
    const refreshChallenge=()=>{
      fetch("/api/jishindie/challenge",{cache:"no-store"})
        .then((response) => response.ok ? response.json() : null)
        .then((data) => {
          if (!data) return;
          setRegisteredCount(data.registered ?? 0);
          setContestants(data.contestants ?? []);
          setChallengeSchedule(data.schedule ?? null);
        })
        .catch(() => undefined);
    };
    refreshChallenge();
    const challengeDataTimer=window.setInterval(refreshChallenge,5000);
    const challengeClockTimer=window.setInterval(()=>setChallengeNow(Date.now()),1000);
    return()=>{window.clearInterval(challengeDataTimer);window.clearInterval(challengeClockTimer)};
  }, []);

  useEffect(() => {
    if (!loginMenuOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest(".mw-login-menu")) setLoginMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLoginMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [loginMenuOpen]);

  async function registerForChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form));
    const photoInput = form.elements.namedItem("photograph") as HTMLInputElement;
    const photo = photoInput.files?.[0];
    if (photo) {
      if (photo.size > 750_000) {
        setChallengeNotice("Please choose a profile photo smaller than 750 KB.");
        return;
      }
      payload.photograph = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Photo could not be read."));
        reader.readAsDataURL(photo);
      }).catch(() => "");
    }
    setChallengeNotice("Submitting your registration...");
    const response = await fetch("/api/jishindie/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setChallengeNotice(data.error || "Registration could not be completed.");
      return;
    }
    setChallengeNotice(data.message || "Registration received.");
    if (data.voterId) localStorage.setItem("mw_jishindie_voter", data.voterId);
    setRegisteredCount((count) => count + 1);
    form.reset();
  }

  function openChallengeRegistration() {
    setRegistrationOpen(true);
    setChallengeNotice("Complete your challenge registration below.");
  }

  async function voteForContestant(contestantId: string) {
    const voterId = localStorage.getItem("mw_jishindie_voter");
    if (!voterId) {
      setChallengeNotice("Register for the challenge before voting for a contestant.");
      openChallengeRegistration();
      return;
    }
    const response = await fetch("/api/jishindie/challenge/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contestantId, voterId }),
    });
    const data = await response.json().catch(() => ({}));
    setChallengeNotice(data.error || data.message || "Vote status unavailable.");
    if (response.ok) {
      setContestants((current) => current.map((contestant) => contestant._id === contestantId
        ? { ...contestant, voteCount: (contestant.voteCount ?? 0) + 1 }
        : contestant));
    }
  }
  const nav = [
    ["Blog", "/blog"],
    ["Events", "/events"],
    ["Jishindie", "/jishindie"],
    ["Careers", "/careers"],
    ["About", "/about"],
    ["Team", "/team"],
    ["Home", "#home"],
  ];
  const countdownTarget=challengeSchedule?.status==="registration"
    ?challengeSchedule.registrationEndsAt
    :challengeSchedule?.status==="voting"?challengeSchedule.votingEndsAt:null;
  const countdownRemaining=countdownTarget?Math.max(0,new Date(countdownTarget).getTime()-challengeNow):0;
  const countdown=[Math.floor(countdownRemaining/86400000),Math.floor((countdownRemaining%86400000)/3600000),Math.floor((countdownRemaining%3600000)/60000),Math.floor((countdownRemaining%60000)/1000)];

  return (
    <div className="mw-site">
      <header className="mw-header">
        <a className="mw-brand" href="#home" aria-label="MzimaWells Studios">
          <Image src="/mzima-wells-logo.png" alt="" width={44} height={44} priority />
          <h1><span>MzimaWells</span> Studios</h1>
        </a>
        <nav className={menuOpen ? "mw-nav open" : "mw-nav"} aria-label="Primary navigation">
          {nav.map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
        </nav>
        <div className="mw-login-menu">
          <button
            className="mw-login-button"
            type="button"
            aria-haspopup="menu"
            aria-expanded={loginMenuOpen}
            onClick={() => setLoginMenuOpen((open) => !open)}
          >
            Login <span aria-hidden="true">⌄</span>
          </button>
          {loginMenuOpen && (
            <div className="mw-login-dropdown" role="menu">
              <a href="/admin" role="menuitem" onClick={() => setLoginMenuOpen(false)}>Login as Admin</a>
              <a href="/jishindie" role="menuitem" onClick={() => setLoginMenuOpen(false)}>Login as Platform Fan</a>
              <a href="/jishindie?join=contestant" role="menuitem" onClick={() => setLoginMenuOpen(false)}>Login as Contestant</a>
            </div>
          )}
        </div>
        <button className="mw-menu" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
          <span /><span /><span />
        </button>
      </header>

      {selectedNews && (() => {
        const story = news.find(([title]) => title === selectedNews);
        return (
          <div className="challenge-modal-backdrop" role="presentation" onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSelectedNews(null);
          }}>
            <article className="challenge-modal story-modal" role="dialog" aria-modal="true" aria-labelledby="story-title">
              <button className="modal-close" aria-label="Close story" onClick={() => setSelectedNews(null)}>×</button>
              <span className="live-pill">{story?.[1]}</span>
              <h2 id="story-title">{selectedNews}</h2>
              {newsStories[selectedNews]?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </article>
          </div>
        );
      })()}

      <main>
        <section className="mw-hero" id="home">
          <div className="hero-content">
            <h2>Welcome to MzimaWells Studios</h2>
            <p>Where Creativity Flows and Stories Come to Life</p>
            <div className="hero-actions">
              <a href="#what-we-do">Explore Our Work <b aria-hidden="true">→</b></a>
            </div>
          </div>
        </section>

        <section className="mw-section team-section" id="team">
          <div className="section-title"><h2>Our Team</h2><p>Meet the creative minds behind MzimaWells Studios</p></div>
          <div className="home-crew-grid">
            {[
              ["Dokta Will","Creative Director","/crew/dokta-will.jpeg"],
              ["Director Brian K","Production Director","/crew/director-brian-k.jpeg"],
              ["Director Abel Kibet","Content Director","/crew/director-abel-kibet.jpeg"],
              ["Duke Of Nomcity","Technical Director","/crew/director-duke-of-nomcity.jpeg"],
            ].map(([name,designation,photo])=>(
              <article key={name}>
                <Image src={photo} alt={`${name}, ${designation}`} width={500} height={600}/>
                <h3>{name}</h3>
                <p>{designation}</p>
              </article>
            ))}
          </div>
          <div className="title-actions"><a href="/team">Meet the team</a><Link href="/careers">View careers</Link></div>
        </section>

        <section className="mw-section what-section" id="what-we-do">
          <h2>What We Do</h2>
          <div className="what-grid">
            {[
              ["▶", "Video Production", "Professional video production services for music videos, commercials, and documentaries.", "/about"],
              ["▣", "Events", "Creating memorable experiences through professional event coverage and management.", "/events"],
              ["♛", "Jishindie Challenge", "Empowering creators through our innovative creative competition platform.", "/jishindie"],
            ].map(([icon, title, copy, href]) => (
              <a className="what-card" href={href} key={title} aria-label={`Explore ${title}`}>
                <span className="what-icon" aria-hidden="true">{icon}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
                <span className="what-card-action">Explore <b aria-hidden="true">→</b></span>
              </a>
            ))}
          </div>
        </section>

        <section className="mw-mission">
          <h2>Our Mission</h2>
          <p>Inspiring and connecting communities through authentic African stories.</p>
        </section>

        <section className="mw-section jishindie-section-page" id="jishindie">
          <div className="section-title jishindie-heading"><span className="live-pill">THIS WEEK&apos;S CHALLENGE</span><h2>Jishindie Challenge</h2><p>Register. Create. Compete. Get voted. Win MzimaWells prizes.</p></div>
          <div className="challenge-banner">
            <div><span>WEEKLY CREATOR CHALLENGE</span><h3>Show your talent. Become a fan favourite.</h3><p>Open to artists, dancers, filmmakers, comedians, fashion creators and digital storytellers.</p></div>
            <button onClick={openChallengeRegistration}>Register to compete <b>→</b></button>
          </div>
          <div className="challenge-live-panel">
            <div><span className="live-pill">{challengeSchedule?.status==="voting"?"LIVE VOTING":challengeSchedule?.status==="closed"?"CHALLENGE CLOSED":"REGISTRATION OPEN"}</span><h3>{challengeSchedule?.status==="voting"?"Voting closes in":challengeSchedule?.status==="registration"?"Registration closes in":"Next challenge countdown"}</h3><p>{challengeSchedule?.nextAnnouncement||"Loading challenge schedule..."}</p></div>
            <div className="countdown">{["Days","Hours","Minutes","Seconds"].map((label,index)=><div key={label}><strong>{String(countdown[index]).padStart(2,"0")}</strong><span>{label}</span></div>)}</div>
          </div>
          <div className="stats">
            {[String(registeredCount), "KSH 100", "3", "Sunday"].map((value, index) => <div key={index}><strong>{value}</strong><span>{["Registered creators", "Registration fee", "Ways to vote", "Challenge day"][index]}</span></div>)}
          </div>
          <button className="register-button" onClick={openChallengeRegistration}>Register <b aria-hidden="true">→</b></button>
          <a className="homepage-jishindie-link" href="/jishindie">View contestants, winners and voting</a>
          {challengeNotice && <p className="challenge-notice" role="status">{challengeNotice}</p>}
        </section>

        {registrationOpen && (
          <div className="challenge-modal-backdrop" role="presentation" onMouseDown={(event) => {
            if (event.currentTarget === event.target) setRegistrationOpen(false);
          }}>
            <div className="challenge-modal" role="dialog" aria-modal="true" aria-labelledby="challenge-registration-title">
              <button className="modal-close" aria-label="Close registration" onClick={() => setRegistrationOpen(false)}>×</button>
              <span className="live-pill">OPEN REGISTRATION</span>
              <h2 id="challenge-registration-title">Join the Jishindie Challenge</h2>
              <p>Registration costs Ksh 100. Register your talent, share your entry link, and return for voting when registration closes.</p>
              <form onSubmit={registerForChallenge}>
                <div className="form-grid">
                  <label>Full name<input name="fullName" required minLength={2} maxLength={100} /></label>
                  <label>Stage or team name<input name="stageName" maxLength={100} /></label>
                  <label>Email address<input name="email" type="email" required maxLength={254} /></label>
                  <label>Phone number<input name="phone" type="tel" required minLength={7} maxLength={32} /></label>
                  <label>Category<select name="category" required defaultValue=""><option value="" disabled>Select a category</option><option value="music">Music</option><option value="dance">Dance</option><option value="film">Film</option><option value="fashion">Fashion</option><option value="comedy">Comedy</option><option value="content">Content creation</option></select></label>
                  <label>Entry title<input name="entryTitle" required minLength={2} maxLength={160} /></label>
                  <label className="full-field">Entry link<input name="entryLink" type="url" placeholder="https://youtube.com/..." /></label>
                  <label className="full-field">Profile photo<input name="photograph" type="file" accept="image/jpeg,image/png,image/webp" /></label>
                </div>
                <button className="submit-registration" type="submit">Submit entry</button>
              </form>
              {challengeNotice && <p className="challenge-notice" role="status">{challengeNotice}</p>}
            </div>
          </div>
        )}

        <section className="mw-section about-section" id="about">
          <div className="section-title"><h2>About Us</h2><p>A creative studio telling authentic African stories.</p></div>
          <div className="title-actions"><a href="/about">Discover our story</a></div>
        </section>

      </main>

      <footer className="mw-footer">
        <div><h2>MzimaWells Studios</h2><p>Creating compelling content that inspires, entertains, and connects communities.</p></div>
        <div><h3>Quick Links</h3>{nav.slice(0, 5).map(([label, href]) => <a key={href} href={href}>{label}</a>)}<a href="/admin">Admin / Staff Login</a></div>
        <p className="copyright">© 2026 MzimaWells Studios. All rights reserved.</p>
      </footer>
    </div>
  );
}
