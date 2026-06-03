/* ── login.js ─────────────────────────────────── */

function togglePass() {
    const input = document.getElementById("loginPass");
    input.type = input.type === "password" ? "text" : "password";
}

async function doLogin() {
    const user = document.getElementById("loginUser").value.trim();
    const pass = document.getElementById("loginPass").value.trim();
    const err  = document.getElementById("loginError");
    const btn  = document.getElementById("btnLogin");

    err.textContent = "";

    if (!user || !pass) {
        err.textContent = "❌ Completa usuario y contraseña";
        return;
    }

    btn.disabled = true;
    btn.textContent = "Verificando...";

    try {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass })
        });

        const data = await res.json();

        if (!res.ok) {
            err.textContent = "❌ " + (data.error || "Usuario o contraseña incorrectos");
            btn.disabled = false;
            btn.textContent = "Entrar →";
            return;
        }

        // Guardar token y datos de sesión
        localStorage.setItem("token", data.token);
        localStorage.setItem("rol", data.rol);
        localStorage.setItem("username", data.username);
        localStorage.setItem("nombre", data.nombre);

        // Redirigir al historial (dashboard)
        window.location.href = "./historial.html";

    } catch (e) {
        err.textContent = "❌ No se pudo conectar al servidor";
        btn.disabled = false;
        btn.textContent = "Entrar →";
    }
}

// Enter para login
document.addEventListener("keydown", e => {
    if (e.key === "Enter") doLogin();
});

// Si ya hay sesión válida, redirigir directo
(function checkSession() {
    const token = localStorage.getItem("token");
    if (token) window.location.href = "./historial.html";
})();
