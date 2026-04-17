/* Author: Yongrong Yang */

import { useState } from 'react';
import { API_BASE, TOKEN_KEY } from '../config';
import { formatDateTimeRange } from '../utils/formatTime';

function Type1OwnerIncomingRequest({
    ownerRequests = [],
    onRefreshData,
}) {
    const [localMessage, setLocalMessage] = useState('');
    const [localError, setLocalError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleApproveRequest = async (requestId) => {
        setLocalMessage('');
        setLocalError('');
        setLoading(true);

        try {
            const token = localStorage.getItem(TOKEN_KEY);
            const response = await fetch(`${API_BASE}/meetings/requests/${requestId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ status: 'Approved' }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || 'Request failed.');
            }

            setLocalMessage('Request approved.');
            if (onRefreshData) {
                onRefreshData();
            }
        } catch (err) {
            setLocalError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const handleRejectRequest = async (requestId) => {
        setLocalMessage('');
        setLocalError('');
        setLoading(true);

        try {
            const token = localStorage.getItem(TOKEN_KEY);
            const response = await fetch(`${API_BASE}/meetings/requests/${requestId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ status: 'Rejected' }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || 'Request failed.');
            }

            setLocalMessage('Request rejected.');
            if (onRefreshData) {
                onRefreshData();
            }
        } catch (err) {
            setLocalError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="request-panel">
        <h2>Incoming Meeting Requests</h2>

        {ownerRequests?.length === 0 ? (
          <p>No incoming requests.</p>
        ) : (
          <div className="list">
            {ownerRequests.map((request) => (
              <div className="item" key={request.id}>
                <p><strong>{request.title}</strong></p>
                <p>
                  From: {request.requester?.name || 'Unknown'} ({request.requester?.email || 'N/A'})
                </p>
                <p>
                  {formatDateTimeRange(request.start, request.end)}
                </p>
                <p>Status: {request.status}</p>
                <p>{request.reason}</p>

                {request.status === 'Pending' && (
                  <div className="actions">
                    <button type="button" onClick={() => handleApproveRequest(request.id)}>
                      Approve
                    </button>
                    <button type="button" onClick={() => handleRejectRequest(request.id)}>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    )
}

export default Type1OwnerIncomingRequest