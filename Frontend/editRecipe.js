// Get token from localStorage
const token = localStorage.getItem("token");

// Get recipe ID from URL
const params = new URLSearchParams(window.location.search);
const recipeId = params.get("id");

// Redirect if no ID (safety check)
if (!recipeId) {
    alert("No recipe selected.");
    window.location.href = "recipes.html";
}

// Load recipe data into form
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

        // Populate form fields
        document.getElementById("title").value = recipe.title || "";
        document.getElementById("description").value = recipe.description || "";

        // Optional field (only if exists in your HTML)
        const timeField = document.getElementById("estimated_time");
        if (timeField) {
            timeField.value = recipe.estimated_time || "";
        }

    } catch (err) {
        console.error("Error loading recipe:", err);
        alert("Failed to load recipe.");
    }
}

// Update recipe
async function updateRecipe() {
    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();

    const timeField = document.getElementById("estimated_time");
    const estimated_time = timeField ? timeField.value.trim() : "";

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

    // Attach form submit handler
    const form = document.getElementById("editRecipeForm");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            updateRecipe();
        });
    }
});