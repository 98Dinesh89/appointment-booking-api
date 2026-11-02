const BASE_URL = process.env.BASE_URL || 'http://localhost:5000/api';
const PARALLEL_REQUESTS = Number(process.env.PARALLEL_REQUESTS) || 6;
const PASSWORD = 'Password@123';

const users = [
    { name: 'Test User', email: 'user@example.com' },
    { name: 'Race User', email: 'race.user@example.com' },
];

async function request(path, { method = 'GET', token, body } = {}) {
    const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    return { status: response.status, data };
}

async function loginOrRegister({ name, email }) {
    const login = await request('/auth/login', {
        method: 'POST',
        body: { email, password: PASSWORD },
    });
    if (login.status === 200) return login.data.token;

    const register = await request('/auth/register', {
        method: 'POST',
        body: { name, email, password: PASSWORD },
    });
    if (register.status !== 201) {
        throw new Error(`Could not log in or register ${email}`);
    }
    return register.data.token;
}

const tokens = [];
for (const user of users) {
    tokens.push(await loginOrRegister(user));
}

const available = await request('/slots', { token: tokens[0] });
if (available.status !== 200 || available.data.slots.length === 0) {
    console.error('No available slot found. Run npm run db:seed first.');
    process.exit(1);
}

const slotId = Number(process.argv[2]) || available.data.slots[0].id;
console.log(`Slot under test: ${slotId}`);

const results = await Promise.all(
    Array.from({ length: PARALLEL_REQUESTS }, (_, index) => {
        const userIndex = index % users.length;
        return request('/bookings', {
            method: 'POST',
            token: tokens[userIndex],
            body: { slotId },
        }).then((result) => ({ ...result, userIndex }));
    })
);

results.forEach((result, index) => {
    console.log(`Request ${index + 1} (${users[result.userIndex].name}): ${result.status}`);
});

const created = results.filter((result) => result.status === 201);
const conflicts = results.filter((result) => result.status === 409);
const others = results.filter((result) => ![201, 409].includes(result.status));

console.log(
    `Summary: ${created.length} created, ${conflicts.length} conflict, ${others.length} other`
);

for (const result of created) {
    await request(`/bookings/${result.data.booking.id}/cancel`, {
        method: 'PATCH',
        token: tokens[result.userIndex],
    });
    console.log(`Cleanup: booking ${result.data.booking.id} cancelled`);
}

if (created.length !== 1 || others.length > 0) {
    process.exitCode = 1;
}