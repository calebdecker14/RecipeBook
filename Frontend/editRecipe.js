const API_BASE_URL = "http://localhost:3000";
const authToken = localStorage.getItem("token");
const params = new URLSearchParams(window.location.search);
const recipeId = params.get("id") || sessionStorage.getItem("editingRecipeId");

let titleInput = null;
let descriptionInput = null;
let estimatedTimeInput = null;
let instructionsInput = null;
let ingredientsContainer = null;
let imageInput = null;
let imagePreview = null;
let updateButton = null;
let statusBox = null;

function cacheDomElements() {
    titleInput = document.getElementById("title");
    descriptionInput = document.getElementById("description");
    estimatedTimeInput = document.getElementById("estimated_time");
    instructionsInput = document.getElementById("instructions");
    ingredientsContainer = document.getElementById("ingredientsContainer");
    imageInput = document.getElementById("image");
    imagePreview = document.getElementById("imagePreview");
    updateButton = document.getElementById("update-recipe-btn");
    statusBox = document.getElementById("edit-form-status");

    return Boolean(
        titleInput
        && descriptionInput
        && estimatedTimeInput
        && instructionsInput
        && ingredientsContainer
        && updateButton
        && statusBox
    );
}

if (!recipeId) {
    alert("No recipe selected.");
    window.location.href = "recipes.html";
}

/* ---------------- HELPERS ---------------- */
function escapeHtml(text) {
    return text ? String(text).replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[m])) : '';
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

function setSavingState(isSaving) {
    if (!updateButton) return;

    updateButton.disabled = isSaving;
    updateButton.textContent = isSaving ? "Saving..." : "Save Changes";
}

/* ---------------- INGREDIENT ROWS (with checkboxes) ---------------- */
function addIngredientRow(name = "", amount = "", checked = false) {
    if (!ingredientsContainer) return;

    const row = document.createElement("div");
    row.className = "ingredient-row" + (checked ? " checked" : "");

    row.innerHTML = `
        <input type="checkbox" class="ingredient-check" ${checked ? "checked" : ""} aria-label="Mark ingredient">
        <input class="ingredient-name" placeholder="Ingredient" value="${escapeHtml(name)}">
        <input class="ingredient-amount" placeholder="Amount" value="${escapeHtml(amount)}">
        <button type="button" class="ingredient-remove-btn">X</button>
    `;

    const checkbox = row.querySelector(".ingredient-check");
    checkbox.addEventListener("change", () => {
        row.classList.toggle("checked", checkbox.checked);
    });

    row.querySelector(".ingredient-remove-btn").onclick = () => row.remove();
    ingredientsContainer.appendChild(row);
}

function parseIngredientsForRows(raw) {
    if (!raw) return [];
    let list = raw;

    if (typeof list === "string") {
        try {
            list = JSON.parse(list);
        } catch {
            // Fallback: split on newlines/commas
            return list
                .split(/\r?\n|,/)
                .map(s => s.trim())
                .filter(Boolean)
                .map(s => ({ name: s, amount: "", checked: false }));
        }
    }

    if (!Array.isArray(list)) return [];

    return list.map((item) => {
        if (typeof item === "string") {
            return { name: item, amount: "", checked: false };
        }
        return {
            name: item.name || item.ingredient || "",
            amount: item.amount || "",
            checked: !!item.checked
        };
    });
}

function collectIngredientsFromRows() {
    return [...document.querySelectorAll(".ingredient-row")].map((row) => ({
        name: row.querySelector(".ingredient-name").value.trim(),
        amount: row.querySelector(".ingredient-amount").value.trim(),
        checked: row.querySelector(".ingredient-check").checked
    })).filter(i => i.name || i.amount);
}

function populateFormFromRecipe(recipe) {
    if (!recipe || !titleInput || !descriptionInput || !estimatedTimeInput || !instructionsInput || !ingredientsContainer) return;

    titleInput.value = recipe.title || "";
    descriptionInput.value = recipe.description || "";
    estimatedTimeInput.value = recipe.estimated_time || "";
    instructionsInput.value = recipe.instructions || "";

    ingredientsContainer.innerHTML = "";
    const ingredients = parseIngredientsForRows(recipe.ingredients);
    if (ingredients.length === 0) {
        addIngredientRow();
    } else {
        ingredients.forEach(ing => addIngredientRow(ing.name, ing.amount, ing.checked));
    }

    if (recipe.image_url && imagePreview) {
        const path = /^https?:\/\//i.test(recipe.image_url)
            ? recipe.image_url
            : `${API_BASE_URL}${recipe.image_url.startsWith("/") ? recipe.image_url : `/${recipe.image_url}`}`;
        imagePreview.innerHTML = `<img src="${path}" style="max-width:200px;" alt="Current recipe image">`;
    }
}

/* ---------------- LOAD RECIPE ---------------- */
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

/* ---------------- UPDATE RECIPE ---------------- */
async function updateRecipe() {
    if (!titleInput || !descriptionInput || !estimatedTimeInput || !instructionsInput || !ingredientsContainer) {
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
    const instructions = instructionsInput.value.trim();
    const ingredients = collectIngredientsFromRows();

    if (!title || !description || !instructions) {
        setStatus("Title, description, and instructions are required.", "error");
        return;
    }

    setSavingState(true);
    setStatus("Saving your changes...", "saving");

    const hasNewImage = imageInput && imageInput.files && imageInput.files[0];

    try {
        let res;

        if (hasNewImage) {
            // Multipart request when a new image is attached
            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", description);
            formData.append("estimated_time", estimated_time);
            formData.append("instructions", instructions);
            formData.append("ingredients", JSON.stringify(ingredients));
            formData.append("image", imageInput.files[0]);

            res = await fetchWithFallback(buildRecipeUrls(recipeId), {
                method: "PUT",
                headers: { "Authorization": `Bearer ${authToken}` },
                body: formData
            });
        } else {
            // JSON request when no new image (matches your existing backend contract)
            res = await fetchWithFallback(buildRecipeUrls(recipeId), {
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
        }

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
            setStatus("Recipe updated successfully. Redirecting...", "success");

            // CRITICAL: refresh all pages
            localStorage.setItem("recipes_last_updated", Date.now());
            sessionStorage.removeItem("editingRecipeId");
            sessionStorage.removeItem("editingRecipeData");

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

/* ---------------- INIT ---------------- */
document.addEventListener("DOMContentLoaded", () => {
    if (!cacheDomElements()) {
        alert("Failed to initialize the edit form.");
        return;
    }

    // + Add Ingredient button
    const addBtn = document.getElementById("addIngredientBtn");
    if (addBtn) addBtn.onclick = () => addIngredientRow();

    // Image preview when user picks a new file
    if (imageInput && imagePreview) {
        imageInput.addEventListener("change", function () {
            imagePreview.innerHTML = "";
            if (!this.files[0]) return;

            const img = document.createElement("img");
            img.src = URL.createObjectURL(this.files[0]);
            img.style.maxWidth = "200px";
            imagePreview.appendChild(img);
        });
    }

    // Form submit
    const form = document.getElementById("recipeForm");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            updateRecipe();
        });
    }

    loadRecipe();
});