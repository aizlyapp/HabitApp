'use client';

export default function About() {
  return (
    <section className="l-about" id="about">
      <div className="l-container">
        <div className="about-grid">
          <div className="about-image">
            <img src="/images/matias_foto_circular.png" alt="Matías - Fundador de Roomy" />
          </div>
          <div className="about-content">
            <h2 className="section-title">Quién está detrás de Roomy</h2>
            <div className="about-text">
              <p>Soy Matías, de Villa Gesell. Antes de escribir una sola línea de código, pasé años trabajando en hostels y hoteles — en recepción, en cocina, atendiendo huéspedes — en Argentina, Brasil, Ecuador y Colombia.</p>
              <p>Ahí vi de cerca el problema que Roomy resuelve: reservas que se pierden entre WhatsApp, Excel y Booking porque nada está conectado.</p>
              <p>Armo y mantengo Roomy yo mismo. Cuando escribís, del otro lado no hay un ticket perdido en una cola de soporte — estoy yo.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}