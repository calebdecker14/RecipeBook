const API_BASE_URL = "http://localhost:3000";
const authToken = localStorage.getItem("token");
const params = new URLSearchParams(window.location.search);
const recipeId = params.get("id") || sessionStorage.getItem("editingRecipeId");

let titleInput = null;
let descriptionInput = null;
let estimatedTimeInput = null;
let ingredientsInput = null;
let instructionsInput = null;
let updateButton = null;
let statusBox = null;

function cacheDomElements() {
    titleInput = document.getElementById("title");
    descriptionInput = document.getElementById("description");
    estimatedTimeInput = document.getElementById("estimated_time");
    ingredientsInput = document.getElementById("ingredients");
    instructionsInput = document.getElementById("instructions");
    updateButton = document.getElementById("update-recipe-btn");
    statusBox = document.getElementById("edit-form-status");

    return Boolean(
        titleInput
        && descriptionInput
        && estimatedTimeInput
        && ingredientsInput
        && instructionsInput
        && updateButton
        && statusBox
    );
}

if (!recipeId) {
    alert("No recipe selected.");
    window.location.href = "recipes.html";
}

function populateFormFromRecipe(recipe) {
    if (!recipe || !titleInput || !descriptionInput || !estimatedTimeInput || !ingredientsInput || !instructionsInput) return;

    titleInput.value = recipe.title || "";
    descriptionInput.value = recipe.description || "";
    estimatedTimeInput.value = recipe.estimated_time || "";
    ingredientsInput.value = normalizeIngredientsForEditor(recipe.ingredients || []);
    instructionsInput.value = recipe.instructions || "";
    syncFormUi();
}

function setStatus(message, type = "") {
    if (!statusBox) return;

    if (!message) {
        statusBox.textContent = "";
        statusBox.className = "edit-form-status hidden";
        return;
    }

    statusBox.textContent = message;
    statusBox.className = `edit-form-status is-${type}`;
}

async function fetchWithFallback(urls, options = {}) {
    let lastError = null;

    for (const url of urls) {
        try {
            const res = await fetch(url, options);
            if (res.ok) return res;

            lastError = new Error(`Request failed (${res.status}) for ${url}`);
        } catch (err) {
            lastError = err;
        }
    }

    throw lastError || new Error("Request failed");
}

function buildRecipeUrls(id) {
    return [
        `/recipes/${id}`,
        `/api/recipes/${id}`,
        `${API_BASE_URL}/recipes/${id}`
    ];
}

function normalizeIngredientsForEditor(ingredients) {
    let list = ingredients;

    if (typeof list === "string") {
        try {
            list = JSON.parse(list);
        } catch {
            list = list.split(/[\n,]+/);
        }
    }

    if (!Array.isArray(list)) return "";

    return list.map((item) => {
        if (typeof item === "string") return item.trim();

        const amount = (item.amount || "").trim();
        const name = (item.name || item.ingredient || "").trim();
        return `${amount} ${name}`.trim();
    }).filter(Boolean).join("\n");
}

function parseIngredientsInput(rawValue) {
    return rawValue
        .split(/[\n,]+/)
        .map(item => item.trim())
        .filter(Boolean);
}

function setTextIfPresent(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
}

