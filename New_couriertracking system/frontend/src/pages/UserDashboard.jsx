import {
  Boxes,
  ClipboardList,
  LoaderCircle,
  PackagePlus,
  Search,
  Truck
} from "lucide-react";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import EmptyState from "../components/EmptyState";
import Layout from "../components/Layout";
import LoadingScreen from "../components/LoadingScreen";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";

const initialBookingForm = {
  sender: { name: "", phone: "", email: "", address: "" },
  receiver: { name: "", phone: "", email: "", address: "" },
  packageWeight: "",
  deliveryType: "Express"
};

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

const UserDashboard = () => {
  const { user, token } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [bookingForm, setBookingForm] = useState(initialBookingForm);
  const [activeTab, setActiveTab] = useState("book");
  const [historyQuery, setHistoryQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const deferredQuery = useDeferredValue(historyQuery);

  useEffect(() => {
    const loadShipments = async () => {
      try {
        const response = await api.myShipments(token);
        startTransition(() => {
          setShipments(response.shipments);
        });
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadShipments();
  }, [token]);

  const updateBookingField = (section, field) => (event) => {
    const value = event.target.value;
    setBookingForm((currentForm) => ({
      ...currentForm,
      [section]:
        typeof currentForm[section] === "object"
          ? { ...currentForm[section], [field]: value }
          : value
    }));
  };

  const filteredShipments = useMemo(() => {
    if (!deferredQuery.trim()) {
      return shipments;
    }

    const query = deferredQuery.trim().toLowerCase();
    return shipments.filter(
      (shipment) =>
        shipment.trackingId.toLowerCase().includes(query) ||
        shipment.receiver.name.toLowerCase().includes(query) ||
        shipment.sender.name.toLowerCase().includes(query)
    );
  }, [deferredQuery, shipments]);

  const stats = useMemo(() => {
    const activeCount = shipments.filter((shipment) => shipment.status !== "Delivered").length;
    const deliveredCount = shipments.filter((shipment) => shipment.status === "Delivered").length;

    return [
      { label: "Total bookings", value: shipments.length, icon: ClipboardList },
      { label: "Active shipments", value: activeCount, icon: Truck },
      { label: "Delivered", value: deliveredCount, icon: Boxes }
    ];
  }, [shipments]);

  const handleCreateShipment = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const response = await api.createShipment(
        {
          ...bookingForm,
          packageWeight: Number(bookingForm.packageWeight)
        },
        token
      );

      startTransition(() => {
        setShipments((currentShipments) => [response.shipment, ...currentShipments]);
      });
      setBookingForm(initialBookingForm);
      setActiveTab("history");
      setSuccess(`Shipment booked successfully. Tracking ID: ${response.shipment.trackingId}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingScreen label="Loading your shipment history..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="shell py-10 sm:py-14">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="eyebrow">Customer dashboard</div>
            <h1 className="mt-5 text-4xl font-semibold">Welcome, {user.name}.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7" style={{ color: "rgb(var(--muted))" }}>
              Create new shipments, keep an eye on delivery progress, and revisit every tracking ID from one place.
            </p>
          </div>

          <div className="flex rounded-full border border-slate-200 p-1 dark:border-slate-700">
            <button
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                activeTab === "book" ? "bg-teal-600 text-white" : "text-slate-600 dark:text-slate-300"
              }`}
              onClick={() => setActiveTab("book")}
              type="button"
            >
              Book courier
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                activeTab === "history" ? "bg-teal-600 text-white" : "text-slate-600 dark:text-slate-300"
              }`}
              onClick={() => setActiveTab("history")}
              type="button"
            >
              Order history
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="surface p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-200">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-5 text-3xl font-semibold">{value}</p>
              <p className="mt-2 text-sm" style={{ color: "rgb(var(--muted))" }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            {success}
          </div>
        ) : null}

        {activeTab === "book" ? (
          <form className="surface mt-8 p-6 sm:p-8" onSubmit={handleCreateShipment}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.18em]" style={{ color: "rgb(var(--muted))" }}>
                  New booking
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Create a shipment</h2>
              </div>
              <div className="status-pill bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-200">
                <PackagePlus className="h-4 w-4" />
                Tracking ID auto-generated
              </div>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold">Sender details</h3>
                <div className="mt-4 grid gap-4">
                  {[
                    ["name", "Sender name"],
                    ["phone", "Phone number"],
                    ["email", "Email address"],
                    ["address", "Pickup address"]
                  ].map(([field, label]) => (
                    <label key={field} className="block">
                      <span className="mb-2 block text-sm font-medium">{label}</span>
                      <div className="input-shell">
                        {field === "address" ? (
                          <textarea
                            className="input-field min-h-[96px] resize-none"
                            value={bookingForm.sender[field]}
                            onChange={updateBookingField("sender", field)}
                          />
                        ) : (
                          <input
                            className="input-field"
                            type={field === "email" ? "email" : "text"}
                            value={bookingForm.sender[field]}
                            onChange={updateBookingField("sender", field)}
                          />
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Receiver details</h3>
                <div className="mt-4 grid gap-4">
                  {[
                    ["name", "Receiver name"],
                    ["phone", "Phone number"],
                    ["email", "Email address"],
                    ["address", "Delivery address"]
                  ].map(([field, label]) => (
                    <label key={field} className="block">
                      <span className="mb-2 block text-sm font-medium">{label}</span>
                      <div className="input-shell">
                        {field === "address" ? (
                          <textarea
                            className="input-field min-h-[96px] resize-none"
                            value={bookingForm.receiver[field]}
                            onChange={updateBookingField("receiver", field)}
                          />
                        ) : (
                          <input
                            className="input-field"
                            type={field === "email" ? "email" : "text"}
                            value={bookingForm.receiver[field]}
                            onChange={updateBookingField("receiver", field)}
                          />
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Package weight (kg)</span>
                <div className="input-shell">
                  <input
                    className="input-field"
                    min="0.1"
                    step="0.1"
                    type="number"
                    value={bookingForm.packageWeight}
                    onChange={updateBookingField("packageWeight")}
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">Delivery type</span>
                <div className="input-shell">
                  <select
                    className="input-field"
                    value={bookingForm.deliveryType}
                    onChange={updateBookingField("deliveryType")}
                  >
                    <option value="Express">Express</option>
                    <option value="Standard">Standard</option>
                    <option value="Economy">Economy</option>
                  </select>
                </div>
              </label>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button className="btn-primary" disabled={submitting} type="submit">
                {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
                {submitting ? "Creating shipment..." : "Create shipment"}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setBookingForm(initialBookingForm)}
                type="button"
              >
                Reset form
              </button>
            </div>
          </form>
        ) : null}

        {activeTab === "history" ? (
          <div className="mt-8">
            <div className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.18em]" style={{ color: "rgb(var(--muted))" }}>
                  Shipment records
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Order history</h2>
              </div>
              <div className="input-shell w-full sm:max-w-sm">
                <Search className="h-4 w-4 text-teal-600 dark:text-teal-300" />
                <input
                  className="input-field"
                  placeholder="Search by tracking ID or name"
                  value={historyQuery}
                  onChange={(event) => setHistoryQuery(event.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {filteredShipments.length ? (
                filteredShipments.map((shipment) => (
                  <div key={shipment._id} className="surface p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-semibold">{shipment.trackingId}</h3>
                          <StatusBadge status={shipment.status} />
                        </div>
                        <p className="mt-3 text-sm leading-6" style={{ color: "rgb(var(--muted))" }}>
                          {shipment.sender.name} to {shipment.receiver.name}
                        </p>
                        <p className="mt-1 text-sm leading-6" style={{ color: "rgb(var(--muted))" }}>
                          {shipment.deliveryType} service, {shipment.packageWeight} kg, booked on {formatDate(shipment.createdAt)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Link className="btn-secondary" to={`/track/${shipment.trackingId}`}>
                          Track shipment
                        </Link>
                        <div className="surface-strong px-4 py-3 text-sm font-semibold">
                          Rs. {shipment.price}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No shipments match this search"
                  copy="Create your first courier booking or change the search text to see your delivery history."
                  action={
                    <button className="btn-primary" onClick={() => setActiveTab("book")} type="button">
                      Book a courier
                    </button>
                  }
                />
              )}
            </div>
          </div>
        ) : null}
      </section>
    </Layout>
  );
};

export default UserDashboard;

