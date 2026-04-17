const token = localStorage.getItem("token");

const params = new URLSearchParams(window.location.search);
const recipeId = params.get("id");

if (!recipeId) {
    alert("No recipe selected.");
    window.location.href = "recipes.html";
}

// Load recipe
async function loadRecipe() {
    try {
        const res = await fetch(`http://localhost:3000/recipes/${recipeId}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error("Failed to fetch recipe");

        const recipe = await res.json();

        document.getElementById("title").value = recipe.title || "";
        document.getElementById("description").value = recipe.description || "";
        document.getElementById("estimated_time").value = recipe.estimated_time || "";

        // Convert ingredients array → string
        document.getElementById("ingredients").value =
            (recipe.ingredients || []).join(", ");

        document.getElementById("instructions").value =
            recipe.instructions || "";

    } catch (err) {
        console.error(err);
        alert("Failed to load recipe.");
    }
}

// Update recipe
async function updateRecipe() {

    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const estimated_time = document.getElementById("estimated_time").value.trim();
    const ingredientsRaw = document.getElementById("ingredients").value;
    const instructions = document.getElementById("instructions").value.trim();

    // Convert string → array
    const ingredients = ingredientsRaw
        .split(",")
        .map(i => i.trim())
        .filter(i => i.length > 0);

    if (!title || !description || !instructions) {
        alert("Title, description, and instructions are required.");
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/recipes/${recipeId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                description,
                estimated_time,
                ingredients,
                instructions
            })
        });

        const data = await res.json();

        if (res.ok) {
            alert("Recipe updated successfully!");

            //  CRITICAL: refresh all pages
            localStorage.setItem("recipes_last_updated", Date.now());

            window.location.href = "recipes.html";
        } else {
            alert(data.error || "Update failed");
        }

    } catch (err) {
        console.error(err);
        alert("Server error.");
    }
}

document.addEventListener("DOMContentLoaded", () => {

    if (!token) {
        alert("Login required.");
        window.location.href = "index.html";
        return;
    }

    loadRecipe();

    document.getElementById("editRecipeForm")
        .addEventListener("submit", (e) => {
            e.preventDefault();
            updateRecipe();
        });
});