function syncFormUi() {
    if (!titleInput || !descriptionInput || !estimatedTimeInput || !ingredientsInput || !instructionsInput) return;

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const estimatedTime = estimatedTimeInput.value.trim();
    const ingredients = parseIngredientsInput(ingredientsInput.value);
    const instructions = instructionsInput.value.trim();

    setTextIfPresent("title-count", `${titleInput.value.length}/25`);
    setTextIfPresent("description-count", `${descriptionInput.value.length}/800`);
    setTextIfPresent("instructions-count", `${instructionsInput.value.length} chars`);
    setTextIfPresent("ingredients-count", `${ingredients.length} item${ingredients.length === 1 ? "" : "s"}`);

    setTextIfPresent("preview-title", title || "Untitled recipe");
    setTextIfPresent("preview-description", description || "Your recipe summary will appear here as you type.");
    setTextIfPresent("preview-time", estimatedTime || "Time not set");
    setTextIfPresent("preview-ingredient-total", `${ingredients.length} ingredient${ingredients.length === 1 ? "" : "s"}`);

    const ingredientPreviewList = document.getElementById("ingredient-preview-list");
    if (ingredientPreviewList) {
        ingredientPreviewList.innerHTML = "";

        if (!ingredients.length) {
            const emptyState = document.createElement("li");
            emptyState.textContent = "Add ingredients to preview them here.";
            ingredientPreviewList.appendChild(emptyState);
        } else {
            ingredients.forEach((ingredient) => {
                const item = document.createElement("li");
                item.textContent = ingredient;
                ingredientPreviewList.appendChild(item);
            });
        }
    }

    if (instructions) {
        setStatus("", "");
    }
}

function setSavingState(isSaving) {
    if (!updateButton) return;

    updateButton.disabled = isSaving;
    updateButton.textContent = isSaving ? "Saving..." : "Save Changes";
}

// Load recipe
async function loadRecipe() {
    try {
        const headers = authToken ? { "Authorization": `Bearer ${authToken}` } : {};
        const res = await fetchWithFallback(buildRecipeUrls(recipeId), { headers });

        const recipe = await res.json();
        populateFormFromRecipe(recipe);

        // Keep the latest recipe context in case a user refreshes while editing.
        sessionStorage.setItem("editingRecipeId", String(recipe.id || recipeId));
        sessionStorage.setItem("editingRecipeData", JSON.stringify(recipe));

    } catch (err) {
        console.error(err);

        const cachedRecipe = sessionStorage.getItem("editingRecipeData");
        if (cachedRecipe) {
            try {
                populateFormFromRecipe(JSON.parse(cachedRecipe));
                setStatus("Loaded saved recipe details from your current session.", "success");
                return;
            } catch (cacheErr) {
                console.error("Failed to parse cached recipe data", cacheErr);
            }
        }

        setStatus("Failed to load recipe.", "error");
        alert("Failed to load recipe details. Please confirm you opened Edit from My Recipes.");
    }
}

// Update recipe
async function updateRecipe() {

    if (!titleInput || !descriptionInput || !estimatedTimeInput || !ingredientsInput || !instructionsInput) {
        alert("Edit form is not ready. Please refresh and try again.");
        return;
    }

    if (!authToken) {
        setStatus("Please log in before saving recipe changes.", "error");
        return;
    }

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const estimated_time = estimatedTimeInput.value.trim();
    const ingredientsRaw = ingredientsInput.value;
    const instructions = instructionsInput.value.trim();

    const ingredients = parseIngredientsInput(ingredientsRaw);

    if (!title || !description || !instructions) {
        setStatus("Title, description, and instructions are required.", "error");
        return;
    }

    setSavingState(true);
    setStatus("Saving your changes...", "saving");

    try {
        const res = await fetchWithFallback(buildRecipeUrls(recipeId), {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
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
            setStatus("Recipe updated successfully. Redirecting...", "success");

            //  CRITICAL: refresh all pages
            localStorage.setItem("recipes_last_updated", Date.now());

            window.setTimeout(() => {
                window.location.href = "recipes.html";
            }, 700);
        } else {
            setStatus(data.error || "Update failed", "error");
        }

    } catch (err) {
        console.error(err);
        setStatus("Server error.", "error");
    } finally {
        setSavingState(false);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (!cacheDomElements()) {
        alert("Failed to initialize the edit form.");
        return;
    }

    loadRecipe();

    [titleInput, descriptionInput, estimatedTimeInput, ingredientsInput, instructionsInput].forEach((field) => {
        field.addEventListener("input", syncFormUi);
    });

    syncFormUi();

    document.getElementById("editRecipeForm")
        .addEventListener("submit", (e) => {
            e.preventDefault();
            updateRecipe();
        });
});