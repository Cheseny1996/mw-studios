import Link from "next/link";
import Image from "next/image";

export default function TeamPage() {
  const leaders = [
    ["Dokta Will","Creative Director","/crew/dokta-will.jpeg"],
    ["Director Brian K","Production Director","/crew/director-brian-k.jpeg"],
    ["Director Abel Kibet","Content Director","/crew/director-abel-kibet.jpeg"],
    ["Duke Of Nomcity","Technical Director","/crew/director-duke-of-nomcity.jpeg"],
  ];
  const winners = [
    ["Academician Kibet OGW","Jishindie Winner","/crew/academician-kibet.jpeg"],
    ["Ann Cheroo","Jishindie Winner","/crew/ann-cheroo.jpeg"],
    ["Caleb Junior","Jishindie Winner","/crew/caleb-junior.jpeg"],
  ];
  return (
    <main className="inner-page">
      <header className="inner-page-header"><Link href="/" className="inner-brand">MzimaWells Studios</Link><Link href="/">← Back to home</Link></header>
      <section className="inner-hero section-hero team-hero"><span>THE PEOPLE</span><h1>Meet the minds behind<br/>MzimaWells.</h1></section>
      <section className="route-content">
        <Image className="team-page-photo" src="/crew/mzima-wells-crew.jpeg" alt="MzimaWells Studios crew" width={1400} height={900} priority />
        <div className="route-title"><span>LEADERSHIP</span><h2>Creative leadership</h2></div>
        <div className="team-page-grid">{leaders.map(([name,role,photo])=> <article key={name}><Image src={photo} alt={name} width={500} height={600}/><h3>{name}</h3><p>{role}</p></article>)}</div>
        <div className="route-title"><span>COMMUNITY</span><h2>Jishindie Winners</h2></div>
        <div className="team-page-grid team-page-winners">{winners.map(([name,role,photo])=> <article key={name}><Image src={photo} alt={name} width={500} height={600}/><h3>{name}</h3><p>{role}</p></article>)}</div>
        <div className="join-team-page"><span>CAREERS</span><h2>Build meaningful work with us.</h2><Link href="/careers">View opportunities →</Link></div>
      </section>
    </main>
  );
}
