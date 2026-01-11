import React, { useState } from 'react';
import { useStaff } from '../hooks/useDataSync';

const StaffMaster = () => {
  const { data: staff, loading, error, create, update, remove } = useStaff();
  const [formData, setFormData] = useState({
    staffName: '',
    branch: '',
    designation: '',
    email: '',
    phone: '',
    address: '',
  });
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.staffName.trim()) {
      newErrors.staffName = 'Staff Name is required';
    }
    if (!formData.branch.trim()) {
      newErrors.branch = 'Branch is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      
      if (editingId) {
        await update(editingId, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        alert('✅ Staff updated on Render.com server!');
        setEditingId(null);
      } else {
        await create({
          ...formData,
          createdAt: new Date().toISOString()
        });
        alert('✅ Staff saved to Render.com server!');
      }
      
      window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'staff', data: formData } }));
      
      setFormData({
        staffName: '',
        branch: '',
        designation: '',
        email: '',
        phone: '',
        address: '',
      });
    } catch (err) {
      alert('❌ Error: ' + err.message);
      console.error('Error saving staff:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (staffMember) => {
    setFormData({
      staffName: staffMember.staffName || '',
      branch: staffMember.branch || '',
      designation: staffMember.designation || '',
      email: staffMember.email || '',
      phone: staffMember.phone || '',
      address: staffMember.address || '',
    });
    setEditingId(staffMember.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await remove(id);
        alert('✅ Staff deleted from Render.com server!');
        window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'staff', data: null } }));
      } catch (err) {
        alert('❌ Error: ' + err.message);
        console.error('Error deleting staff:', err);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '20px', textAlign: 'center' }}>
        <p>Loading staff from Render.com server...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '20px', textAlign: 'center', color: 'red' }}>
        <p>Error loading staff: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '20px' }}>
      <h2>Staff Master</h2>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label>
              Staff Name <span style={{ color: 'red' }}>*</span>
              <input
                type="text"
                name="staffName"
                value={formData.staffName}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '5px',
                  border: errors.staffName ? '1px solid red' : '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
              {errors.staffName && <span style={{ color: 'red', fontSize: '12px' }}>{errors.staffName}</span>}
            </label>
          </div>
          <div>
            <label>
              Branch <span style={{ color: 'red' }}>*</span>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '5px',
                  border: errors.branch ? '1px solid red' : '1px solid #ccc',
                  borderRadius: '4px'
                }}
              >
                <option value="">-- Select Branch --</option>
                <option value="Branch 1">Branch 1</option>
                <option value="Branch 2">Branch 2</option>
                <option value="Branch 3">Branch 3</option>
              </select>
              {errors.branch && <span style={{ color: 'red', fontSize: '12px' }}>{errors.branch}</span>}
            </label>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label>
              Designation (Optional)
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </label>
          </div>
          <div>
            <label>
              Email (Optional)
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </label>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label>
              Phone (Optional)
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </label>
          </div>
          <div>
            <label>
              Address (Optional)
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </label>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '10px 20px',
            backgroundColor: editingId ? '#ffc107' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            opacity: saving ? 0.6 : 1
          }}
        >
          {saving ? 'Saving...' : editingId ? 'Update Staff' : 'Add Staff'}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setFormData({
                staffName: '',
                branch: '',
                designation: '',
                email: '',
                phone: '',
                address: '',
              });
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              marginLeft: '10px'
            }}
          >
            Cancel
          </button>
        )}
      </form>

      <div>
        <h3>Staff List ({staff.length})</h3>
        {staff.length === 0 ? (
          <p>No staff members added yet</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {staff.map(member => (
              <div
                key={member.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: '#fff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0 }}>{member.staffName}</h4>
                  <div>
                    <button
                      onClick={() => handleEdit(member)}
                      style={{
                        padding: '5px 15px',
                        backgroundColor: '#ffc107',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '10px'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      style={{
                        padding: '5px 15px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: '14px', color: '#333' }}>
                  <div><strong>Branch:</strong> {member.branch}</div>
                  {member.designation && <div><strong>Designation:</strong> {member.designation}</div>}
                  {member.email && <div><strong>Email:</strong> {member.email}</div>}
                  {member.phone && <div><strong>Phone:</strong> {member.phone}</div>}
                  {member.address && <div><strong>Address:</strong> {member.address}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffMaster;

