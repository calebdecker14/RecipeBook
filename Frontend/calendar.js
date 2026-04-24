// -------- GLOBALS --------
let draggedRecipeId = null;
let draggedRecipeTitle = null;
let draggedRecipeImage = null;

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

// store all recipes so we can look them up when loading saved plans
window.allRecipes = [];

// -------- INITIALIZE PAGE --------
document.addEventListener("DOMContentLoaded", () => {
    generateCalendar();
    loadRecipes(); 
    setupSearch();

    const prevBtn = document.getElementById("prevMonth");
    const nextBtn = document.getElementById("nextMonth");

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener("click", () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            generateCalendar();
            loadSavedMealPlan(); 
        });

        nextBtn.addEventListener("click", () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            generateCalendar();
            loadSavedMealPlan(); 
        });
    }
});

// -------- GENERATE CALENDAR --------
function generateCalendar() {
    const calendarGrid = document.getElementById("calendarGrid");
    const monthLabel = document.getElementById("monthLabel");
    calendarGrid.innerHTML = "";

    const today = new Date();
    const year = currentYear;
    const month = currentMonth;

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    monthLabel.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.classList.add("calendar-day", "empty");
        calendarGrid.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement("div");
        dayCell.classList.add("calendar-day");
        // Ensure month and day are padded to match DB style YYYY-MM-DD
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        dayCell.dataset.date = dateStr;

        const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();

        if (isToday) dayCell.classList.add("today");

        dayCell.innerHTML = `
            <div class="day-number">${day}</div>
            <div class="day-recipes"></div>
        `;

        dayCell.addEventListener("dragover", (e) => e.preventDefault());
        dayCell.addEventListener("drop", async (e) => await handleDrop(e, dayCell));

        calendarGrid.appendChild(dayCell);
    }
}

