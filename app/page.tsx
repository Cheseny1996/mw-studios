"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";

const news = [
  ["MzimaWells Studios Launches New Podcast Series", "December 15, 2024", "Exciting new content coming your way with K-Run Podcast exploring stories from across the continent.", true],
  ["Jishindie Challenge Winners Announced", "December 10, 2024", "Congratulations to all the talented creators who participated in this season's competition.", true],
  ["Behind the Scenes: Latest Music Video Production", "December 5, 2024", "Take a look at our creative process for the latest music video project.", false],
  ["Community Outreach Program Success", "November 28, 2024", "Our recent community engagement initiative reached over 500 young creatives.", false],
  ["New Studio Equipment Upgrade", "November 20, 2024", "We invested in state-of-the-art equipment to deliver even better quality content.", false],
  ["Upcoming Events Calendar Released", "November 15, 2024", "Mark your calendars for our exciting lineup of events in the coming months.", false],
] as const;

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
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountMode, setAccountMode] = useState<"signin" | "signup">("signin");
  const [authNotice, setAuthNotice] = useState("");
  const [sessionUser, setSessionUser] = useState<{ name: string; email: string } | null>(null);
  const [authAfter, setAuthAfter] = useState<"challenge" | "event" | null>(null);
  const [challengeNotice, setChallengeNotice] = useState("");
  const [registeredCount, setRegisteredCount] = useState(0);
  const [contestants, setContestants] = useState<Array<{ _id: string; stageName?: string; fullName: string; category: string; entryTitle: string; photograph?: string; voteCount?: number }>>([]);
  useEffect(() => {
    fetch("/api/auth/session")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setSessionUser(data?.user ?? null))
      .catch(() => setSessionUser(null));
    fetch("/api/jishindie/challenge")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!data) return;
        setRegisteredCount(data.registered ?? 0);
        setContestants(data.contestants ?? []);
      })
      .catch(() => undefined);
  }, []);

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

  async function submitAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form));
    setAuthNotice(accountMode === "signin" ? "Signing in..." : "Creating your account...");
    const response = await fetch(`/api/auth/${accountMode === "signin" ? "login" : "register"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setAuthNotice(data.error || "Account action could not be completed.");
      return;
    }
    setSessionUser(data.user);
    setAccountOpen(false);
    setAuthNotice("");
    if (authAfter === "challenge") {
      setRegistrationOpen(true);
      setChallengeNotice("Signed in. Complete your challenge registration below.");
    }
    if (authAfter === "event") {
      document.querySelector("#events")?.scrollIntoView({ behavior: "smooth" });
      setChallengeNotice("Signed in. Select Register Now on an event to continue.");
    }
    setAuthAfter(null);
  }

  function openChallengeRegistration() {
    if (sessionUser) {
      setRegistrationOpen(true);
      return;
    }
    setAuthAfter("challenge");
    setAccountMode("signup");
    setAuthNotice("");
    setAccountOpen(true);
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
    ["Home", "#home"],
    ["News", "#news"],
    ["K-Run Podcast", "#podcast"],
    ["Events", "#events"],
    ["Jishindie", "#jishindie"],
    ["About", "#about"],
    ["Team", "#team"],
  ];

  return (
    <div className="mw-site">
      <header className="mw-header">
        <a className="mw-brand" href="#home" aria-label="MzimaWells Studios">
          <Image src="/mzima-wells-logo.png" alt="" width={44} height={44} priority />
          <h1>MzimaWells Studios</h1>
        </a>
        <nav className={menuOpen ? "mw-nav open" : "mw-nav"} aria-label="Primary navigation">
          {nav.map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
        </nav>
        <button className="mw-account-button" onClick={() => {
          setAccountMode("signin");
          setAuthAfter(null);
          setAccountOpen(true);
        }}>{sessionUser ? sessionUser.name.split(" ")[0] : "Sign in"}</button>
        <button className="mw-menu" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
          <span /><span /><span />
        </button>
      </header>

      {accountOpen && (
        <div className="challenge-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setAccountOpen(false);
        }}>
          <div className="challenge-modal account-modal" role="dialog" aria-modal="true" aria-labelledby="account-title">
            <button className="modal-close" aria-label="Close account panel" onClick={() => setAccountOpen(false)}>×</button>
            <span className="live-pill">MW STUDIOS ACCOUNT</span>
            <div className="account-tabs">
              <button className={accountMode === "signin" ? "active" : ""} onClick={() => { setAccountMode("signin"); setAuthNotice(""); }}>Sign in</button>
              <button className={accountMode === "signup" ? "active" : ""} onClick={() => { setAccountMode("signup"); setAuthNotice(""); }}>Create account</button>
            </div>
            <h2 id="account-title">{accountMode === "signin" ? "Welcome back" : "Create your account"}</h2>
            <p>{accountMode === "signin" ? "Sign in with your email and password." : "Register with your name, email, phone and password."}</p>
            <form onSubmit={submitAccount}>
              <div className="form-grid">
                {accountMode === "signup" && (
                  <>
                    <label className="full-field">Full name<input name="fullName" required minLength={2} maxLength={100} /></label>
                    <label>Phone number<input name="phone" type="tel" required minLength={7} maxLength={32} /></label>
                  </>
                )}
                <label className={accountMode === "signup" ? "full-field" : "full-field"}>Email address<input name="email" type="email" required maxLength={254} /></label>
                <label className="full-field">Password<input name="password" type="password" required minLength={12} maxLength={128} /></label>
              </div>
              <button className="submit-registration" type="submit">{accountMode === "signin" ? "Sign in" : "Create account"}</button>
            </form>
            {authNotice && <p className="challenge-notice" role="status">{authNotice}</p>}
          </div>
        </div>
      )}

      <main>
        <section className="mw-hero" id="home">
          <div>
            <h2>Welcome to MzimaWells Studios</h2>
            <p>Where Creativity Flows and Stories Come to Life</p>
            <a href="#what-we-do">Explore Our Work</a>
          </div>
        </section>

        <section className="mw-section what-section" id="what-we-do">
          <h2>What We Do</h2>
          <div className="what-grid">
            {[
              ["▶", "Video Production", "Professional video production services for music videos, commercials, and documentaries.", "#about"],
              ["●", "Podcasting", "K-Run Podcast brings you the latest in entertainment, culture, and inspiration.", "#podcast"],
              ["▣", "Events", "Creating memorable experiences through professional event coverage and management.", "#events"],
              ["♛", "Jishindie Challenge", "Empowering creators through our innovative creative competition platform.", "#jishindie"],
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
          <p>We believe in the power of storytelling to inspire, educate, and connect communities. We are committed to producing high-quality content that resonates with audiences and creates lasting impact.</p>
        </section>

        <section className="mw-section news-section" id="news">
          <div className="section-title"><h2>Latest News</h2><p>Stay updated with the latest from MzimaWells Studios</p></div>
          <div className="news-grid">
            {news.map(([title, date, copy, trending], index) => (
              <article className="news-card" key={title}>
                <div className={`card-art art-${index}`}><span>MzimaWells</span>{trending && <b>Trending</b>}</div>
                <div className="card-body"><time>{date}</time><h3>{title}</h3><p>{copy}</p><a className="inline-action" href="mailto:info@mzimawellsstudios.com?subject=News%20enquiry">Ask about this story →</a></div>
              </article>
            ))}
          </div>
        </section>

        <section className="mw-section podcast-section" id="podcast">
          <div className="section-title"><h2>K-Run Podcast</h2><p>Conversations that inspire, educate, and entertain</p><div className="title-actions"><a href="mailto:info@mzimawellsstudios.com?subject=K-Run%20Podcast%20subscription">Subscribe by email</a><a href="#episodes">View Episodes</a></div></div>
          <div className="podcast-grid" id="episodes">
            {episodes.map(([title, date, duration, copy], index) => (
              <article className="podcast-card" key={title}>
                <div className={`podcast-art podcast-art-${index}`}><span>K</span></div>
                <div className="card-body"><time>{date} • {duration}</time><h3>{title}</h3><p>{copy}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="mw-section events-section-page" id="events">
          <div className="section-title"><h2>Events</h2><p>Join us for exciting events and experiences</p></div>
          <h3 className="subheading">Upcoming Events</h3>
          <div className="events-grid">
            {events.map(([title, date, time, location, copy, attendees], index) => (
              <article className="event-card" key={title}>
                <div className={`event-art event-art-${index}`}><span>{date.split(", ")[0]}</span></div>
                <div className="card-body"><h3>{title}</h3><p>{copy}</p><ul><li>▣ {date}</li><li>◷ {time}</li><li>⌖ {location}</li><li>♙ {attendees} attendees registered</li></ul><button className="event-email-action" onClick={() => {
                  if (!sessionUser) {
                    setAuthAfter("event");
                    setAccountMode("signup");
                    setAccountOpen(true);
                  } else {
                    setChallengeNotice(`Registration for "${title}" is ready for your account.`);
                  }
                }}>Register for event</button></div>
              </article>
            ))}
          </div>
          <h3 className="subheading past-title">Past Events</h3>
          <div className="past-grid">
            {["Jishindie Season 3 Round 3 - Meet the Candidates", "Jishindie Season 3 Round 4 Championship", "Weekly Jishindie T-Shirt Challenge Round 2"].map((title, index) => (
              <article key={title}><div className={`past-art past-art-${index}`} /><h3>{title}</h3><time>{["October 18, 2024", "December 15, 2024", "December 1, 2024"][index]}</time></article>
            ))}
          </div>
        </section>

        <section className="mw-section jishindie-section-page" id="jishindie">
          <div className="section-title jishindie-heading"><span className="live-pill">THIS WEEK'S CHALLENGE</span><h2>Jishindie Challenge</h2><p>Register. Create. Compete. Get voted. Win MzimaWells prizes.</p></div>
          <div className="challenge-banner">
            <div><span>WEEKLY CREATOR CHALLENGE</span><h3>Show your talent. Become a fan favourite.</h3><p>Open to artists, dancers, filmmakers, comedians, fashion creators and digital storytellers.</p></div>
            <button onClick={openChallengeRegistration}>Register to compete <b>→</b></button>
          </div>
          <div className="stats">
            {[String(registeredCount), "3", "3", "KSH Prizes"].map((value, index) => <div key={index}><strong>{value}</strong><span>{["Registered creators", "Prize tiers", "Ways to vote", "Rewards"][index]}</span></div>)}
          </div>
          <h3 className="subheading prize-heading">Challenge prizes</h3>
          <div className="prizes">
            {[["01", "Grand Prize", "MzimaWells feature outfit + branded merchandise"], ["02", "Runner Up", "Official MzimaWells hoodie + studio access"], ["03", "Fan Favourite", "MzimaWells mug + branded T-shirt"]].map(([number, title, copy]) => <article key={title}><span>{number}</span><div className="prize-art">MW</div><h4>{title}</h4><p>{copy}</p></article>)}
          </div>
          <h3 className="subheading">Approved contestants</h3>
          {contestants.length ? (
            <div className="contestant-grid">
              {[...contestants].sort((a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0)).map((contestant, index) => (
                <article className="contestant-card" key={contestant._id}>
                  <div className="contestant-avatar">
                    {contestant.photograph
                      ? <img src={contestant.photograph} alt={contestant.stageName || contestant.fullName} />
                      : String(index + 1).padStart(2, "0")}
                  </div>
                  <span>{contestant.category}</span>
                  <h4>{contestant.stageName || contestant.fullName}</h4>
                  <p>{contestant.entryTitle}</p>
                  <div className="vote-row"><strong>{contestant.voteCount ?? 0} votes</strong><button onClick={() => voteForContestant(contestant._id)}>Vote</button></div>
                </article>
              ))}
            </div>
          ) : <div className="empty-contestants"><b>Contestants are being reviewed.</b><p>Approved entries will appear here before voting opens.</p></div>}
          <h3 className="subheading">How to take part</h3>
          <div className="steps">
            {[["Register", "Sign up during the open period."], ["Create", "Develop content following the theme and guidelines."], ["Submit", "Upload your submission before the deadline."], ["Win", "Top entries receive prizes and industry opportunities."]].map(([title, copy], index) => <article key={title}><b>{index + 1}</b><div><h4>{title}</h4><p>{copy}</p></div></article>)}
          </div>
          <button className="register-button" onClick={openChallengeRegistration}>Register for the challenge</button>
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
              <p>Register your talent once, then return for voting when your entry is approved.</p>
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
          <div className="section-title"><h2>About Us</h2><p>We are a creative content studio dedicated to telling authentic African stories through video, podcasting, and digital media.</p></div>
          <div className="story"><div className="story-art">MzimaWells</div><div><h3>Our Story</h3><p>MzimaWells Studios was born from a passion for authentic storytelling and a vision to amplify African voices.</p><p>We have grown into a full-service creative studio producing music videos, documentaries, podcasts, and digital content.</p><p>Today, we continue to push creative boundaries while telling stories that matter and creating opportunities for emerging talent.</p></div></div>
          <h3 className="subheading">Our Values</h3>
          <div className="values">{["Innovation", "Passion", "Excellence", "Vision"].map((value, index) => <article key={value}><b>{["↗", "♥", "★", "◎"][index]}</b><h4>{value}</h4><p>{["Fresh ideas and creative boundaries.", "Work driven by love for storytelling.", "High standards in every delivery.", "Content that inspires future generations."][index]}</p></article>)}</div>
          <h3 className="subheading">Our Journey</h3>
          <div className="journey">{[["2018", "The Beginning"], ["2020", "K-Run Podcast Launch"], ["2022", "Studio Expansion"], ["2024", "Growing Impact"]].map(([year, title]) => <article key={year}><b>{year}</b><h4>{title}</h4><p>{title === "Growing Impact" ? "Reaching audiences across the continent and beyond." : "A milestone in our creative growth journey."}</p></article>)}</div>
        </section>

        <section className="mw-section team-section" id="team">
          <div className="section-title"><h2>Our Team</h2><p>Meet the creative minds behind MzimaWells Studios</p></div>
          <img className="team-crew-photo" src="/crew/mzima-wells-crew.jpeg" alt="MzimaWells Studios crew" />
          <h3 className="subheading">Leadership Team</h3>
          <div className="team-grid">
            {[
              ["Dokta Will", "Creative Director", "/crew/dokta-will.jpeg"],
              ["Director Brian K", "Production Director", "/crew/director-brian-k.jpeg"],
              ["Director Abel Kibet", "Content Director", "/crew/director-abel-kibet.jpeg"],
              ["Duke Of Nomcity", "Technical Director", "/crew/director-duke-of-nomcity.jpeg"],
            ].map(([name, role, photo]) => <article key={name}><img className="team-photo-real" src={photo} alt={name} /><h4>{name}</h4><strong>{role}</strong></article>)}
          </div>
          <h3 className="subheading">Creative Team</h3>
          <div className="team-grid">
            {[
              ["Academician Kibet OGW", "Creative Team", "/crew/academician-kibet.jpeg"],
              ["Ann Cheroo", "Creative Team", "/crew/ann-cheroo.jpeg"],
              ["Caleb Junior", "Creative Team", "/crew/caleb-junior.jpeg"],
            ].map(([name, role, photo]) => <article key={name}><img className="team-photo-real" src={photo} alt={name} /><h4>{name}</h4><strong>{role}</strong></article>)}
          </div>
          <div className="join-team"><h3>Join Our Team</h3><p>We are always looking for filmmakers, editors, content creators, and creative professionals who want to make an impact.</p><a className="join-team-link" href="mailto:info@mzimawellsstudios.com?subject=Careers%20at%20MzimaWells%20Studios">Ask About Opportunities</a></div>
        </section>
      </main>

      <footer className="mw-footer">
        <div><h2>MzimaWells Studios</h2><p>Creating compelling content that inspires, entertains, and connects communities.</p></div>
        <div><h3>Quick Links</h3>{nav.slice(0, 5).map(([label, href]) => <a key={href} href={href}>{label}</a>)}</div>
        <p className="copyright">© 2026 MzimaWells Studios. All rights reserved.</p>
      </footer>
    </div>
  );
}
