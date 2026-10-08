import React, { useState, useEffect } from 'react';

function App() {
  const [summary, setSummary] = useState({});
  const [sites, setSites] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [instSearch, setInstSearch] = useState('');
  const [instStatusFilter, setInstStatusFilter] = useState('All');

  const [siteForm, setSiteForm] = useState({ id: null, name: '', location: '', status: 'Active' });
  const [instForm, setInstForm] = useState({ id: null, site_id: '', activity_name: '', status: 'Pending' });

  const loadData = () => {
    fetch('http://localhost:5000/api/dashboard/summary').then((r) => r.json()).then(setSummary);
    fetch(`http://localhost:5000/api/sites?search=${search}&status=${statusFilter}`).then((r) => r.json()).then((d) => setSites(Array.isArray(d) ? d : []));
    fetch(`http://localhost:5000/api/installations?search=${instSearch}&status=${instStatusFilter}`).then((r) => r.json()).then((d) => setInstallations(Array.isArray(d) ? d : []));
  };

  useEffect(loadData, [search, statusFilter, instSearch, instStatusFilter]);

  const saveSite = (e) => {
    e.preventDefault();
    const isEdit = siteForm.id !== null;
    fetch(isEdit ? `http://localhost:5000/api/sites/${siteForm.id}` : 'http://localhost:5000/api/sites', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: siteForm.name, location: siteForm.location, status: siteForm.status }),
    }).then(() => { setSiteForm({ id: null, name: '', location: '', status: 'Active' }); loadData(); });
  };

  const deleteSite = (id) => {
    if (window.confirm('Delete site?')) fetch(`http://localhost:5000/api/sites/${id}`, { method: 'DELETE' }).then(loadData);
  };

  const saveInst = (e) => {
    e.preventDefault();
    const isEdit = instForm.id !== null;
    fetch(isEdit ? `http://localhost:5000/api/installations/${instForm.id}` : 'http://localhost:5000/api/installations', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site_id: instForm.site_id, activity_name: instForm.activity_name, status: instForm.status }),
    }).then(() => { setInstForm({ id: null, site_id: '', activity_name: '', status: 'Pending' }); loadData(); });
  };

  const deleteInst = (id) => {
    if (window.confirm('Delete task?')) fetch(`http://localhost:5000/api/installations/${id}`, { method: 'DELETE' }).then(loadData);
  };

  const printReport = () => {
    const win = window.open('', '_blank');
    win.document.write(`
      <div style="font-family:monospace; width:280px; padding:10px; border:1px dashed #000;">
        <h3 style="text-align:center;">SITE OPS RECEIPT</h3>
        <p>Total Sites: ${summary.total_sites || 0}</p>
        <p>Total Tasks: ${summary.total_installations || 0}</p>
        <p>Active Tasks: ${summary.active_installations || 0}</p>
        <hr/>
        <h4>SITES</h4>
        ${sites.map((s) => `<div>${s.id}. ${s.name} (${s.status})</div>`).join('')}
        <hr/>
        <h4>TASKS</h4>
        ${installations.map((i) => `<div>${i.id}. ${i.activity_name} -${i.status}</div>`).join('')}
      </div>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f4f6f9', minHeight: '100vh', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#1e293b', margin: 0 }}>Site Operations Dashboard</h1>
        <button onClick={printReport} style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Print Report Remove</button>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '24px' }}>
        <div style={{ background: '#e0e7ff', borderLeft: '4px solid #4f46e5', padding: '16px', borderRadius: '8px', flex: 1 }}>
          <span style={{ color: '#3730a3', fontSize: '14px' }}>Total Sites</span>
          <h2 style={{ margin: '4px 0 0', color: '#1e1b4b' }}>{summary.total_sites || 0}</h2>
        </div>
        <div style={{ background: '#e0f2fe', borderLeft: '4px solid #0ea5e9', padding: '16px', borderRadius: '8px', flex: 1 }}>
          <span style={{ color: '#075985', fontSize: '14px' }}>Total Installations</span>
          <h2 style={{ margin: '4px 0 0', color: '#0c4a6e' }}>{summary.total_installations || 0}</h2>
        </div>
        <div style={{ background: '#dcfce7', borderLeft: '4px solid #10b981', padding: '16px', borderRadius: '8px', flex: 1 }}>
          <span style={{ color: '#166534', fontSize: '14px' }}>Active Tasks</span>
          <h2 style={{ margin: '4px 0 0', color: '#052e16' }}>{summary.active_installations || 0}</h2>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
        <form onSubmit={saveSite} style={{ flex: 1, background: '#eef2ff', padding: '18px', borderRadius: '8px', border: '1px solid #c7d2fe' }}>
          <h3 style={{ marginTop: 0, color: '#312e81' }}>{siteForm.id ? 'Edit Site' : 'Add Site'}</h3>
          <input placeholder="Name" value={siteForm.name} onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #a5b4fc', marginRight: '6px' }} />
          <input placeholder="Location" value={siteForm.location} onChange={(e) => setSiteForm({ ...siteForm, location: e.target.value })} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #a5b4fc', marginRight: '6px' }} />
          <select value={siteForm.status} onChange={(e) => setSiteForm({ ...siteForm, status: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #a5b4fc' }}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button type="submit" style={{ marginLeft: '8px', padding: '8px 14px', background: '#4338ca', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
        </form>

        <form onSubmit={saveInst} style={{ flex: 1, background: '#fae8ff', padding: '18px', borderRadius: '8px', border: '1px solid #f5d0fe' }}>
          <h3 style={{ marginTop: 0, color: '#701a75' }}>{instForm.id ? 'Edit Task' : 'Add Task'}</h3>
          <select value={instForm.site_id} onChange={(e) => setInstForm({ ...instForm, site_id: e.target.value })} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #f0abfc', marginRight: '6px' }}>
            <option value="">Select Site...</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input placeholder="Activity Name" value={instForm.activity_name} onChange={(e) => setInstForm({ ...instForm, activity_name: e.target.value })} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #f0abfc', marginRight: '6px' }} />
          <select value={instForm.status} onChange={(e) => setInstForm({ ...instForm, status: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #f0abfc' }}>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
          <button type="submit" style={{ marginLeft: '8px', padding: '8px 14px', background: '#a21caf', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
        </form>
      </div>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
        <h2 style={{ marginTop: 0, color: '#1e293b' }}>Sites List</h2>
        <div style={{ marginBottom: '12px' }}>
          <input placeholder="Search site or location..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', marginRight: '8px' }} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', color: '#475569' }}>
              <th style={{ padding: '10px' }}>ID</th>
              <th style={{ padding: '10px' }}>Name</th>
              <th style={{ padding: '10px' }}>Location</th>
              <th style={{ padding: '10px' }}>Status</th>
              <th style={{ padding: '10px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px' }}>{s.id}</td>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>{s.name}</td>
                <td style={{ padding: '10px' }}>{s.location}</td>
                <td style={{ padding: '10px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '12px', background: s.status === 'Active' ? '#dcfce7' : '#fee2e2', color: s.status === 'Active' ? '#166534' : '#991b1b' }}>
                    {s.status}
                  </span>
                </td>
                <td style={{ padding: '10px' }}>
                  <button onClick={() => setSiteForm(s)} style={{ padding: '4px 8px', background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '4px' }}>Edit</button>
                  <button onClick={() => deleteSite(s.id)} style={{ padding: '4px 8px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginTop: 0, color: '#1e293b' }}>Installations / Tasks List</h2>
        <div style={{ marginBottom: '12px' }}>
          <input placeholder="Search task or site..." value={instSearch} onChange={(e) => setInstSearch(e.target.value)} style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', marginRight: '8px' }} />
          <select value={instStatusFilter} onChange={(e) => setInstStatusFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', color: '#475569' }}>
              <th style={{ padding: '10px' }}>ID</th>
              <th style={{ padding: '10px' }}>Site Name</th>
              <th style={{ padding: '10px' }}>Activity Name</th>
              <th style={{ padding: '10px' }}>Status</th>
              <th style={{ padding: '10px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {installations.map((i) => (
              <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px' }}>{i.id}</td>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>{i.site_name}</td>
                <td style={{ padding: '10px' }}>{i.activity_name}</td>
                <td style={{ padding: '10px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '12px', background: i.status === 'Completed' ? '#dcfce7' : i.status === 'In Progress' ? '#e0f2fe' : '#fef3c7', color: i.status === 'Completed' ? '#166534' : i.status === 'In Progress' ? '#075985' : '#92400e' }}>
                    {i.status}
                  </span>
                </td>
                <td style={{ padding: '10px' }}>
                  <button onClick={() => setInstForm(i)} style={{ padding: '4px 8px', background: '#fae8ff', color: '#86198f', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '4px' }}>Edit</button>
                  <button onClick={() => deleteInst(i.id)} style={{ padding: '4px 8px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;