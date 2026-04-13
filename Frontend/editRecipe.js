const token = localStorage.getItem("token");

// Get recipe ID from URL
const params = new URLSearchParams(window.location.search);
const recipeId = params.get("id");

// If no ID, redirect
if (!recipeId) {
    alert("No recipe selected.");
    window.location.href = "recipes.html";
}

// ADD INGREDIENT
function addIngredient(value = "", checked = false) {
    const container = document.getElementById("ingredients-section");

    const row = document.createElement("div");
    row.className = "ingredient-row";

    row.innerHTML = `
        <input type="checkbox" ${checked ? "checked" : ""}>
        <input type="text" class="ingredient-input" value="${value}" placeholder="Ingredient + amount">
    `;

    container.insertBefore(row, container.lastElementChild);
}

// ADD INSTRUCTION
function addInstruction(value = "") {
    const container = document.getElementById("instructions-section");

    const row = document.createElement("div");
    row.className = "instruction-row";

    row.innerHTML = `
        <input type="text" class="instruction-input" value="${value}" placeholder="Instruction step">
    `;

    container.insertBefore(row, container.lastElementChild);
}

// LOAD RECIPE
async function loadRecipe() {
    try {
        const res = await fetch(`http://localhost:3000/recipes/${recipeId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error("Failed to fetch recipe");
        }

        const recipe = await res.json();

        document.getElementById("title").value = recipe.title || "";
        document.getElementById("description").value = recipe.description || "";
        document.getElementById("estimated_time").value =
            recipe.estimated_time || "";

        // CHARACTER COUNT
        document.getElementById("char-count").innerText =
            `${recipe.description?.length || 0} / 800`;

        // LOAD INGREDIENTS
        if (recipe.ingredients) {
            const ingredients = typeof recipe.ingredients === "string"
                ? JSON.parse(recipe.ingredients)
                : recipe.ingredients;

            ingredients.forEach(item => {
                addIngredient(item.name, item.checked);
            });
        }

        // LOAD INSTRUCTIONS
        if (recipe.instructions) {
            const instructions = typeof recipe.instructions === "string"
                ? JSON.parse(recipe.instructions)
                : recipe.instructions;

            instructions.forEach(step => {
                addInstruction(step);
            });
        }

    } catch (err) {
        console.error("Load error:", err);
        alert("Failed to load recipe.");
    }
}

// UPDATE RECIPE
async function updateRecipe() {
    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const estimated_time =
        document.getElementById("estimated_time").value.trim();

    if (!title || !description) {
        alert("Title and description are required.");
        return;
    }

    const ingredients = [...document.querySelectorAll(".ingredient-row")]
        .map(row => ({
            checked: row.querySelector("input[type='checkbox']").checked,
            name: row.querySelector(".ingredient-input").value
        }));

    const instructions = [...document.querySelectorAll(".instruction-input")]
        .map(input => input.value);

    try {
        const res = await fetch(`http://localhost:3000/recipes/${recipeId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
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
            localStorage.setItem(
                "recipes_last_updated",
                Date.now().toString()
            );
            window.location.href = "recipes.html";
        } else {
            alert(data.error || "Failed to update recipe.");
        }

    } catch (err) {
        console.error("Update error:", err);
        alert("Server error. Please try again.");
    }
}

// PAGE LOAD
document.addEventListener("DOMContentLoaded", () => {
    if (!token) {
        alert("You must be logged in.");
        window.location.href = "index.html";
        return;
    }

    loadRecipe();

    // CHARACTER COUNTER
    const description = document.getElementById("description");

    if (description) {
        description.addEventListener("input", (e) => {
            document.getElementById("char-count").innerText =
                `${e.target.value.length} / 800`;
        });
    }

    // FORM SUBMIT
    const form = document.getElementById("editRecipeForm");

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            updateRecipe();
        });
    }
});