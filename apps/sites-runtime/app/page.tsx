export default function SiteUnavailable() {
  return (
    <main className="shell">
      <div className="badge">Smart Solutions Tech</div>
      <h1>Site en préparation</h1>
      <p className="lead">Aucun site client n’est publié sur cet environnement.</p>
      <p className="detail">Le routage par domaine ne sera activé qu’après validation de l’isolation entre sites et de la configuration du runtime.</p>
    </main>
  );
}