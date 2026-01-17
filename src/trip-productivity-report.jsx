import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, RefreshCw, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

const parseAmount = (v) => {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const parseTripNumberValue = (tripNumber) => {
  if (!tripNumber) return 0;
  const m = String(tripNumber).match(/TRIP(\d+)/i);
  return m ? parseInt(m[1], 10) || 0 : 0;
};

const formatINR = (n) =>
  (parseAmount(n)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const parseMaybeJson = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'object') return v;
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

const normalizeExpenseTypeName = (raw) => String(raw || '').trim().toLowerCase();
const isFuelType = (raw) => {
  const t = normalizeExpenseTypeName(raw);
  return t === 'fuel' || t.includes('fuel') || t.includes('diesel') || t.includes('cng');
};
const isTollType = (raw) => normalizeExpenseTypeName(raw).includes('toll');
const isBhattaType = (raw) => normalizeExpenseTypeName(raw).includes('bhatta');
const isSalaryType = (raw) => normalizeExpenseTypeName(raw).includes('salary') || normalizeExpenseTypeName(raw).includes('wages');

const getFreightFromLR = (lr) => {
  if (!lr) return 0;
  // Prefer totalAmount if present
  const direct =
    lr.totalAmount ??
    lr.freight ??
    lr.totalFreight ??
    lr.amount ??
    lr.total ??
    lr.charges?.totalAmount ??
    lr.charges?.freight ??
    lr.data?.totalAmount ??
    lr.data?.freight;
  return parseAmount(direct);
};

const normalizeTrip = (trip) => {
  if (!trip) return trip;
  const parsedData = parseMaybeJson(trip.data) || null;
  const merged = parsedData ? { ...trip, ...parsedData } : trip;

  // Some fields are stored as JSON strings in SQLite; normalize them.
  const selectedLRsParsed = parseMaybeJson(merged.selectedLRs) ?? merged.selectedLRs;
  const expensesParsed = parseMaybeJson(merged.expenses) ?? merged.expenses;
  const fuelEntriesParsed = parseMaybeJson(merged.fuelEntries) ?? merged.fuelEntries;
  const finalizedParsed = parseMaybeJson(merged.finalizedData) ?? merged.finalizedData;

  return {
    ...merged,
    selectedLRs: Array.isArray(selectedLRsParsed)
      ? selectedLRsParsed
          .map((x) => (x && typeof x === 'object' ? x.id : x))
          .filter((x) => x !== null && x !== undefined)
      : (merged.selectedLRs || []),
    expenses: Array.isArray(expensesParsed) ? expensesParsed : (merged.expenses || []),
    fuelEntries: Array.isArray(fuelEntriesParsed) ? fuelEntriesParsed : (merged.fuelEntries || []),
    finalizedData: (finalizedParsed && typeof finalizedParsed === 'object') ? finalizedParsed : (merged.finalizedData || {}),
  };
};

const normalizeManifestLRIds = (selectedLRs) => {
  if (!selectedLRs) return [];
  let arr = selectedLRs;
  if (typeof arr === 'string') {
    try {
      arr = JSON.parse(arr);
    } catch (e) {
      arr = [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => (x && typeof x === 'object' ? x.id : x))
    .filter((x) => x !== null && x !== undefined)
    .map((x) => x.toString());
};

export default function TripProductivityReport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [trips, setTrips] = useState([]);
  const [manifests, setManifests] = useState([]);
  const [lrAll, setLrAll] = useState([]);

  const [filters, setFilters] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
    search: '',
    includeClosed: true,
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const syncService = (await import('./utils/sync-service')).default;

      const [tripsRes, manifestsRes, lrRes, ptlRes, ftlRes] = await Promise.all([
        syncService.load('trips'),
        syncService.load('manifests'),
        syncService.load('lrBookings'),
        syncService.load('ptlLRBookings'),
        syncService.load('ftlLRBookings'),
      ]);

      const tripsArr = (Array.isArray(tripsRes) ? tripsRes : (tripsRes?.data || [])).map(normalizeTrip);
      const manifestsArr = Array.isArray(manifestsRes) ? manifestsRes : (manifestsRes?.data || []);
      const lrArr = [
        ...(Array.isArray(lrRes) ? lrRes : (lrRes?.data || [])),
        ...(Array.isArray(ptlRes) ? ptlRes : (ptlRes?.data || [])),
        ...(Array.isArray(ftlRes) ? ftlRes : (ftlRes?.data || [])),
      ];

      setTrips(tripsArr);
      setManifests(manifestsArr);
      setLrAll(lrArr);
    } catch (e) {
      setError(e?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleSync = () => loadData();
    window.addEventListener('tripCreated', handleSync);
    window.addEventListener('tripUpdated', handleSync);
    window.addEventListener('manifestCreated', handleSync);
    window.addEventListener('manifestUpdated', handleSync);
    window.addEventListener('dataSyncedFromServer', handleSync);
    return () => {
      window.removeEventListener('tripCreated', handleSync);
      window.removeEventListener('tripUpdated', handleSync);
      window.removeEventListener('manifestCreated', handleSync);
      window.removeEventListener('manifestUpdated', handleSync);
      window.removeEventListener('dataSyncedFromServer', handleSync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lrById = useMemo(() => {
    const map = new Map();
    lrAll.forEach((lr) => {
      if (lr && lr.id != null) map.set(lr.id.toString(), lr);
    });
    return map;
  }, [lrAll]);

  const manifestById = useMemo(() => {
    const map = new Map();
    manifests.forEach((m) => {
      if (m && m.id != null) map.set(m.id.toString(), m);
    });
    return map;
  }, [manifests]);

  const tripGroups = useMemo(() => {
    const from = filters.from;
    const to = filters.to;
    const search = filters.search.trim().toLowerCase();

    const byTripNumber = new Map();

    trips.forEach((tRaw) => {
      const t = normalizeTrip(tRaw);
      if (!t) return;

      const tripDate = t.tripDate || t.createdAt?.split('T')?.[0] || '';
      if (from && tripDate && tripDate < from) return;
      if (to && tripDate && tripDate > to) return;
      if (!filters.includeClosed && String(t.status || '').toLowerCase() === 'closed') return;

      const tripNo = (t.tripNumber || '').toString();
      if (search) {
        const hay = `${tripNo} ${t.origin || ''} ${t.destination || ''} ${t.marketVehicleNumber || ''}`.toLowerCase();
        if (!hay.includes(search)) return;
      }

      const key = tripNo || `ID-${t.id}`;
      const existing = byTripNumber.get(key) || { tripNumber: tripNo, trips: [] };
      existing.trips.push(t);
      byTripNumber.set(key, existing);
    });

    const groups = Array.from(byTripNumber.values());
    groups.sort((a, b) => parseTripNumberValue(b.tripNumber) - parseTripNumberValue(a.tripNumber));

    return groups.map((g) => {
      const tripNos = g.tripNumber;
      const tripDates = g.trips
        .map((t) => t.tripDate)
        .filter(Boolean)
        .sort();

      const firstTrip = g.trips[0] || {};
      const tripType = firstTrip.tripType || 'N/A';
      const vehicleType = firstTrip.vehicleType || 'N/A';

      const routes = Array.from(
        new Set(
          g.trips
            .map((t) => {
              const o = t.origin || '';
              const d = t.destination || '';
              if (!o && !d) return null;
              return `${o || 'N/A'} → ${d || 'N/A'}`;
            })
            .filter(Boolean)
        )
      );

      // Revenue: collect LR IDs from PTL manifests + FTL selectedLRs across all trips in group
      const lrIds = new Set();
      const manifestIds = new Set();

      g.trips.forEach((t) => {
        if (t.tripType === 'PTL' && t.selectedManifest) {
          manifestIds.add(t.selectedManifest.toString());
          const m = manifestById.get(t.selectedManifest.toString());
          normalizeManifestLRIds(m?.selectedLRs).forEach((id) => lrIds.add(id));
        }
        if (t.tripType === 'FTL' && Array.isArray(t.selectedLRs)) {
          t.selectedLRs.map((x) => x?.toString?.() ?? String(x)).forEach((id) => lrIds.add(id));
        }
      });

      const revenue = Array.from(lrIds).reduce((sum, id) => sum + getFreightFromLR(lrById.get(id)), 0);

      // Expenses aggregation
      const expenseTotals = {
        fuel: 0,
        toll: 0,
        bhatta: 0,
        salary: 0,
        other: 0,
        dieselFinalized: 0,
        secondDriver: 0,
      };

      g.trips.forEach((t) => {
        const expenses = Array.isArray(t.expenses) ? t.expenses : [];
        expenses.forEach((e) => {
          const type = (e.expenseType || e.type || e.name || 'Other').toString();
          const amt = parseAmount(e.amount);
          if (!amt) return;
          if (isFuelType(type)) expenseTotals.fuel += amt;
          else if (isTollType(type)) expenseTotals.toll += amt;
          else if (isBhattaType(type)) expenseTotals.bhatta += amt;
          else if (isSalaryType(type)) expenseTotals.salary += amt;
          else expenseTotals.other += amt;
        });

        const fuelEntries = Array.isArray(t.fuelEntries) ? t.fuelEntries : [];
        fuelEntries.forEach((fe) => {
          expenseTotals.fuel += parseAmount(fe.fuelAmount);
        });

        // Finalize matrix
        const fd = t.finalizedData || {};
        expenseTotals.dieselFinalized += parseAmount(fd.dieselAmount);
        expenseTotals.bhatta += parseAmount(fd.otherExpensesMatrix?.bhatta?.amount);
        expenseTotals.salary += parseAmount(fd.otherExpensesMatrix?.salary?.amount);
        expenseTotals.secondDriver += parseAmount(fd.otherExpensesMatrix?.secondDriver?.amount);

        // Daily wages if stored on trip
        if (String(t.driverSalaryType || '').toLowerCase() === 'daily') {
          expenseTotals.salary += parseAmount(t.totalWages);
        }
      });

      const totalExpense =
        expenseTotals.fuel +
        expenseTotals.toll +
        expenseTotals.bhatta +
        expenseTotals.salary +
        expenseTotals.other +
        expenseTotals.dieselFinalized +
        expenseTotals.secondDriver;

      const profit = revenue - totalExpense;

      return {
        key: g.tripNumber || `ID-${g.trips[0]?.id}`,
        tripNumber: tripNos || 'N/A',
        tripType,
        vehicleType,
        dateFrom: tripDates[0] || firstTrip.tripDate || 'N/A',
        dateTo: tripDates[tripDates.length - 1] || firstTrip.tripDate || 'N/A',
        routes: routes.length ? routes.join(' | ') : 'N/A',
        manifestCount: manifestIds.size,
        lrCount: lrIds.size,
        revenue,
        expenseTotals,
        totalExpense,
        profit,
        trips: g.trips,
      };
    });
  }, [filters.from, filters.to, filters.search, filters.includeClosed, trips, manifestById, lrById]);

  const downloadExcel = () => {
    const rows = [
      [
        'Trip Number',
        'From Date',
        'To Date',
        'Trip Type',
        'Vehicle Type',
        'Route(s)',
        'Manifests',
        'LRs',
        'Freight Revenue',
        'Fuel Expense',
        'Diesel (Finalized)',
        'Toll',
        'Bhatta',
        'Salary',
        'Second Driver',
        'Other',
        'Total Expense',
        'Profit/Loss',
      ],
      ...tripGroups.map((g) => [
        g.tripNumber,
        g.dateFrom,
        g.dateTo,
        g.tripType,
        g.vehicleType,
        g.routes,
        g.manifestCount,
        g.lrCount,
        g.revenue,
        g.expenseTotals.fuel,
        g.expenseTotals.dieselFinalized,
        g.expenseTotals.toll,
        g.expenseTotals.bhatta,
        g.expenseTotals.salary,
        g.expenseTotals.secondDriver,
        g.expenseTotals.other,
        g.totalExpense,
        g.profit,
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trip Productivity');
    XLSX.writeFile(wb, `Trip_Productivity_${filters.from}_to_${filters.to}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center">
              <BarChart3 size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Trip Productivity Report</h1>
              <div className="text-sm text-slate-600">
                Revenue from assigned PTL manifests / FTL LRs, and expenses from Trip Management (fuel, toll, bhatta, salary, others).
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadData}
              className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              type="button"
              onClick={downloadExcel}
              className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2"
              disabled={loading || tripGroups.length === 0}
            >
              <Download size={16} />
              Export Excel
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-xs font-semibold text-slate-600">From</label>
              <input
                type="date"
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg"
                value={filters.from}
                onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">To</label>
              <input
                type="date"
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg"
                value={filters.to}
                onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Search</label>
              <div className="mt-1 flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
                <Search size={16} className="text-slate-400" />
                <input
                  className="w-full outline-none"
                  placeholder="Trip number / route / vehicle..."
                  value={filters.search}
                  onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="includeClosed"
                type="checkbox"
                checked={filters.includeClosed}
                onChange={(e) => setFilters((p) => ({ ...p, includeClosed: e.target.checked }))}
              />
              <label htmlFor="includeClosed" className="text-sm text-slate-700">
                Include Closed Trips
              </label>
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4">{error}</div>
        ) : null}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-700">
              {loading ? 'Loading…' : `${tripGroups.length} trip(s)`}
            </div>
            <div className="text-xs text-slate-500">
              Fuel includes: Trip expenses (Fuel) + Fuel Entries. Diesel(Finalized) is shown separately.
            </div>
          </div>

          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-slate-600">
                  <th className="px-3 py-2">Trip</th>
                  <th className="px-3 py-2">Dates</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Route(s)</th>
                  <th className="px-3 py-2 text-right">Revenue (₹)</th>
                  <th className="px-3 py-2 text-right">Fuel (₹)</th>
                  <th className="px-3 py-2 text-right">Diesel Final (₹)</th>
                  <th className="px-3 py-2 text-right">Toll (₹)</th>
                  <th className="px-3 py-2 text-right">Bhatta (₹)</th>
                  <th className="px-3 py-2 text-right">Salary (₹)</th>
                  <th className="px-3 py-2 text-right">Other (₹)</th>
                  <th className="px-3 py-2 text-right">Total Exp (₹)</th>
                  <th className="px-3 py-2 text-right">Profit (₹)</th>
                </tr>
              </thead>
              <tbody>
                {tripGroups.map((g) => (
                  <tr key={g.key} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-semibold text-slate-800">
                      {g.tripNumber}
                      <div className="text-xs text-slate-500">
                        Manifests: {g.manifestCount} • LRs: {g.lrCount}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {g.dateFrom === g.dateTo ? g.dateFrom : `${g.dateFrom} → ${g.dateTo}`}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {g.tripType} • {g.vehicleType}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{g.routes}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-800">₹{formatINR(g.revenue)}</td>
                    <td className="px-3 py-2 text-right">₹{formatINR(g.expenseTotals.fuel)}</td>
                    <td className="px-3 py-2 text-right">₹{formatINR(g.expenseTotals.dieselFinalized)}</td>
                    <td className="px-3 py-2 text-right">₹{formatINR(g.expenseTotals.toll)}</td>
                    <td className="px-3 py-2 text-right">₹{formatINR(g.expenseTotals.bhatta)}</td>
                    <td className="px-3 py-2 text-right">₹{formatINR(g.expenseTotals.salary + g.expenseTotals.secondDriver)}</td>
                    <td className="px-3 py-2 text-right">₹{formatINR(g.expenseTotals.other)}</td>
                    <td className="px-3 py-2 text-right font-semibold">₹{formatINR(g.totalExpense)}</td>
                    <td className={`px-3 py-2 text-right font-semibold ${g.profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      ₹{formatINR(g.profit)}
                    </td>
                  </tr>
                ))}
                {!loading && tripGroups.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-10 text-center text-slate-500">
                      No trips found for the selected filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

