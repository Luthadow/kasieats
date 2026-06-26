export default function OrdersPage() {
  return (
    <section>
      <div className="page-header">
        <h1>Orders</h1>
        <p>Accept, prepare, and mark orders ready for pickup.</p>
      </div>

      <div className="panel">
        <div className="order-row">
          <div>
            <strong>No pending orders</strong>
            <p>New orders will appear here in real time.</p>
          </div>
          <span className="badge">Live</span>
        </div>
      </div>
    </section>
  );
}
