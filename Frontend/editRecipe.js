// Get token
const token = localStorage.getItem("token");

// Get recipe ID from URL
const params = new URLSearchParams(window.location.search);
const recipeId = params.get("id");

// If no ID, redirect
if (!recipeId) {
    alert("No recipe selected.");
    window.location.href = "recipes.html";
}

// Load recipe into form
async function loadRecipe() {
    try {
        const res = await fetch(`http://localhost:3000/recipes/${recipeId}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error("Failed to fetch recipe");
        }

        const recipe = await res.json();

        document.getElementById("title").value = recipe.title || "";
        document.getElementById("description").value = recipe.description || "";
        document.getElementById("estimated_time").value = recipe.estimated_time || "";

    } catch (err) {
        console.error("Load error:", err);
        alert("Failed to load recipe.");
    }
}

// Update recipe
async function updateRecipe() {
    console.log("Update clicked"); // 🔥 debug

    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const estimated_time = document.getElementById("estimated_time").value.trim();

    if (!title || !description) {
        alert("Title and description are required.");
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/recipes/${recipeId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ title, description, estimated_time })
        });

        const data = await res.json();

        if (res.ok) {
            alert("Recipe updated successfully!");
            localStorage.setItem('recipes_last_updated', Date.now().toString());
            window.location.href = "recipes.html";
        } else {
            alert(data.error || "Failed to update recipe.");
        }

    } catch (err) {
        console.error("Update error:", err);
        alert("Server error. Please try again.");
    }
}

// Run when page loads
document.addEventListener("DOMContentLoaded", () => {

    if (!token) {
        alert("You must be logged in.");
        window.location.href = "index.html";
        return;
    }

    loadRecipe();

    // FORM SUBMIT HANDLER (KEY FIX)
    const form = document.getElementById("editRecipeForm");

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        updateRecipe();
    });
});