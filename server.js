const express = require('express');
const fs = require('fs');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const USERS = 'users.json';

// ===== HELPERS =====
function read(file) {
    if (!fs.existsSync(file)) return {};
    return JSON.parse(fs.readFileSync(file));
}

function write(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ===== REGISTER =====
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    let users = read(USERS);

    if (users[username]) return res.json({ error: "User exists" });

    users[username] = {
        password: await bcrypt.hash(password, 10),
        role: username === "admin" ? "admin" : "user"
    };

    write(USERS, users);
    res.json({ status: "ok" });
});

// ===== LOGIN =====
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    let users = read(USERS);

    if (!users[username]) return res.json({ error: "User not found" });

    const match = await bcrypt.compare(password, users[username].password);
    if (!match) return res.json({ error: "Wrong password" });

    res.json({
        status: "ok",
        username,
        role: users[username].role
    });
});

// ===== SAVE =====
app.post('/save', (req, res) => {
    const { username, data } = req.body;

    const dir = `notes/${username}`;
    const file = `${dir}/notes.json`;

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(file, JSON.stringify(data, null, 2));

    res.json({ status: "saved" });
});

// ===== LOAD =====
app.post('/load', (req, res) => {
    const { username } = req.body;

    const file = `notes/${username}/notes.json`;

    if (!fs.existsSync(file)) {
        return res.json({ data: { tab1: "" } });
    }

    const data = JSON.parse(fs.readFileSync(file));
    res.json({ data });
});

// GET ALL USERS
app.get('/all-users', (req, res) => {
    let users = read(USERS);
    res.json(Object.keys(users));
});

// ===== USER PASSWORD CHANGE =====
app.post('/change-password', async (req, res) => {
    const { username, oldPassword, newPassword } = req.body;

    let users = read(USERS);

    if (!users[username]) return res.json({ error: "User not found" });

    const match = await bcrypt.compare(oldPassword, users[username].password);
    if (!match) return res.json({ error: "Wrong password" });

    users[username].password = await bcrypt.hash(newPassword, 10);
    write(USERS, users);

    res.json({ status: "Password updated" });
});

// ===== ADMIN GET USER NOTES =====
app.post('/admin/user', (req, res) => {
    const { admin, targetUser } = req.body;

    let users = read(USERS);

    if (!users[admin] || users[admin].role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
    }

    const file = `notes/${targetUser}/notes.json`;

    if (!fs.existsSync(file)) {
        return res.json({ error: "User not found" });
    }

    const data = JSON.parse(fs.readFileSync(file));
    res.json({ data });
});

// ===== ADMIN RESET PASSWORD =====
app.post('/admin/reset-password', async (req, res) => {
    const { admin, targetUser, newPassword } = req.body;

    let users = read(USERS);

    if (!users[admin] || users[admin].role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
    }

    if (!users[targetUser]) {
        return res.json({ error: "User not found" });
    }

    users[targetUser].password = await bcrypt.hash(newPassword, 10);
    write(USERS, users);

    res.json({ status: "Password reset successful" });
});

app.listen(3000, () => console.log("🚀 http://localhost:3000"));