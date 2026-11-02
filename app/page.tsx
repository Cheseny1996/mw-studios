"use client";

import Image from "next/image";
import { useState } from "react";

const navItems = [
  ["About Us", "/about"],
  ["What We Do", "/programmes"],
  ["Our Crew", "/crew"],
  ["Events", "/events"],
  ["Jishindie", "/jishindie"],
  ["Stories", "/stories"],
  ["Gallery", "/gallery"],
  ["Shop", "/shop"],
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Mzima Wells Studios home">
          <Image src="/mzima-wells-logo.png" alt="" width={58} height={58} priority />
          <span>Mzima Wells</span>
        </a>
        <nav className={menuOpen ? "nav nav-open" : "nav"} aria-label="Primary navigation">
          {navItems.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>
          ))}
        </nav>
        <div className="header-actions">
          <button className="icon-button" aria-label="Search" onClick={() => setSearchOpen(true)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.35-4.35m1.35-5.15a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" /></svg>
          </button>
          <a className="cart-button" href="/cart" aria-label="Shopping cart">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 7H6M9 20h.01M17 20h.01" /></svg>
          </a>
          <a className="ticket-button" href="/events">Get Tickets</a>
          <button className="menu-button" aria-label="Toggle menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      {searchOpen && (
        <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search Mzima Wells">
          <button className="search-close" aria-label="Close search" onClick={() => setSearchOpen(false)}>×</button>
          <form action="/search">
            <label htmlFor="site-search">Search Mzima Wells</label>
            <div>
              <input id="site-search" name="q" type="search" placeholder="Events, stories, programmes..." autoFocus />
              <button type="submit">Search</button>
            </div>
          </form>
        </div>
      )}

      <main>
        <section className="hero">
          <div className="hero-mark" aria-hidden="true">
            <Image src="/mzima-wells-logo.png" alt="" fill priority sizes="(max-width: 760px) 240px, 440px" />
          </div>
          <div className="hero-content">
            <p className="eyebrow">Mzima Wells Studios</p>
            <h1>Changing<br />the Narrative.</h1>
            <p className="hero-copy">Stories that matter. Creativity without boundaries. People creating impact.</p>
            <div className="hero-actions">
              <a className="primary-button" href="/about">Explore Mzima Wells</a>
              <a className="secondary-button" href="/events">Discover Events</a>
              <a className="text-button" href="/community">Join the Movement <span>↗</span></a>
            </div>
          </div>
          <a className="scroll-cue" href="#who-we-are" aria-label="Scroll to Who We Are">Explore <span>↓</span></a>
        </section>

        <section className="intro-section" id="who-we-are">
          <div><p className="eyebrow dark-eyebrow">Who We Are</p><h2>Platforms for voices, talent and positive change.</h2></div>
          <div className="intro-copy">
            <p>Mzima Wells brings people, creativity and community together through media, culture, events and technology.</p>
            <a href="/about">Discover our story <span>→</span></a>
          </div>
        </section>

        <section className="programmes-section">
          <div className="section-heading">
            <div><p className="eyebrow">What We Do</p><h2>Our creative world</h2></div>
            <a href="/programmes">View all programmes <span>→</span></a>
          </div>
          <div className="programme-grid">
            {[
              ["01", "Creative Media", "Media, film and photography that move ideas forward."],
              ["02", "Talent Development", "Platforms designed to discover and develop creative talent."],
              ["03", "Events & Culture", "Shared experiences that celebrate culture and community."],
              ["04", "Technology & Innovation", "Digital tools and campaigns for meaningful participation."],
            ].map(([number, title, copy]) => (
              <article key={title}><span>{number}</span><h3>{title}</h3><p>{copy}</p><a href="/programmes" aria-label={`Explore ${title}`}>↗</a></article>
            ))}
          </div>
        </section>

        <section className="jishindie-section">
          <div className="jishindie-copy">
            <p className="eyebrow dark-eyebrow">Jishindie</p>
            <h2>Your voice.<br />Your choice.<br /><em>Your community.</em></h2>
            <p>Take part in Mzima Wells’ weekly community vote. Every eligible account has one voice.</p>
            <div className="hero-actions">
              <a className="orange-button" href="/jishindie/register">Register to Vote</a>
              <a className="secondary-button light-button" href="/jishindie/live">View Live Voting</a>
            </div>
          </div>
          <div className="jishindie-status">
            <span className="status-dot" />
            <div><small>Weekly election</small><strong>JISHINDIE REGISTRATION IS OPEN</strong><p>Sunday voting · 08:30–21:30 EAT</p></div>
          </div>
        </section>

        <section className="events-section">
          <div className="section-heading">
            <div><p className="eyebrow dark-eyebrow">What’s On</p><h2>Events & experiences</h2></div>
            <a href="/events">Explore events <span>→</span></a>
          </div>
          <div className="empty-state">
            <span>Upcoming programme</span><h3>Discover events as they are announced.</h3>
            <p>Event details will be published here by the Mzima Wells team.</p><a href="/events">View event calendar</a>
          </div>
        </section>

        <section className="newsletter-section">
          <div><p className="eyebrow">Stay connected</p><h2>Be part of the next<br />Mzima Wells story.</h2></div>
          <form action="/api/newsletter" method="post">
            <label htmlFor="newsletter-email">Email address</label>
            <div><input id="newsletter-email" name="email" type="email" placeholder="you@example.com" required /><button type="submit">Join the community →</button></div>
          </form>
        </section>
      </main>

      <footer>
        <div className="footer-brand">
          <Image src="/mzima-wells-logo.png" alt="" width={64} height={64} />
          <div><strong>Mzima Wells</strong><span>Changing the Narrative.</span></div>
        </div>
        <div className="footer-links">
          <div><strong>Explore</strong><a href="/about">About Us</a><a href="/programmes">What We Do</a><a href="/crew">Our Crew</a></div>
          <div><strong>Participate</strong><a href="/events">Events</a><a href="/jishindie">Jishindie</a><a href="/shop">Shop</a></div>
          <div><strong>Connect</strong><a href="/contact">Contact</a><a href="/gallery">Gallery</a><a href="/stories">Stories</a></div>
        </div>
        <p className="copyright">© 2026 Mzima Wells Studios</p>
      </footer>
    </div>
  );
}