// -------- IMAGE URL FIXER --------
function resolveImageUrl(imageUrl) {
    if (!imageUrl) return "http://localhost:3000/uploads/placeholder.png";
    if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
    return `http://localhost:3000${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
}

// -------- LOAD RECIPES --------
async function loadRecipes() {
    const recipeList = document.getElementById("recipeList");
    recipeList.innerHTML = "Loading recipes...";

    try {
        const response = await fetch("http://localhost:3000/recipes");
        const recipes = await response.json();

        window.allRecipes = recipes; 
        console.log("Recipes Loaded into window.allRecipes:", window.allRecipes.length);

        recipeList.innerHTML = "";

        recipes.forEach(recipe => {
            const item = document.createElement("div");
            item.classList.add("recipe-item");
            item.draggable = true;

            const imgUrl = resolveImageUrl(recipe.imageUrl || recipe.image_url);

            item.addEventListener("dragstart", () => {
                draggedRecipeId = recipe.id;
                draggedRecipeTitle = recipe.title;
                draggedRecipeImage = imgUrl;
            });

            item.innerHTML = `
                <img src="${imgUrl}" alt="${recipe.title}">
                <span class="recipe-title">${recipe.title}</span>
            `;

            recipeList.appendChild(item);
        });

        loadSavedMealPlan();

    } catch (error) {
        recipeList.innerHTML = "Failed to load recipes.";
        console.error("Error loading recipes:", error);
    }
}

// -------- HANDLE DROP --------
async function handleDrop(event, dayCell) {
    if (!draggedRecipeId) return;

    removeDraggedTag();

    const container = dayCell.querySelector(".day-recipes");
    const dateStr = dayCell.dataset.date;

    const recipeTag = createRecipeTag(draggedRecipeId, draggedRecipeTitle, draggedRecipeImage, dateStr);
    container.appendChild(recipeTag);

    saveMealPlan(dateStr, draggedRecipeId);
    await appendRecipeIngredientsToShoppingList(draggedRecipeId);
    draggedRecipeId = null;
}

// Helper to create the tag (used by drop and load)
function createRecipeTag(id, title, img, date) {
    const tag = document.createElement("div");
    tag.classList.add("calendar-recipe-tag");
    tag.draggable = true;
    tag.dataset.id = id;
    tag.dataset.title = title;
    tag.dataset.image = img;
    tag.dataset.date = date;

    tag.innerHTML = `
        <img src="${img}" alt="">
        <span>${title}</span>
    `;

    tag.addEventListener("dragstart", () => {
        setTimeout(() => tag.classList.add("being-dragged"), 0);
        draggedRecipeId = tag.dataset.id;
        draggedRecipeTitle = tag.dataset.title;
        draggedRecipeImage = tag.dataset.image;
    });

    tag.addEventListener("dragend", () => {
        const stillDragging = document.querySelector(".being-dragged");
        if (stillDragging) {
            deleteMealPlan(stillDragging.dataset.date, stillDragging.dataset.id);
            stillDragging.remove();
        }
    });

    return tag;
}

// -------- LOAD SAVED MEAL PLAN --------
async function loadSavedMealPlan() {
    try {
        console.log("Fetching saved meals...");
        const res = await fetch("http://localhost:3000/mealplan/my", {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });

        const savedMeals = await res.json();
        console.log("Meals received from DB:", savedMeals);

        savedMeals.forEach(entry => {
            // Normalize DB date to YYYY-MM-DD using UTC to match calendar attributes
            const d = new Date(entry.date);
            const year = d.getUTCFullYear();
            const month = d.getUTCMonth();
            const day = d.getUTCDate();
            const formattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

            // Only show if it belongs to the current month view
            if (year !== currentYear || month !== currentMonth) return;

            const dayCell = document.querySelector(`[data-date="${formattedDate}"]`);
            if (!dayCell) {
                console.warn("Could not find calendar cell for date:", formattedDate);
                return;
            }

            // Find full recipe details from our pre-loaded list
            const recipe = window.allRecipes.find(r => String(r.id) === String(entry.recipeId));
            
            if (recipe) {
                const container = dayCell.querySelector(".day-recipes");
                const imgUrl = resolveImageUrl(recipe.imageUrl || recipe.image_url);
                const tag = createRecipeTag(entry.recipeId, recipe.title, imgUrl, formattedDate);
                container.appendChild(tag);
            } else {
                console.error("Recipe detail missing for ID:", entry.recipeId);
            }
        });

    } catch (error) {
        console.error("Error loading saved meal plan:", error);
    }
}

// -------- SAVE & DELETE HELPERS --------
async function saveMealPlan(date, recipeId) {
    try {
        await fetch("http://localhost:3000/mealplan", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({ date, recipeId })
        });
    } catch (error) {
        console.error("Error saving meal plan:", error);
    }
}

function normalizeIngredientLine(line) {
    return line.trim().replace(/\s+/g, ' ').toLowerCase();
}

function buildIngredientLine(item) {
    if (!item) return '';
    if (typeof item === 'string') return item.trim();
    const name = item.name || item.ingredient || '';
    const amount = item.amount || '';
    return `${amount} ${name}`.trim();
}

async function appendRecipeIngredientsToShoppingList(recipeId) {
    if (!recipeId) return;

    const recipe = window.allRecipes.find(r => String(r.id) === String(recipeId));
    if (!recipe || !recipe.ingredients) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch('/api/shopping-list', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            console.warn('Could not load shopping list to append ingredients.');
            return;
        }

        const data = await res.json();
        const existingLines = (data.listContent || '')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        const existingSet = new Set(existingLines.map(normalizeIngredientLine));
        const newLines = [];

        const ingredients = Array.isArray(recipe.ingredients)
            ? recipe.ingredients
            : [recipe.ingredients];

        ingredients.forEach(item => {
            const line = buildIngredientLine(item);
            if (!line) return;
            const normalized = normalizeIngredientLine(line);
            if (existingSet.has(normalized)) return;
            existingSet.add(normalized);
            newLines.push(line);
        });

        if (!newLines.length) return;

        const updatedContent = existingLines.concat(newLines).join('\n');

        await fetch('/api/shopping-list', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ listContent: updatedContent })
        });
    } catch (error) {
        console.error('Error appending recipe ingredients to shopping list:', error);
    }
}

async function deleteMealPlan(date, recipeId) {
    try {
        await fetch("http://localhost:3000/mealplan", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({ date, recipeId })
        });
    } catch (error) {
        console.error("Error deleting meal plan:", error);
    }
}

function removeDraggedTag() {
    document.querySelectorAll(".being-dragged").forEach(tag => tag.remove());
}

function setupSearch() {
    const searchInput = document.getElementById("recipeSearch");
    searchInput.addEventListener("input", () => {
        const filter = searchInput.value.toLowerCase();
        document.querySelectorAll(".recipe-item").forEach(item => {
            item.style.display = item.innerText.toLowerCase().includes(filter) ? "flex" : "none";
        });
    });
}