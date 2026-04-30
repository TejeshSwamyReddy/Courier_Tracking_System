import {
  LoaderCircle,
  Search,
  ShieldCheck,
  Truck,
  UserCog,
  Users
} from "lucide-react";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import EmptyState from "../components/EmptyState";
import Layout from "../components/Layout";
import LoadingScreen from "../components/LoadingScreen";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";

const statusOptions = ["Order Placed", "Picked Up", "In Transit", "Delivered"];

const metricCards = (metrics) => [
  { label: "Total shipments", value: metrics.totalShipments, icon: Truck },
  { label: "Active shipments", value: metrics.activeShipments, icon: ShieldCheck },
  { label: "Delivered", value: metrics.deliveredShipments, icon: Truck },
  { label: "Users", value: metrics.totalUsers, icon: Users }
];

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

const AdminDashboard = () => {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState({
    totalShipments: 0,
    activeShipments: 0,
    deliveredShipments: 0,
    totalUsers: 0
  });
  const [shipments, setShipments] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("shipments");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const deferredSearchTerm = useDeferredValue(searchTerm);

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (deferredSearchTerm.trim()) {
      params.set("search", deferredSearchTerm.trim());
    }
    if (statusFilter) {
      params.set("status", statusFilter);
    }
    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  }, [deferredSearchTerm, statusFilter]);

  const loadOverview = async () => {
    const [dashboardResponse, usersResponse] = await Promise.all([
      api.adminDashboard(token),
      api.adminUsers(token)
    ]);

    startTransition(() => {
      setMetrics(dashboardResponse.metrics);
      setUsers(usersResponse.users);
    });
  };

  const loadShipments = async () => {
    const response = await api.adminShipments(token, searchParams);
    startTransition(() => {
      setShipments(response.shipments);
    });
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await Promise.all([loadOverview(), loadShipments()]);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [token]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const refreshShipments = async () => {
      try {
        await loadShipments();
      } catch (requestError) {
        setError(requestError.message);
      }
    };

    refreshShipments();
  }, [searchParams]);

  const handleStatusUpdate = async (shipmentId, status) => {
    setUpdatingId(shipmentId);
    setError("");
    setNotice("");

    try {
      await api.updateShipmentStatus(
        shipmentId,
        {
          status,
          message: `Shipment marked as ${status}.`,
          location: status === "Delivered" ? "Destination Hub" : "Dispatch Network"
        },
        token
      );
      await Promise.all([loadOverview(), loadShipments()]);
      setNotice("Shipment status updated successfully.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdatingId("");
    }
  };

  const handleUserUpdate = async (userId, payload) => {
    setUpdatingId(userId);
    setError("");
    setNotice("");

    try {
      await api.updateUser(userId, payload, token);
      await loadOverview();
      setNotice("User updated successfully.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdatingId("");
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingScreen label="Loading admin console..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="shell py-10 sm:py-14">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="eyebrow">Admin console</div>
            <h1 className="mt-5 text-4xl font-semibold">Operations control room.</h1>
            <p className="mt-4 max-w-3xl text-base leading-7" style={{ color: "rgb(var(--muted))" }}>
              Review shipments, update delivery milestones, and manage user access without leaving the dashboard.
            </p>
          </div>

          <div className="flex rounded-full border border-slate-200 p-1 dark:border-slate-700">
            <button
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                activeTab === "shipments" ? "bg-teal-600 text-white" : "text-slate-600 dark:text-slate-300"
              }`}
              onClick={() => setActiveTab("shipments")}
              type="button"
            >
              Shipments
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                activeTab === "users" ? "bg-teal-600 text-white" : "text-slate-600 dark:text-slate-300"
              }`}
              onClick={() => setActiveTab("users")}
              type="button"
            >
              Users
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metricCards(metrics).map(({ label, value, icon: Icon }) => (
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

        {notice ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            {notice}
          </div>
        ) : null}

        {activeTab === "shipments" ? (
          <div className="mt-8">
            <div className="surface flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.18em]" style={{ color: "rgb(var(--muted))" }}>
                  Shipment operations
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Monitor every courier</h2>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="input-shell sm:w-72">
                  <Search className="h-4 w-4 text-teal-600 dark:text-teal-300" />
                  <input
                    className="input-field"
                    placeholder="Search shipments"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>

                <div className="input-shell sm:w-56">
                  <select
                    className="input-field"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="">All statuses</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {shipments.length ? (
                shipments.map((shipment) => (
                  <div key={shipment._id} className="surface p-5">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-semibold">{shipment.trackingId}</h3>
                          <StatusBadge status={shipment.status} />
                        </div>
                        <p className="mt-3 text-sm leading-6" style={{ color: "rgb(var(--muted))" }}>
                          {shipment.sender.name} to {shipment.receiver.name}
                        </p>
                        <p className="mt-1 text-sm leading-6" style={{ color: "rgb(var(--muted))" }}>
                          {shipment.deliveryType} service, booked by {shipment.user?.name || "Unknown user"} on {formatDate(shipment.createdAt)}
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="surface-strong px-4 py-3 text-sm font-semibold">
                          Rs. {shipment.price}
                        </div>
                        <div className="input-shell min-w-[14rem]">
                          <select
                            className="input-field"
                            value={shipment.status}
                            disabled={updatingId === shipment._id}
                            onChange={(event) => handleStatusUpdate(shipment._id, event.target.value)}
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          {updatingId === shipment._id ? (
                            <LoaderCircle className="h-4 w-4 animate-spin text-teal-600 dark:text-teal-300" />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No shipments found"
                  copy="Try another search or status filter to view matching courier records."
                />
              )}
            </div>
          </div>
        ) : null}

        {activeTab === "users" ? (
          <div className="mt-8 grid gap-4">
            {users.length ? (
              users.map((managedUser) => (
                <div key={managedUser._id} className="surface p-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-semibold">{managedUser.name}</h3>
                        <span className="status-pill bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100">
                          {managedUser.role}
                        </span>
                        <span
                          className={`status-pill ${
                            managedUser.isActive
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200"
                          }`}
                        >
                          {managedUser.isActive ? "Active" : "Disabled"}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6" style={{ color: "rgb(var(--muted))" }}>
                        {managedUser.email}
                      </p>
                      <p className="mt-1 text-sm leading-6" style={{ color: "rgb(var(--muted))" }}>
                        {managedUser.totalShipments} shipment(s) created
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="input-shell sm:w-44">
                        <UserCog className="h-4 w-4 text-teal-600 dark:text-teal-300" />
                        <select
                          className="input-field"
                          value={managedUser.role}
                          disabled={updatingId === managedUser._id}
                          onChange={(event) =>
                            handleUserUpdate(managedUser._id, { role: event.target.value })
                          }
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      <button
                        className="btn-secondary"
                        disabled={updatingId === managedUser._id}
                        onClick={() =>
                          handleUserUpdate(managedUser._id, {
                            isActive: !managedUser.isActive
                          })
                        }
                        type="button"
                      >
                        {updatingId === managedUser._id ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : null}
                        {managedUser.isActive ? "Disable user" : "Enable user"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No users available"
                copy="Once people create accounts, you will be able to review and manage them here."
              />
            )}
          </div>
        ) : null}
      </section>
    </Layout>
  );
};

export default AdminDashboard;
