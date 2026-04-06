let user = localStorage.getItem("user");

// redirect
if (!user && location.pathname.includes("dashboard")) {
    location.href = "index.html";
}

// ===== AUTH =====
async function login() {
    const res = await fetch('/login', {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
            username: document.getElementById("username").value,
            password: document.getElementById("password").value
        })
    });

    const data = await res.json();

    if (data.status === "ok") {
        localStorage.setItem("user", data.username);
        localStorage.setItem("role", data.role);

        location.href = data.role === "admin" ? "admin.html" : "dashboard.html";
    } else alert(data.error);
}

async function register() {
    await fetch('/register', {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
            username: document.getElementById("username").value,
            password: document.getElementById("password").value
        })
    });

    alert("Registered");
}

function logout() {
    localStorage.clear();
    location.href = "index.html";
}

// ===== NOTES =====
let notes = { tab1:"" };
let current = "tab1";

function addTab(){
    saveCurrent();
    const name="tab"+(Object.keys(notes).length+1);
    notes[name]="";
    render();
    switchTab(name);
}
function clearAllTabs() {
    if (confirm("Delete ALL tabs?")) {
        notes = { "Tab-1": "" };
        current = "Tab-1";

        render();
        document.getElementById("note").value = "";
    }
}
function switchTab(t){
    saveCurrent();
    current=t;
    document.getElementById("note").value=notes[t]||"";
    render();
}

function saveCurrent(){
    const note=document.getElementById("note");
    if(note) notes[current]=note.value;
}
function render() {
    const d = document.getElementById("tabs");
    if (!d) return;

    d.innerHTML = "";

    for (let t in notes) {

        const wrap = document.createElement("div");
        wrap.style.display = "inline-flex";
        wrap.style.alignItems = "center";
        wrap.style.marginRight = "10px";

        // TAB BUTTON
        const btn = document.createElement("button");
        btn.innerText = t;
        btn.style.padding = "5px 10px";
        btn.style.background = (t === current) ? "blue" : "gray";
        btn.style.color = "white";
        btn.style.border = "none";
        btn.style.cursor = "pointer";

        btn.onclick = () => switchTab(t);

        // ❌ DELETE BUTTON
        const del = document.createElement("span");
        del.innerText = " ❌";
        del.style.cursor = "pointer";
        del.style.marginLeft = "5px";
        del.style.fontSize = "14px";

        del.onclick = (e) => {
            e.stopPropagation();

            if (Object.keys(notes).length === 1) {
                alert("1 tab required");
                return;
            }

            delete notes[t];

            current = Object.keys(notes)[0];

            document.getElementById("note").value = notes[current] || "";

            render();
        };

        wrap.appendChild(btn);
        wrap.appendChild(del);

        d.appendChild(wrap);
    }
}
// SAVE
async function save(){
    saveCurrent();

    await fetch('/save',{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({username:user,data:notes})
    });

    alert("Saved");
}

// LOAD
async function load(){
    const res=await fetch('/load',{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({username:user})
    });

    const data=await res.json();

    notes=data.data||{tab1:""};
    current=Object.keys(notes)[0];

    render();
    document.getElementById("note").value=notes[current]||"";
}

// PASSWORD CHANGE
async function changePassword(){
    const res=await fetch('/change-password',{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
            username:user,
            oldPassword:document.getElementById("oldPass").value,
            newPassword:document.getElementById("newPass").value
        })
    });

    const d=await res.json();
    alert(d.error||"Updated");
}

// LOAD ALL USERS
async function loadAllUsers() {
    const res = await fetch('/all-users');
    const users = await res.json();

    const box = document.getElementById("allUsersList");
    box.innerHTML = "";

    users.forEach(u => {
        const div = document.createElement("div");

        div.innerText = u;
        div.className = "bg-gray-700 p-2 rounded cursor-pointer hover:bg-gray-600";

        div.onclick = () => {
            document.getElementById("searchUser").value = u;
            loadUser();
        };

        box.appendChild(div);
    });
}
window.onload=()=>{
    if(location.pathname.includes("dashboard")) load();
};