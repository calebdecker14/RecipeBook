document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("shopping-modal");
    const btn = document.getElementById("shopping-list-btn");
    const closeBtn = document.querySelector(".shopping-close-btn");
    const textarea = document.getElementById("shopping-list-text");
    const saveBtn = document.getElementById("save-shopping-btn");
    const statusMsg = document.getElementById("save-status");

    btn.addEventListener("click", () => {
        modal.style.setProperty("display", "flex", "important");
        loadShoppingList();
    });

    closeBtn.addEventListener("click", () => modal.style.display = "none");

    async function saveList() {
        const content = textarea.value;
        const token = localStorage.getItem('token');

        if (!token) {
            statusMsg.textContent = "Error: No login token found.";
            return;
        }

        statusMsg.textContent = "Saving shopping list...";
        saveBtn.disabled = true;

        try {
            // FIXED: Use relative path '/' to match app.use in server.js
            const response = await fetch('/api/shopping-list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ listContent: content })
            });

            if (response.ok) {
                statusMsg.textContent = "Changes saved! ✓";
                saveBtn.textContent = "Saved!";
                saveBtn.style.backgroundColor = "#27ae60";
                
                setTimeout(() => {
                    statusMsg.textContent = "";
                    saveBtn.textContent = "Save Changes";
                    saveBtn.style.backgroundColor = "#6FB34A";
                    saveBtn.disabled = false;
                }, 2000);
            } else {
                // If the server returns a 404 or 500, we catch it here
                statusMsg.textContent = "Error: Server returned " + response.status;
                saveBtn.disabled = false;
            }
        } catch (err) {
            console.error("Save error:", err);
            statusMsg.textContent = "Network error. Is the server running?";
            saveBtn.disabled = false;
        }
    }

    saveBtn.addEventListener("click", saveList);
    textarea.addEventListener("blur", saveList);

    async function loadShoppingList() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            // FIXED: Use relative path '/'
            const res = await fetch('/api/shopping-list', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            textarea.value = data.listContent || "";
        } catch (err) {
            console.log("Error loading list.");
        }
    }

    loadShoppingList();
});
