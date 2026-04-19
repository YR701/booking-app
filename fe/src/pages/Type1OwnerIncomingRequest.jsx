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
    const [showExpired, setShowExpired] = useState(false);

    // Separate active and expired requests based on current time
    const now = new Date();

    const activeRequests = ownerRequests.filter((req) => {
        const startTime = new Date(req.start);
        return startTime >= now;
    });
    const expiredRequests = ownerRequests.filter((req) => {
        const startTime = new Date(req.start);
        return startTime < now;
    });
    const displayRequests = showExpired ? expiredRequests : activeRequests;

    const openRequestStatusMail = (request, status) => {
        const requesterEmail = request?.requester?.email;
        if (!requesterEmail) {
            return;
        }

        const subject = `Meeting request ${status.toLowerCase()}`;
        const body = [
            `Hello ${request?.requester?.name || 'Student'},`,
            '',
            `Your meeting request "${request?.title || 'Meeting Request'}" has been ${status.toLowerCase()}.`,
            `Time: ${formatDateTimeRange(request?.start, request?.end)}`,
            '',
            'Thanks.',
        ].join('\n');

        const params = new URLSearchParams({ subject, body });
        window.location.href = `mailto:${requesterEmail}?${params.toString()}`;
    };

    // Approve or reject a request by updating its status via API call
    const handleApproveRequest = async (request) => {
        setLocalMessage('');
        setLocalError('');
        setLoading(true);

        try {
            const token = localStorage.getItem(TOKEN_KEY);
            const response = await fetch(`${API_BASE}/meetings/requests/${request.id}`, {
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
            openRequestStatusMail(request, 'Approved');
        } catch (err) {
            setLocalError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const handleRejectRequest = async (request) => {
        setLocalMessage('');
        setLocalError('');
        setLoading(true);

        try {
            const token = localStorage.getItem(TOKEN_KEY);
            const response = await fetch(`${API_BASE}/meetings/requests/${request.id}`, {
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
            openRequestStatusMail(request, 'Rejected');
        } catch (err) {
            setLocalError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="request-panel">
            {localMessage && <p>{localMessage}</p>}
            {localError && <p>{localError}</p>}
            <div>
                <h2>Incoming Meeting Requests</h2>

                {/* switch between active and expired */}
                {expiredRequests.length > 0 && (
                    <div>
                        <button
                            type="button"
                            className={showExpired ? 'button secondary' : 'button'}
                            onClick={() => setShowExpired(false)}>
                            Active ({activeRequests.length})
                        </button>
                        <button
                            type="button"
                            className={showExpired ? 'button' : 'button secondary'}
                            onClick={() => setShowExpired(true)}>
                            Expired ({expiredRequests.length})
                        </button>
                    </div>
                )}
            </div>

            {ownerRequests?.length === 0 ? (
                <p>No incoming requests.</p>
            ) : displayRequests.length === 0 ? (
                <p>{showExpired ? 'No expired requests.' : 'No active requests.'}</p>
            ) : (
                <div className="list">
                    {displayRequests.map((request) => (
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

                            {request.status === 'Pending' && !showExpired && (
                                <div className="actions">
                                    <button type="button" onClick={() => handleApproveRequest(request)}>
                                        Approve
                                    </button>
                                    <button type="button" onClick={() => handleRejectRequest(request)}>
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