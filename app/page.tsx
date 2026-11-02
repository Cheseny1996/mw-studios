"use client";

import Image from "next/image";
import { useState } from "react";

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
        <button className="mw-menu" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
          <span /><span /><span />
        </button>
      </header>

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
              ["▶", "Video Production", "Professional video production services for music videos, commercials, and documentaries."],
              ["●", "Podcasting", "K-Run Podcast brings you the latest in entertainment, culture, and inspiration."],
              ["▣", "Events", "Creating memorable experiences through professional event coverage and management."],
              ["♛", "Jishindie Challenge", "Empowering creators through our innovative creative competition platform."],
            ].map(([icon, title, copy]) => (
              <article key={title}><span className="what-icon">{icon}</span><h3>{title}</h3><p>{copy}</p></article>
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
                <div className="card-body"><time>{date}</time><h3>{title}</h3><p>{copy}</p><button>Read More →</button></div>
              </article>
            ))}
          </div>
        </section>

        <section className="mw-section podcast-section" id="podcast">
          <div className="section-title"><h2>K-Run Podcast</h2><p>Conversations that inspire, educate, and entertain</p><div className="title-actions"><button>Subscribe Now</button><a href="#episodes">View All Episodes</a></div></div>
          <div className="podcast-grid" id="episodes">
            {episodes.map(([title, date, duration, copy], index) => (
              <article className="podcast-card" key={title}>
                <div className={`podcast-art podcast-art-${index}`}><span>K</span></div>
                <div className="card-body"><time>{date} • {duration}</time><h3>{title}</h3><p>{copy}</p><div className="podcast-actions"><button>▶ &nbsp; Play Episode</button><button className="download">↓ &nbsp; Download</button></div></div>
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
                <div className="card-body"><h3>{title}</h3><p>{copy}</p><ul><li>▣ {date}</li><li>◷ {time}</li><li>⌖ {location}</li><li>♙ {attendees} attendees registered</li></ul><button>Register Now</button></div>
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
          <div className="section-title"><h2>Jishindie Challenge</h2><p>Empowering creators to showcase their talent and compete for recognition</p></div>
          <div className="jishindie-about"><h3>What is Jishindie?</h3><p>Jishindie Challenge is our flagship creative competition for emerging artists, filmmakers, and content creators. It provides a stage to showcase work and empower talent through film, music, and digital content.</p></div>
          <div className="stats">
            {[["500+", "Participants"], ["50+", "Winners"], ["1000+", "Submissions"], ["$10K", "Prize Pool"]].map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
          </div>
          <h3 className="subheading">Recent Winners</h3>
          <div className="winners">
            {[["Academician Kibet OGW", "Team Strong"], ["Ann Cheroo", "Team Fearless Force"], ["Caleb Junior", "Team Strong"]].map(([name, team], index) => <article key={name}><div className={`winner-art winner-${index}`} /><h4>{name}</h4><p>{index ? "Weekly T-Shirt Challenge Winner" : "Weekly T-Shirt Challenge Champion"}</p><span>{team}</span></article>)}
          </div>
          <h3 className="subheading">How to Participate</h3>
          <div className="steps">
            {[["Register", "Sign up during the open period."], ["Create", "Develop content following the theme and guidelines."], ["Submit", "Upload your submission before the deadline."], ["Win", "Top entries receive prizes and industry opportunities."]].map(([title, copy], index) => <article key={title}><b>{index + 1}</b><div><h4>{title}</h4><p>{copy}</p></div></article>)}
          </div>
          <button className="register-button">Register for Next Challenge</button>
        </section>

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
          <div className="team-crew">Creative Collective</div>
          <h3 className="subheading">Leadership Team</h3>
          <div className="team-grid">
            {[["Dokta Will", "Creative Director"], ["Director Brian K", "Production Director"], ["Director Abel Kibet", "Content Director"], ["Duke Of Nomcity", "Technical Director"]].map(([name, role], index) => <article key={name}><div className={`team-photo team-photo-${index}`} /><h4>{name}</h4><strong>{role}</strong></article>)}
          </div>
          <div className="join-team"><h3>Join Our Team</h3><p>We are always looking for filmmakers, editors, content creators, and creative professionals who want to make an impact.</p><button>View Open Positions</button></div>
        </section>
      </main>

      <footer className="mw-footer">
        <div><h2>MzimaWells Studios</h2><p>Creating compelling content that inspires, entertains, and connects communities.</p></div>
        <div><h3>Quick Links</h3>{nav.slice(0, 5).map(([label, href]) => <a key={href} href={href}>{label}</a>)}</div>
        <div><h3>Follow MW Studios</h3><div className="socials"><a href="#">f</a><a href="#">in</a><a href="#">▶</a><a href="#">◎</a><a href="#">x</a></div><p>Email: info@mzimawellsstudios.com</p><p>Phone: +254 700 000 000</p></div>
        <p className="copyright">© 2026 MzimaWells Studios. All rights reserved.</p>
      </footer>
    </div>
  );
}
