// IntData.jsx
import React, { useEffect, useState } from 'react';

const IntData = () => {
  const [intData, setIntData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/int')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Int data:', data);
        setIntData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching int data:', error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="loading">Loading int data...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="int-data-container">
      <h2>Player moves</h2>
      {intData.length === 0 ? (
        <p>No moves made : </p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Int ID</th>
              <th>Value</th>
              <th>Description</th>
              <th>Created At</th>
              <th>Updated At</th>
            </tr>
          </thead>
          <tbody>
            {intData.map(item => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.int_id}</td>
                <td>{item.value}</td>
                <td>{item.description}</td>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
                <td>{new Date(item.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default IntData;