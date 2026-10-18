export default function AdminHome() {
  return (
    <main className="shell">
      <div className="badge">Smart Solutions Tech</div>
      <h1>Administration</h1>
      <p className="lead">Cet espace est en préparation.</p>
      <section className="notice" aria-labelledby="status-title">
        <h2 id="status-title">Accès non activé</h2>
        <p>L’authentification côté serveur et les rôles d’administration doivent être configurés et vérifiés avant d’ouvrir cet espace.</p>
      </section>
    </main>
  );
}