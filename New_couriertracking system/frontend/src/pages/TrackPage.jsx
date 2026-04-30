import { LoaderCircle, PackageSearch, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import StatusTimeline from "../components/StatusTimeline";

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

const TrackPage = () => {
  const { trackingId: routeTrackingId } = useParams();
  const [trackingId, setTrackingId] = useState(routeTrackingId || "");
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(Boolean(routeTrackingId));
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const loadShipment = async (nextTrackingId) => {
    setLoading(true);
    setError("");

    try {
      const response = await api.trackShipment(nextTrackingId.toUpperCase());
      setShipment(response.shipment);
    } catch (requestError) {
      setShipment(null);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (routeTrackingId) {
      loadShipment(routeTrackingId);
    }
  }, [routeTrackingId]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!trackingId.trim()) {
      return;
    }

    const normalizedTrackingId = trackingId.trim().toUpperCase();
    navigate(`/track/${normalizedTrackingId}`);
  };

  return (
    <Layout>
      <section className="shell py-10 sm:py-14">
        <div className="max-w-4xl animate-fade-rise">
          <div className="eyebrow">
            <PackageSearch className="h-4 w-4" />
            Public shipment tracking
          </div>
          <h1 className="mt-6 text-4xl font-semibold">Find the latest shipment status in seconds.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7" style={{ color: "rgb(var(--muted))" }}>
            Enter a tracking ID to see where the package is, what happened last, and when it is expected to arrive.
          </p>
        </div>

        <form className="surface mt-8 flex flex-col gap-4 p-4 sm:flex-row sm:items-center" onSubmit={handleSubmit}>
          <div className="input-shell flex-1">
            <Search className="h-4 w-4 text-teal-600 dark:text-teal-300" />
            <input
              className="input-field"
              placeholder="Search by tracking ID"
              value={trackingId}
              onChange={(event) => setTrackingId(event.target.value)}
            />
          </div>
          <button className="btn-primary" disabled={loading} type="submit">
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Track shipment
          </button>
        </form>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        {shipment ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="surface p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em]" style={{ color: "rgb(var(--muted))" }}>
                    Tracking ID
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">{shipment.trackingId}</h2>
                </div>
                <StatusBadge status={shipment.status} />
              </div>

              <dl className="mt-8 grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium" style={{ color: "rgb(var(--muted))" }}>
                    Delivery type
                  </dt>
                  <dd className="mt-2 text-lg font-semibold">{shipment.deliveryType}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium" style={{ color: "rgb(var(--muted))" }}>
                    Package weight
                  </dt>
                  <dd className="mt-2 text-lg font-semibold">{shipment.packageWeight} kg</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium" style={{ color: "rgb(var(--muted))" }}>
                    Estimated delivery
                  </dt>
                  <dd className="mt-2 text-lg font-semibold">{formatDate(shipment.estimatedDelivery)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium" style={{ color: "rgb(var(--muted))" }}>
                    Booked on
                  </dt>
                  <dd className="mt-2 text-lg font-semibold">{formatDate(shipment.createdAt)}</dd>
                </div>
              </dl>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="surface-strong p-4">
                  <p className="text-sm uppercase tracking-[0.18em]" style={{ color: "rgb(var(--muted))" }}>
                    Sender
                  </p>
                  <h3 className="mt-2 font-semibold">{shipment.sender.name}</h3>
                  <p className="mt-2 text-sm leading-6" style={{ color: "rgb(var(--muted))" }}>
                    {shipment.sender.address}
                  </p>
                </div>
                <div className="surface-strong p-4">
                  <p className="text-sm uppercase tracking-[0.18em]" style={{ color: "rgb(var(--muted))" }}>
                    Receiver
                  </p>
                  <h3 className="mt-2 font-semibold">{shipment.receiver.name}</h3>
                  <p className="mt-2 text-sm leading-6" style={{ color: "rgb(var(--muted))" }}>
                    {shipment.receiver.address}
                  </p>
                </div>
              </div>
            </div>

            <div className="surface p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em]" style={{ color: "rgb(var(--muted))" }}>
                    Delivery timeline
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">Status history</h2>
                </div>
              </div>
              <div className="mt-8">
                <StatusTimeline history={[...shipment.statusHistory].reverse()} />
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </Layout>
  );
};

export default TrackPage;

