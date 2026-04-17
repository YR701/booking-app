// Author: Yongrong Yang

// helper function for UserDashboard and BookingPage 
// to open slots and appointments email function
export const openQuestionMail = ({
    email,
    ownerName = 'Professor',
    topic = 'booking slot',
    whenText = '',
    senderName = 'Student',
    onMissingEmail,
}) => {
    if (!email) {
        if (typeof onMissingEmail === 'function') {
            onMissingEmail();
        }
        return false;
    }

    const link = createQuestionMailto({
        email,
        ownerName,
        topic,
        whenText,
        senderName,
    });

    if (!link) {
        return false;
    }

    window.location.href = link;
    return true;
};

// shared template for emails and check mailto link validity
export const createQuestionMailto = ({
    email,
    ownerName = 'Professor',
    topic = 'booking slot',
    whenText = '',
    senderName = 'Student',
}) => {
    const Topic = topic || 'booking slot';
    const OwnerName = ownerName || 'Professor';
    const SenderName = senderName || 'Student';
    const time = whenText ? ` on ${whenText}` : '';

    const subject = `Question about ${Topic}`;
    const body = `Hello ${OwnerName},\n\nI have a question about ${Topic}${time}.\n\nThanks,\n${SenderName}`;

    if (!email) {
        return '';
    }

    const params = new URLSearchParams();

    if (typeof subject === 'string' && subject.trim()) {
        params.set('subject', subject);
    }

    if (typeof body === 'string' && body.trim()) {
        params.set('body', body);
    }

    const query = params.toString();
    return query ? `mailto:${email}?${query}` : `mailto:${email}`;
};


